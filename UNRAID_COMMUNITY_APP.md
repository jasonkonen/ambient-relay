# Creating an Unraid Community Application

This guide explains how to submit Ambient Weather Relay as a Community Application for Unraid.

## Overview

To make this available in Unraid's Community Applications (CA), you need to:
1. Publish the Docker image to Docker Hub
2. Create an XML template file
3. Submit to the Community Applications repository

---

## Step 1: Create Docker Hub Repository

### 1.1 Create Docker Hub Account
- Go to https://hub.docker.com
- Create a free account (e.g., username: `yourname`)

### 1.2 Build and Push Image

```bash
# On your Mac, in the project directory
cd /Users/YOUR_USERNAME/Projects/ambient_relay

# Login to Docker Hub
docker login

# Build the image with your Docker Hub username
docker build -t yourname/ambient-weather-relay:latest .

# Tag with version
docker tag yourname/ambient-weather-relay:latest yourname/ambient-weather-relay:1.0.0

# Push to Docker Hub
docker push yourname/ambient-weather-relay:latest
docker push yourname/ambient-weather-relay:1.0.0
```

### 1.3 Create Repository Documentation

On Docker Hub, add a README with:
- What the container does
- Required environment variables
- Example usage
- Link to GitHub repository

---

## Step 2: Create Unraid Template

### 2.1 Create XML Template File

Create a file named `ambient-weather-relay.xml`:

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>ambient-weather-relay</Name>
  <Repository>yourname/ambient-weather-relay:latest</Repository>
  <Registry>https://hub.docker.com/r/yourname/ambient-weather-relay/</Registry>
  <Network>bridge</Network>
  <MyIP/>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/yourname/ambient-weather-relay/issues</Support>
  <Project>https://github.com/yourname/ambient-weather-relay</Project>
  <Overview>Polls the Ambient Weather API and provides a local JSON feed without requiring direct API authentication. Stores historical weather data in PostgreSQL for analysis. Perfect for Home Assistant integration and dashboard displays.</Overview>
  <Category>Tools: Status:Stable</Category>
  <WebUI>http://[IP]:[PORT:3000]/api/latest</WebUI>
  <TemplateURL>https://raw.githubusercontent.com/yourname/unraid-templates/main/ambient-weather-relay.xml</TemplateURL>
  <Icon>https://raw.githubusercontent.com/yourname/ambient-weather-relay/main/icon.png</Icon>
  <ExtraParams/>
  <PostArgs/>
  <CPUset/>
  <DateInstalled></DateInstalled>
  <DonateText/>
  <DonateLink/>
  <Requires/>
  <Config Name="HTTP Port" Target="3000" Default="3000" Mode="tcp" Description="Port for JSON API access" Type="Port" Display="always" Required="true" Mask="false">3000</Config>
  <Config Name="Application Key" Target="APPLICATION_KEY" Default="" Mode="" Description="Your Ambient Weather Application Key (get from ambientweather.net/account)" Type="Variable" Display="always" Required="true" Mask="false"></Config>
  <Config Name="API Key" Target="API_KEY" Default="" Mode="" Description="Your Ambient Weather API Key (get from ambientweather.net/account)" Type="Variable" Display="always" Required="true" Mask="true"></Config>
  <Config Name="Poll Interval (Minutes)" Target="POLL_INTERVAL_MINUTES" Default="5" Mode="" Description="How often to fetch data from API (minimum: 1 minute)" Type="Variable" Display="always" Required="false" Mask="false">5</Config>
  <Config Name="Device Location" Target="DEVICE_LOCATION" Default="" Mode="" Description="Custom location string (e.g., 'City, State, Country') - optional, overrides device location" Type="Variable" Display="always" Required="false" Mask="false"></Config>
  <Config Name="PostgreSQL Database" Target="POSTGRES_DB" Default="ambient_weather" Mode="" Description="Database name" Type="Variable" Display="advanced" Required="false" Mask="false">ambient_weather</Config>
  <Config Name="PostgreSQL User" Target="POSTGRES_USER" Default="ambient" Mode="" Description="Database user" Type="Variable" Display="advanced" Required="false" Mask="false">ambient</Config>
  <Config Name="PostgreSQL Password" Target="POSTGRES_PASSWORD" Default="" Mode="" Description="Database password (change this!)" Type="Variable" Display="advanced" Required="true" Mask="true">changeme_secure_password</Config>
  <Config Name="PostgreSQL Data" Target="/var/lib/postgresql/data" Default="/mnt/user/appdata/ambient-weather-relay/postgres-data" Mode="rw" Description="PostgreSQL data directory" Type="Path" Display="advanced" Required="true" Mask="false">/mnt/user/appdata/ambient-weather-relay/postgres-data</Config>
  <Config Name="PostgreSQL Logs" Target="/var/lib/postgresql" Default="/mnt/user/appdata/ambient-weather-relay/postgres-logs" Mode="rw" Description="PostgreSQL logs directory" Type="Path" Display="advanced" Required="true" Mask="false">/mnt/user/appdata/ambient-weather-relay/postgres-logs</Config>
  <Config Name="POSTGRES_HOST" Target="POSTGRES_HOST" Default="localhost" Mode="" Description="PostgreSQL host" Type="Variable" Display="advanced" Required="false" Mask="false">localhost</Config>
  <Config Name="POSTGRES_PORT" Target="POSTGRES_PORT" Default="5432" Mode="" Description="PostgreSQL port" Type="Variable" Display="advanced" Required="false" Mask="false">5432</Config>
  <Config Name="HTTP_PORT" Target="HTTP_PORT" Default="3000" Mode="" Description="Internal HTTP port" Type="Variable" Display="advanced" Required="false" Mask="false">3000</Config>
