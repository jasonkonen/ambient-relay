# Installing Ambient Weather Relay on Unraid

This guide will walk you through deploying the Ambient Weather Relay container on your Unraid server.

## Method 1: Using Docker Compose (Recommended)

### Step 1: Copy Files to Unraid

1. **Create the application directory on Unraid:**
   ```bash
   mkdir -p /mnt/user/appdata/ambient-relay
   ```

2. **Copy all project files from your Mac to Unraid:**
   
   From your Mac, run (this includes hidden files like .env):
   ```bash
   # Replace YOUR_UNRAID_IP with your Unraid server's IP address
   # Replace YOUR_USERNAME with your Mac username
   cd /Users/YOUR_USERNAME/Projects/ambient_relay
   
   # Copy all files including hidden ones
   rsync -av --progress . root@YOUR_UNRAID_IP:/mnt/user/appdata/ambient-relay/
   ```
   
   Or if rsync isn't available, use this method:
   ```bash
   # Replace YOUR_USERNAME with your Mac username
   # First copy visible files
   scp -r /Users/YOUR_USERNAME/Projects/ambient_relay/* root@YOUR_UNRAID_IP:/mnt/user/appdata/ambient-relay/
   
   # Then explicitly copy the .env file
   scp /Users/YOUR_USERNAME/Projects/ambient_relay/.env root@YOUR_UNRAID_IP:/mnt/user/appdata/ambient-relay/
   ```
   
   Or use an SFTP client like FileZilla (make sure "Show hidden files" is enabled) to copy the entire `ambient_relay` folder to `/mnt/user/appdata/ambient-relay/`

### Step 2: Configure Environment Variables

1. **SSH into your Unraid server:**
   ```bash
   ssh root@YOUR_UNRAID_IP
   ```

2. **Navigate to the directory:**
   ```bash
   cd /mnt/user/appdata/ambient-relay
   ```

3. **Verify your .env file is present:**
   ```bash
   cat .env
   ```
   
   Ensure it contains your API keys and configuration.

### Step 3: Install Docker Compose on Unraid (if not already installed)

```bash
# Check if docker-compose is installed
docker-compose --version

# If not installed, install it via Nerd Tools plugin or manually:
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Step 4: Deploy the Container

```bash
cd /mnt/user/appdata/ambient-relay
docker-compose up -d
```

### Step 5: Verify It's Running

```bash
# Check container status
docker ps | grep ambient-relay

# View logs
docker-compose logs -f

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/latest
```

### Step 6: Access from Other Devices

Once running, access the API from any device on your network:
```
http://YOUR_UNRAID_IP:3000/api/latest
```

---

## Method 2: Using Unraid Docker UI

If you prefer using Unraid's web interface:

### Step 1: Prepare Files

1. Copy the entire project folder to `/mnt/user/appdata/ambient-relay/` (as in Method 1, Step 1-2)

### Step 2: Add Container via Unraid UI

1. Go to **Docker** tab in Unraid web interface
2. Click **Add Container**
3. Configure as follows:

**Basic Settings:**
- **Name:** `ambient-relay`
- **Repository:** Leave blank (we'll build locally)
- **Network Type:** `Bridge`

**Port Mappings:**
- **Container Port:** `3000`
- **Host Port:** `3000` (or your preferred port)
- **Connection Type:** `TCP`

**Path Mappings:**
- **Container Path:** `/var/lib/postgresql/data`
  **Host Path:** `/mnt/user/appdata/ambient-relay/postgres-data`
  
- **Container Path:** `/var/lib/postgresql`
  **Host Path:** `/mnt/user/appdata/ambient-relay/postgres-logs`

- **Container Path:** `/app`
  **Host Path:** `/mnt/user/appdata/ambient-relay`

**Environment Variables:**
Add each of these:
- `APPLICATION_KEY` = `your_application_key`
- `API_KEY` = `your_api_key`
- `POLL_INTERVAL_MINUTES` = `1`
- `HTTP_PORT` = `3000`
- `DEVICE_LOCATION` = `Verona, WI, USA`
- `POSTGRES_DB` = `ambient_weather`
- `POSTGRES_USER` = `ambient`
- `POSTGRES_PASSWORD` = `your_secure_password`
- `POSTGRES_HOST` = `localhost`
- `POSTGRES_PORT` = `5432`

4. Click **Apply**

**Note:** Using the Unraid UI requires the image to be pre-built. It's easier to use Method 1 with docker-compose.

---

## Method 3: Quick Deploy Script

For convenience, here's a one-line deploy script:

### Step 1: Create deploy script on Unraid

SSH into Unraid and create this file:

```bash
cat > /mnt/user/appdata/ambient-relay/deploy.sh << 'EOF'
#!/bin/bash
cd /mnt/user/appdata/ambient-relay
docker-compose down
docker-compose up -d --build
echo "Container deployed! Check status with: docker ps"
echo "View logs with: docker-compose logs -f"
echo "Test API with: curl http://localhost:3000/api/latest"
EOF

