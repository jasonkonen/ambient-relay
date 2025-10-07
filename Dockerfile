# Use Node.js Alpine base image
FROM node:18-alpine

# Install PostgreSQL and required dependencies
RUN apk add --no-cache \
    postgresql15 \
    postgresql15-client \
    su-exec \
    bash

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application source
COPY src ./src

# Set up PostgreSQL
RUN mkdir -p /run/postgresql && \
    chown -R postgres:postgres /run/postgresql && \
    mkdir -p /var/lib/postgresql/data && \
    chown -R postgres:postgres /var/lib/postgresql

# Create startup script
COPY <<'EOF' /app/start.sh
#!/bin/bash
set -e

echo "=== Ambient Weather Relay Startup ==="

# Initialize PostgreSQL if needed
if [ ! -d "/var/lib/postgresql/data/base" ]; then
  echo "Initializing PostgreSQL database..."
  su-exec postgres initdb -D /var/lib/postgresql/data
  
  # Configure PostgreSQL for local connections
  echo "host all all 127.0.0.1/32 trust" >> /var/lib/postgresql/data/pg_hba.conf
  echo "local all all trust" >> /var/lib/postgresql/data/pg_hba.conf
  echo "listen_addresses = 'localhost'" >> /var/lib/postgresql/data/postgresql.conf
  echo "port = 5432" >> /var/lib/postgresql/data/postgresql.conf
fi

# Start PostgreSQL in the background
echo "Starting PostgreSQL..."
su-exec postgres postgres -D /var/lib/postgresql/data &
POSTGRES_PID=$!

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if su-exec postgres pg_isready -h localhost >/dev/null 2>&1; then
    echo "PostgreSQL is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: PostgreSQL failed to start"
    exit 1
  fi
  echo "Waiting... ($i/30)"
  sleep 1
done

# Create database and user if they don't exist
echo "Setting up database..."
su-exec postgres psql -h localhost -c "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'" | grep -q 1 || \
  su-exec postgres psql -h localhost -c "CREATE DATABASE ${POSTGRES_DB};"

su-exec postgres psql -h localhost -c "SELECT 1 FROM pg_roles WHERE rolname = '${POSTGRES_USER}'" | grep -q 1 || \
  su-exec postgres psql -h localhost -c "CREATE USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';"

su-exec postgres psql -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_USER};"

# Grant schema permissions
su-exec postgres psql -h localhost -d ${POSTGRES_DB} -c "GRANT ALL ON SCHEMA public TO ${POSTGRES_USER};"
su-exec postgres psql -h localhost -d ${POSTGRES_DB} -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO ${POSTGRES_USER};"
su-exec postgres psql -h localhost -d ${POSTGRES_DB} -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ${POSTGRES_USER};"
su-exec postgres psql -h localhost -d ${POSTGRES_DB} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${POSTGRES_USER};"
su-exec postgres psql -h localhost -d ${POSTGRES_DB} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${POSTGRES_USER};"

# Start the Node.js application
echo "Starting Ambient Weather Relay application..."
exec node src/index.js
EOF

RUN chmod +x /app/start.sh

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run the startup script
CMD ["/app/start.sh"]
