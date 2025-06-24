/* eslint-disable no-undef */
import dotenv from 'dotenv';

export default class Config {
  constructor() {
    dotenv.config({ path: 'src/.env' });
    const env = process.env.NODE_ENV || 'development';
    console.log(`Loading environment: ${env}`); // eslint-disable-line no-console
    dotenv.config({ path: `src/.env.${env}` });
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new Config();
    }
    return this.instance;
  }

  get app() {
    return {
      name: process.env.APP_NAME
    };
  }

  get service() {
    return {
      version: process.env.SERVICE_VERSION,
      port: process.env.SERVICE_PORT,
      name: process.env.SERVICE_NAME,
      routePrefix: process.env.SERVICE_ROUTE_PREFIX,
      certPath: process.env.SERVER_CERT_PATH,
      protocol: process.env.SERVICE_PROTOCOL,
      host: process.env.SERVICE_HOST
    };
  }

  get db() {
    return {
      mysql: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        database: process.env.MYSQL_DB_NAME,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        dialect: process.env.MYSQL_DIALECT,
        name: 'mysql'
      },
      mongo: {
        connection: process.env.MONGODB_CONNECTION,
        dbName: process.env.MONGODB_DB_NAME,
        cluster: process.env.MONGODB_CLUSTER,
        user: process.env.MONGODB_USERNAME,
        password: process.env.MONGODB_PASSWORD,
        useCertAuth: process.env.MONGODB_USE_CERT_AUTH === 'true',
        certPath: process.env.MONGODB_CERT_PATH,
        maxReconnectAttempts:
          parseInt(process.env.MONGODB_MAX_RECONNECT_ATTEMPTS, 10) || 5,
        reconnectInterval:
          parseInt(process.env.MONGODB_RECONNECT_INTERVAL, 10) || 2000,
        name: 'mongo'
      }
    };
  }

  get jwt() {
    return {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
      refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    };
  }

  get openWeather() {
    return {
      protocol: process.env.OPEN_WEATHER_PROTOCOL,
      host: process.env.OPEN_WEATHER_HOST,
      currentWeatherDomain: process.env.OPEN_WEATHER_CURRENT_WEATHER_DOMAIN,
      iconDomain: process.env.OPEN_WEATHER_ICON_DOMAIN,
      routePrefix: process.env.OPEN_WEATHER_ROUTE_PREFIX,
      apiKey: process.env.OPEN_WEATHER_API_KEY,
      units: process.env.OPEN_WEATHER_UNITS || 'metric',
      lang: process.env.OPEN_WEATHER_LANG || 'en',
      responseType: process.env.OPEN_WEATHER_RESPONSE_MODE || 'json'
    };
  }
}
