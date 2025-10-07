# Ambient Weather Relay

A Docker container that polls the Ambient Weather API, stores weather data in a PostgreSQL database, and provides a JSON API endpoint for local access without requiring direct API authentication.

## Features

- 🔄 **Automatic Data Polling**: Fetches weather data at configurable intervals (default: 5 minutes, minimum: 1 minute)
- 💾 **Historical Data Storage**: Stores all weather readings in PostgreSQL for future analysis
- 🌐 **JSON API**: Simple HTTP endpoint to access the latest weather data
- 🐳 **Docker Ready**: Single container with embedded PostgreSQL database
- 📊 **Multiple Devices**: Supports multiple weather stations on one account
- 🔒 **API Rate Limiting**: Built-in rate limiting respects Ambient Weather API constraints
- 🏥 **Health Checks**: Automatic health monitoring for container management

## Storage Requirements

Historical data storage is very efficient:

| Polling Interval | Storage per Year |
|-----------------|------------------|
| 1 minute        | ~158 MB          |
| 5 minutes       | ~32 MB           |
| 1 hour          | ~2.6 MB          |

Even at 1-minute intervals, you'll only use approximately 1.5 GB over 10 years.

## Prerequisites

- Docker and Docker Compose installed
- Ambient Weather account with a weather station
- Ambient Weather API keys (get them from https://ambientweather.net/account)

## Quick Start

### 1. Get Your API Keys

1. Log in to your Ambient Weather account at https://ambientweather.net/account
2. Create an **Application Key** (identifies your application)
3. Create an **API Key** (grants access to your weather data)

### 2. Clone or Download This Repository

```bash
git clone <repository-url>
cd ambient_relay
```

### 3. Configure Environment Variables

Copy the example environment file and edit it with your API keys:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Edit the `.env` file with your actual API keys:

```env
APPLICATION_KEY=your_actual_application_key
API_KEY=your_actual_api_key
POLL_INTERVAL_MINUTES=5
POSTGRES_PASSWORD=your_secure_password
```

### 4. Build and Run

```bash
docker-compose up -d
```

The container will:
1. Initialize PostgreSQL database
2. Create necessary tables
3. Start polling the Ambient Weather API
4. Begin serving the JSON API

### 5. Access Your Weather Data

Once running, access the latest weather data:

```bash
# Get the latest reading from any device
curl http://localhost:3000/api/latest

# Get the latest reading from a specific device
curl http://localhost:3000/api/latest/00:00:00:00:00:00

# Check health status
curl http://localhost:3000/health
```

## Configuration

All configuration is done via environment variables in the `.env` file:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APPLICATION_KEY` | ✅ Yes | - | Your Ambient Weather application key |
| `API_KEY` | ✅ Yes | - | Your Ambient Weather API key |
| `POLL_INTERVAL_MINUTES` | No | 5 | Data polling interval (minimum: 1) |
| `HTTP_PORT` | No | 3000 | Port for the JSON API server |
| `POSTGRES_DB` | No | ambient_weather | PostgreSQL database name |
| `POSTGRES_USER` | No | ambient | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ Yes | - | PostgreSQL password |

## API Endpoints

### GET /health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T10:00:00.000Z",
  "config": {
    "pollIntervalMinutes": 5
  }
}
```

### GET /api/latest

Returns the most recent weather data from any device.

**Response:**
```json
{
  "id": 123,
  "mac_address": "00:00:00:00:00:00",
  "device_name": "My Weather Station",
  "device_location": "Backyard",
  "dateutc": 1515436500000,
  "date": "2018-01-08T18:35:00.000Z",
  "tempf": 66.9,
  "humidity": 30,
  "windspeedmph": 0.9,
  "baromrelin": 30.05,
  "dailyrainin": 0,
  "raw_data": { ... }
}
```

### GET /api/latest/:macAddress

Returns the most recent weather data for a specific device.

**Parameters:**
- `macAddress` - The MAC address of the device (e.g., `00:00:00:00:00:00`)

## Deployment on Unraid

### Using Docker Compose (Recommended)

1. Copy the project folder to your Unraid server (e.g., `/mnt/user/appdata/ambient-relay/`)
2. Create your `.env` file with your API keys
3. Navigate to the folder via SSH or terminal
4. Run: `docker-compose up -d`

### Using Unraid Docker UI

1. **Container Name**: ambient-relay
2. **Repository**: Build from your local Dockerfile
3. **Network Type**: Bridge
4. **Port Mapping**: 
   - Container Port: 3000
   - Host Port: 3000 (or your preferred port)
5. **Environment Variables**:
   - APPLICATION_KEY: [your application key]
   - API_KEY: [your api key]
   - POLL_INTERVAL_MINUTES: 5
   - POSTGRES_PASSWORD: [secure password]
6. **Volume Mappings**:
   - Container Path: /var/lib/postgresql/data
   - Host Path: /mnt/user/appdata/ambient-relay/postgres-data
   - Container Path: /var/lib/postgresql
   - Host Path: /mnt/user/appdata/ambient-relay/postgres-logs

## Accessing Data from Other Applications

Other applications can fetch weather data without Ambient Weather API credentials:

```bash
# From another container on the same network
curl http://ambient-relay:3000/api/latest

# From the host machine
curl http://localhost:3000/api/latest

# From another machine on the network
curl http://<server-ip>:3000/api/latest
```

Example with Home Assistant:

```yaml
sensor:
  - platform: rest
    resource: http://ambient-relay:3000/api/latest
    name: Ambient Weather
    json_attributes:
      - tempf
      - humidity
      - windspeedmph
      - baromrelin
    value_template: '{{ value_json.tempf }}'
```

## Logs and Monitoring

View container logs:

```bash
docker-compose logs -f
```

Check container health:

```bash
docker ps
# Look for "(healthy)" status
```

Access PostgreSQL directly (if needed):

```bash
docker exec -it ambient-relay su-exec postgres psql -d ambient_weather
```

## Troubleshooting

### Container won't start

- Check your `.env` file has valid API keys
- Ensure port 3000 is not already in use
- Check logs: `docker-compose logs`

### No data being stored

- Verify your API keys are correct
- Check if you have weather stations associated with your account
- Review logs for API errors: `docker-compose logs -f`

### API returns 404 "No weather data available"

- Wait for the first poll cycle to complete (check your `POLL_INTERVAL_MINUTES`)
- Check logs to ensure data is being fetched and stored

### Rate limit errors

- The API has a limit of 1 request/second per API key
- Default 5-minute polling interval is well within limits
- If using multiple applications, coordinate API usage

## Database Schema

The weather data is stored with the following structure:

- **Primary Fields**: All standard Ambient Weather data fields
- **Timestamps**: Both UTC milliseconds and ISO timestamp
- **Device Info**: MAC address, name, and location
- **Raw Data**: Complete JSON for any additional fields
- **Indexes**: Optimized for quick queries by date and device

## Development

To run locally for development:

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

Note: You'll need PostgreSQL running locally for development.

## License

MIT License - See LICENSE file for details

## Support

For issues with:
- **This container**: Open an issue in this repository
- **Ambient Weather API**: Visit https://ambientweather.net/
- **Your weather station**: Contact Ambient Weather support

## Acknowledgments

- Built for the Ambient Weather API (https://ambientweather.net/)
- API Documentation: https://github.com/ambient-weather/api-docs