</Container>
```

### 2.2 Template Explanation

Key fields:
- **Repository**: Your Docker Hub image
- **WebUI**: Link users can click to see data
- **Icon**: 512x512 PNG icon URL
- **Config entries**: Each environment variable and volume mapping

---

## Step 3: Create GitHub Repository

### 3.1 Create Repository
1. Go to GitHub and create new repository: `ambient-weather-relay`
2. Make it public
3. Add a description

### 3.2 Upload Files

Upload these files to the repository:
```
ambient-weather-relay/
├── src/                    # Application code
├── Dockerfile             # Build instructions
├── docker-compose.yml     # For testing
├── package.json
├── .dockerignore
├── .gitignore
├── README.md              # Main documentation
├── UNRAID_INSTALL.md      # Unraid guide
├── icon.png               # 512x512 app icon
└── .env.example           # Configuration template
```

**Important:** DO NOT commit your `.env` file with real API keys!

### 3.3 Create Icon

Create a 512x512 PNG icon for your app. You can:
- Use a weather-related icon
- Create one at https://www.canva.com
- Use an existing open-source weather icon

Save as `icon.png` in your repository.

---

## Step 4: Create Template Repository

### 4.1 Create Second Repository

Create another GitHub repository: `yourname-unraid-templates`

### 4.2 Add Template

Add your `ambient-weather-relay.xml` file to this repository.

### 4.3 Update Template URL

In your XML, update the TemplateURL:
```xml
<TemplateURL>https://raw.githubusercontent.com/yourname/yourname-unraid-templates/main/ambient-weather-relay.xml</TemplateURL>
```

---

## Step 5: Submit to Community Applications

### 5.1 Fork CA Repository

1. Go to https://github.com/Squidly271/AppFeed
2. Click "Fork" to create your own copy

### 5.2 Add Your Template

In your forked repository:
1. Navigate to `templates/` directory
2. Click "Add file" → "Upload files"
3. Upload your `ambient-weather-relay.xml`
4. Commit the changes

### 5.3 Create Pull Request

1. Go to your forked repository
2. Click "Pull requests" → "New pull request"
3. Title: "Add Ambient Weather Relay"
4. Description:
   ```
   Adding Ambient Weather Relay - A weather data relay that:
   - Polls Ambient Weather API
   - Stores historical data in PostgreSQL
   - Provides JSON API endpoint
   - Privacy features (hidden MAC, custom location)
   - Perfect for Home Assistant integration
   
   Docker Hub: https://hub.docker.com/r/yourname/ambient-weather-relay
   GitHub: https://github.com/yourname/ambient-weather-relay
   ```
5. Click "Create pull request"

### 5.4 Wait for Review

The CA maintainers will review your submission. They may:
- Request changes to the template
- Ask for documentation improvements
- Approve and merge

---

## Step 6: Testing Your Template

### 6.1 Test Locally

Before submitting, test on your Unraid server:

1. Go to Docker tab
2. Click "Add Container"
3. Under "Template repositories", add your URL:
   ```
   https://github.com/yourname/yourname-unraid-templates
   ```
4. Search for "ambient weather"
5. Install and test

### 6.2 Verify Everything Works

- Container starts without errors
- API endpoints respond correctly
- Data is being collected
- Configuration changes work

---

## Alternative: Personal Template Repository

If you don't want to submit to CA (or while waiting for approval), users can add your template repository:

### Setup Instructions for Users:

1. In Unraid, go to **Docker** tab
2. At bottom, find "**Template repositories:**"
3. Add your GitHub raw URL:
   ```
   https://raw.githubusercontent.com/yourname/yourname-unraid-templates/main/
   ```
4. Click "Save"
5. When adding containers, your app will appear

---

## Maintenance

### Updating Your App

When you make changes:

1. **Update code** in GitHub
2. **Rebuild Docker image**:
   ```bash
   docker build -t yourname/ambient-weather-relay:latest .
   docker build -t yourname/ambient-weather-relay:1.1.0 .
   docker push yourname/ambient-weather-relay:latest
   docker push yourname/ambient-weather-relay:1.1.0
   ```
3. **Update XML** if needed (new variables, ports, etc.)
4. Users update via Unraid Docker UI

### Version Tags

Use semantic versioning:
- `1.0.0` - Initial release
- `1.1.0` - New features
- `1.0.1` - Bug fixes
- `latest` - Always points to newest stable

---

## Required Files Checklist

Before submission:

- [ ] Docker image on Docker Hub
- [ ] GitHub repository with source code
- [ ] README.md with clear documentation
- [ ] .env.example (never commit real .env!)
- [ ] Icon (512x512 PNG)
- [ ] XML template file
- [ ] Template repository on GitHub
- [ ] Tested on Unraid
- [ ] Pull request to CA (optional)

---

## Example Repositories

Look at these for reference:
- https://github.com/Squidly271/AppFeed (CA repository)
- Any popular Unraid app's GitHub repository
- Docker Hub documentation

---

## Summary

**Quick Path to Community App:**

1. Push image to Docker Hub
2. Create GitHub repo with code
3. Create XML template
4. Test on your Unraid
5. Submit PR to AppFeed

**Personal Template (Faster):**

1. Push image to Docker Hub
2. Create GitHub repo with code + XML
3. Users add your template URL to Unraid

Either way, your app becomes easily installable for Unraid users!
