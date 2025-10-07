const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class Database {
  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'ambient_weather',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
    });
  }

  async initialize() {
    console.log('Initializing database...');
    try {
      // Read and execute schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await this.pool.query(schema);
      console.log('Database schema initialized successfully');
      
      // Test connection
      const result = await this.pool.query('SELECT NOW()');
      console.log('Database connection established:', result.rows[0].now);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async insertWeatherData(deviceData, weatherData) {
    const query = `
      INSERT INTO weather_data (
        mac_address, device_name, device_location,
        dateutc, date,
        winddir, windspeedmph, windgustmph, maxdailygust, windgustdir,
        winddir_avg2m, windspdmph_avg2m, winddir_avg10m, windspdmph_avg10m,
        tempf, tempinf, feelslike, dewpoint,
        humidity, humidityin,
        baromrelin, baromabsin,
        hourlyrainin, dailyrainin, weeklyrainin, monthlyrainin, yearlyrainin,
        solarradiation, uv,
        raw_data
      ) VALUES (
        $1, $2, $3,
        $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20,
        $21, $22,
        $23, $24, $25, $26, $27,
        $28, $29,
        $30
      ) RETURNING id, created_at
    `;

    const values = [
      deviceData.macAddress,
      deviceData.info?.name || null,
      deviceData.info?.location || null,
      weatherData.dateutc,
      weatherData.date,
      weatherData.winddir || null,
      weatherData.windspeedmph || null,
      weatherData.windgustmph || null,
      weatherData.maxdailygust || null,
      weatherData.windgustdir || null,
      weatherData.winddir_avg2m || null,
      weatherData.windspdmph_avg2m || null,
      weatherData.winddir_avg10m || null,
      weatherData.windspdmph_avg10m || null,
      weatherData.tempf || null,
      weatherData.tempinf || null,
      weatherData.feelsLike || null,
      weatherData.dewPoint || null,
      weatherData.humidity || null,
      weatherData.humidityin || null,
      weatherData.baromrelin || null,
      weatherData.baromabsin || null,
      weatherData.hourlyrainin || null,
      weatherData.dailyrainin || null,
      weatherData.weeklyrainin || null,
      weatherData.monthlyrainin || null,
      weatherData.yearlyrainin || null,
      weatherData.solarradiation || null,
      weatherData.uv || null,
      JSON.stringify(weatherData)
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error inserting weather data:', error);
      throw error;
    }
  }

  async getLatestWeatherData() {
    const query = `
      SELECT 
        id, mac_address, device_name, device_location,
        dateutc, date, created_at,
        winddir, windspeedmph, windgustmph, maxdailygust, windgustdir,
        winddir_avg2m, windspdmph_avg2m, winddir_avg10m, windspdmph_avg10m,
        tempf, tempinf, feelslike, dewpoint,
        humidity, humidityin,
        baromrelin, baromabsin,
        hourlyrainin, dailyrainin, weeklyrainin, monthlyrainin, yearlyrainin,
        solarradiation, uv,
        raw_data
      FROM weather_data
      ORDER BY date DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching latest weather data:', error);
      throw error;
    }
  }

  async getLatestWeatherDataByDevice(macAddress) {
    const query = `
      SELECT 
        id, mac_address, device_name, device_location,
        dateutc, date, created_at,
        winddir, windspeedmph, windgustmph, maxdailygust, windgustdir,
        winddir_avg2m, windspdmph_avg2m, winddir_avg10m, windspdmph_avg10m,
        tempf, tempinf, feelslike, dewpoint,
        humidity, humidityin,
        baromrelin, baromabsin,
        hourlyrainin, dailyrainin, weeklyrainin, monthlyrainin, yearlyrainin,
        solarradiation, uv,
        raw_data
      FROM weather_data
      WHERE mac_address = $1
      ORDER BY date DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [macAddress]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching latest weather data by device:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
    console.log('Database connection closed');
  }
}

module.exports = Database;
