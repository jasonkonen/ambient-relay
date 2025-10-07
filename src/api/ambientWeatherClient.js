const axios = require('axios');

class AmbientWeatherClient {
  constructor(applicationKey, apiKey) {
    if (!applicationKey || !apiKey) {
      throw new Error('APPLICATION_KEY and API_KEY are required');
    }

    this.applicationKey = applicationKey;
    this.apiKey = apiKey;
    this.baseUrl = 'https://rt.ambientweather.net/v1';
    
    // Rate limiting: 1 request per second per apiKey
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second in milliseconds
  }

  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async getDevices() {
    await this.waitForRateLimit();
    
    try {
      console.log('Fetching devices from Ambient Weather API...');
      const response = await axios.get(`${this.baseUrl}/devices`, {
        params: {
          applicationKey: this.applicationKey,
          apiKey: this.apiKey
        },
        timeout: 10000
      });

      console.log(`Successfully fetched ${response.data.length} device(s)`);
      return response.data;
    } catch (error) {
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const message = error.response.data?.message || error.response.statusText;
        
        if (status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        } else if (status === 401) {
          throw new Error('Authentication failed. Please check your API keys.');
        } else {
          throw new Error(`API error (${status}): ${message}`);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from Ambient Weather API. Please check your internet connection.');
      } else {
        // Something else went wrong
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async getDeviceData(macAddress, options = {}) {
    await this.waitForRateLimit();
    
    const { endDate, limit = 1 } = options;
    
    try {
      console.log(`Fetching data for device ${macAddress}...`);
      const params = {
        applicationKey: this.applicationKey,
        apiKey: this.apiKey,
        limit
      };

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await axios.get(`${this.baseUrl}/devices/${macAddress}`, {
        params,
        timeout: 10000
      });

      console.log(`Successfully fetched ${response.data.length} data point(s) for device ${macAddress}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.statusText;
        
        if (status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        } else if (status === 401) {
          throw new Error('Authentication failed. Please check your API keys.');
        } else if (status === 404) {
          throw new Error(`Device ${macAddress} not found.`);
        } else {
          throw new Error(`API error (${status}): ${message}`);
        }
      } else if (error.request) {
        throw new Error('No response from Ambient Weather API. Please check your internet connection.');
      } else {
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  async getAllDevicesData() {
    try {
      const devices = await this.getDevices();
      
      if (!devices || devices.length === 0) {
        console.log('No devices found for this account');
        return [];
      }

      // Return devices with their lastData
      // The /devices endpoint already includes the most recent data
      return devices;
    } catch (error) {
      console.error('Error fetching all devices data:', error.message);
      throw error;
    }
  }
}

module.exports = AmbientWeatherClient;