chmod +x /mnt/user/appdata/ambient-relay/deploy.sh
```

### Step 2: Deploy

```bash
/mnt/user/appdata/ambient-relay/deploy.sh
```

---

## Updating the Container

To update after making changes:

```bash
cd /mnt/user/appdata/ambient-relay
docker-compose down
docker-compose up -d --build
```

Or use the deploy script:
```bash
/mnt/user/appdata/ambient-relay/deploy.sh
```

---

## Troubleshooting

### Check Container Status
```bash
docker ps -a | grep ambient-relay
```

### View Logs
```bash
cd /mnt/user/appdata/ambient-relay
docker-compose logs -f
```

### Restart Container
```bash
cd /mnt/user/appdata/ambient-relay
docker-compose restart
```

### Stop Container
```bash
cd /mnt/user/appdata/ambient-relay
docker-compose down
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Latest weather data
curl http://localhost:3000/api/latest

# Pretty print with jq (if installed)
curl -s http://localhost:3000/api/latest | jq
```

### Common Issues

**"Cannot connect to Docker daemon"**
- Docker service isn't running on Unraid (should auto-start)
- Try: `service docker start`

**"Port 3000 already in use"**
- Change `HTTP_PORT` in `.env` file to a different port (e.g., 3001)
- Update docker-compose.yml port mapping
- Restart container

**"Authentication failed"**
- Verify API keys in `.env` are correct
- Make sure APPLICATION_KEY and API_KEY are different
- Check keys at https://ambientweather.net/account

**Container keeps restarting**
- Check logs: `docker-compose logs`
- Verify .env file has all required variables
- Ensure PostgreSQL has write permissions to data directory

---

## Making It Persistent

The docker-compose.yml is configured to:
- Auto-restart on failures (`restart: unless-stopped`)
- Persist data in Docker volumes
- Survive Unraid reboots

To ensure it starts on Unraid boot, the `unless-stopped` policy handles this automatically.

---

## Accessing from Network

Once deployed, access the API from any device on your network:

```
http://YOUR_UNRAID_IP:3000/health
http://YOUR_UNRAID_IP:3000/api/latest
```

For example with Home Assistant, add to `configuration.yaml`:

```yaml
sensor:
  - platform: rest
    resource: http://YOUR_UNRAID_IP:3000/api/latest
    name: Ambient Weather
    json_attributes:
      - device_name
      - device_location
      - tempf
      - humidity
      - windspeedmph
      - baromrelin
      - dailyrainin
    value_template: '{{ value_json.tempf }}'
    unit_of_measurement: "°F"
```

---

## Summary

**Quickest Method:** Use Method 1 (docker-compose)
1. Copy files to `/mnt/user/appdata/ambient-relay/`
2. SSH to Unraid
3. `cd /mnt/user/appdata/ambient-relay`
4. `docker-compose up -d`
5. Test: `curl http://localhost:3000/api/latest`

That's it! Your weather relay is now running on Unraid. 🎉
