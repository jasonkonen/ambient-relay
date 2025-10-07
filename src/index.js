require('dotenv').config();
const express = require('express');
const Database = require('./db/database');
const AmbientWeatherClient = require('./api/ambientWeatherClient');

// Configuration
const CONFIG = {
  applicationKey: process.env.APPLICATION_KEY,
  apiKey: process.env.API_KEY,
  pollIntervalMinutes: parseInt(process.env.POLL_INTERVAL_MINUTES) || 5,
  httpPort: parseInt(process.env.HTTP_PORT) || 3000,
};

// Validate configuration
function validateConfig() {
  const errors = [];
  
  if (!CONFIG.applicationKey) {
    errors.push('APPLICATION_KEY environment variable is required');
  }
  
  if (!CONFIG.apiKey) {
    errors.push('API_KEY environment variable is required');
  }
  
  if (CONFIG.pollIntervalMinutes < 1) {
    errors.push('POLL_INTERVAL_MINUTES must be at least 1 minute');
  }
  
  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log('Configuration validated successfully:');
  console.log(`  - Poll Interval: ${CONFIG.pollIntervalMinutes} minute(s)`);
  console.log(`  - HTTP Port: ${CONFIG.httpPort}`);
}

// Global instances
let db;
let apiClient;
let pollIntervalId;

// Data polling function
async function pollWeatherData() {
  try {
    console.log(`[${new Date().toISOString()}] Polling weather data...`);
    
    // Fetch all devices and their latest data
    const devices = await apiClient.getAllDevicesData();
    
    if (!devices || devices.length === 0) {
      console.log('No devices found');
      return;
    }
    
    // Store data for each device
    for (const device of devices) {
      if (device.lastData) {
        try {
          const result = await db.insertWeatherData(device, device.lastData);
          console.log(`Stored weather data for device ${device.macAddress} (ID: ${result.id})`);
        } catch (error) {
          console.error(`Failed to store data for device ${device.macAddress}:`, error.message);
        }
      } else {
        console.log(`No lastData available for device ${device.macAddress}`);
      }
    }
    
    console.log('Weather data polling completed successfully');
  } catch (error) {
    console.error('Error polling weather data:', error.message);
  }
}

// Start the polling scheduler
function startScheduler() {
  const intervalMs = CONFIG.pollIntervalMinutes * 60 * 1000;
  
  console.log(`Starting scheduler with ${CONFIG.pollIntervalMinutes} minute interval...`);
  
  // Poll immediately on startup
  pollWeatherData();
  
  // Then poll at regular intervals
  pollIntervalId = setInterval(pollWeatherData, intervalMs);
  
  console.log('Scheduler started successfully');
}

// Stop the polling scheduler
function stopScheduler() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
    console.log('Scheduler stopped');
  }
}

// Initialize Express app
function createApp() {
  const app = express();
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      config: {
        pollIntervalMinutes: CONFIG.pollIntervalMinutes
      }
    });
  });
  
  // Latest weather data endpoint
  app.get('/api/latest', async (req, res) => {
    try {
      const latestData = await db.getLatestWeatherData();
      
      if (!latestData) {
        return res.status(404).json({
          error: 'No weather data available',
          message: 'No weather data has been recorded yet. Please wait for the first poll cycle.'
        });
      }
      
      // Remove mac_address from response and override device_location if configured
      const { mac_address, device_location, ...publicData } = latestData;
      
      // Override device_location with environment variable if set
      if (process.env.DEVICE_LOCATION) {
        publicData.device_location = process.env.DEVICE_LOCATION;
      } else if (device_location) {
        publicData.device_location = device_location;
      }
      
      res.json(publicData);
    } catch (error) {
      console.error('Error fetching latest weather data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch latest weather data'
      });
    }
  });
  
  // Get latest data for a specific device by MAC address
  app.get('/api/latest/:macAddress', async (req, res) => {
    try {
      const { macAddress } = req.params;
      const latestData = await db.getLatestWeatherDataByDevice(macAddress);
      
      if (!latestData) {
        return res.status(404).json({
          error: 'No weather data available',
          message: `No weather data found for device ${macAddress}`
        });
      }
      
      res.json(latestData);
    } catch (error) {
      console.error('Error fetching device weather data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch device weather data'
      });
    }
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested endpoint does not exist',
      availableEndpoints: [
        'GET /health',
        'GET /api/latest',
        'GET /api/latest/:macAddress'
      ]
    });
  });
  
  return app;
}

// Graceful shutdown handler
async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  stopScheduler();
  
  if (db) {
    await db.close();
  }
  
  console.log('Shutdown complete');
  process.exit(0);
}

// Main application entry point
async function main() {
  console.log('=== Ambient Weather Relay ===');
  console.log('Starting application...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize database
    db = new Database();
    await db.initialize();
    
    // Initialize API client
    apiClient = new AmbientWeatherClient(CONFIG.applicationKey, CONFIG.apiKey);
    console.log('Ambient Weather API client initialized');
    
    // Create and start Express server
    const app = createApp();
    const server = app.listen(CONFIG.httpPort, () => {
      console.log(`HTTP server listening on port ${CONFIG.httpPort}`);
      console.log(`  - Health check: http://localhost:${CONFIG.httpPort}/health`);
      console.log(`  - Latest data: http://localhost:${CONFIG.httpPort}/api/latest`);
    });
    
    // Start the polling scheduler
    startScheduler();
    
    // Setup graceful shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    console.log('\nApplication started successfully!');
    console.log('Press Ctrl+C to stop\n');
    
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
}

// Start the application
main();
