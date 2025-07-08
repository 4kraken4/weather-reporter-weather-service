import dotenv from 'dotenv';

export default class Config {
  constructor() {
    dotenv.config({ path: 'src/.env' });
    const env = process.env.NODE_ENV || 'development';
    // eslint-disable-next-line no-console
    console.log(`Loading environment: ${env}`);
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
      name: process.env.APP_NAME || 'weather-reporter'
    };
  }

  get service() {
    return {
      version: process.env.SERVICE_VERSION || '1.0.0',
      port: process.env.SERVICE_PORT || 9001,
      name: process.env.SERVICE_NAME || 'weather-reporter-weather-service',
      routePrefix: process.env.SERVICE_ROUTE_PREFIX || 'api/v1/weather',
      certPath: process.env.SERVER_CERT_PATH,
      protocol: process.env.SERVICE_PROTOCOL || 'http',
      host: process.env.SERVICE_HOST || 'localhost'
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

  get apis() {
    return {
      openWeather: this.openWeather,
      restCountries: this.restCountries
    };
  }

  get openWeather() {
    return {
      name: process.env.OPEN_WEATHER_NAME || 'openWeather',
      protocol: process.env.OPEN_WEATHER_PROTOCOL || 'https',
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

  get restCountries() {
    return {
      name: process.env.REST_COUNTRIES_API_NAME || 'restCountries',
      protocol: process.env.REST_COUNTRIES_API_PROTOCOL || 'https',
      host: process.env.REST_COUNTRIES_API_HOST || 'restcountries.com/v3.1',
      codeDetailsDomain:
        process.env.REST_COUNTRIES_API_CODE_DETAILS_DOMAIN || 'alpha',
      nameDetailsDomain: process.env.REST_COUNTRIES_API_NAME_DETAILS_DOMAIN || 'name'
    };
  }

  get cache() {
    return {
      strategy: process.env.CACHE_STRATEGY || 'memory', // 'memory' or 'redis'
      defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL, 10) || 300000, // 5 minutes
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DATABASE, 10) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'weather:',
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 100,
        enableReadyCheck: process.env.REDIS_ENABLE_READY_CHECK !== 'false',
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3
      }
    };
  }

  get logging() {
    return {
      level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
      enabledInProduction: process.env.LOG_ENABLED_IN_PROD !== 'false',
      format: process.env.LOG_FORMAT || 'simple' // simple, json (for future extensibility)
    };
  }
}
