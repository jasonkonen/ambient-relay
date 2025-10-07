-- Create weather_data table to store all weather station readings
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    mac_address VARCHAR(17) NOT NULL,
    device_name VARCHAR(255),
    device_location VARCHAR(255),
    
    -- Timestamps
    dateutc BIGINT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Wind data
    winddir INTEGER,
    windspeedmph DECIMAL(5,2),
    windgustmph DECIMAL(5,2),
    maxdailygust DECIMAL(5,2),
    windgustdir INTEGER,
    winddir_avg2m INTEGER,
    windspdmph_avg2m DECIMAL(5,2),
    winddir_avg10m INTEGER,
    windspdmph_avg10m DECIMAL(5,2),
    
    -- Temperature data
    tempf DECIMAL(5,2),
    tempinf DECIMAL(5,2),
    feelslike DECIMAL(5,2),
    dewpoint DECIMAL(5,2),
    
    -- Humidity data
    humidity INTEGER,
    humidityin INTEGER,
    
    -- Barometric pressure
    baromrelin DECIMAL(6,2),
    baromabsin DECIMAL(6,2),
    
    -- Rain data
    hourlyrainin DECIMAL(6,2),
    dailyrainin DECIMAL(6,2),
    weeklyrainin DECIMAL(6,2),
    monthlyrainin DECIMAL(6,2),
    yearlyrainin DECIMAL(6,2),
    
    -- Solar and UV (if available)
    solarradiation DECIMAL(8,2),
    uv INTEGER,
    
    -- Additional data stored as JSONB for flexibility
    raw_data JSONB
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weather_data_date ON weather_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_weather_data_mac_address ON weather_data(mac_address);
CREATE INDEX IF NOT EXISTS idx_weather_data_dateutc ON weather_data(dateutc DESC);
CREATE INDEX IF NOT EXISTS idx_weather_data_created_at ON weather_data(created_at DESC);

-- Create a composite index for mac_address + date for device-specific queries
CREATE INDEX IF NOT EXISTS idx_weather_data_mac_date ON weather_data(mac_address, date DESC);
