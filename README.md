# WEATHER REPORTER SERVICE

<img width='200px' height='200px' src='https://firebasestorage.googleapis.com/v0/b/booknowgotlk.appspot.com/o/BooknowDotLk.svg?alt=media&token=3fcebb25-399a-414a-a229-257f00992b19'/>

[![Tests](https://img.shields.io/badge/tests-124%20passed-brightgreen)](https://github.com/your-repo/weather-reporter-weather-service)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](./coverage)
[![Node.js](https://img.shields.io/badge/node.js-v18%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## Table of Contents

- [Project Status](#project-status)
- [Project Overview](#project-overview)
- [Latest Features](#latest-features)
  - [Advanced Caching System](#advanced-caching-system)
  - [Bulk Weather API](#bulk-weather-api)
  - [Complex City Name Handling](#complex-city-name-handling)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Architecture & Design](#architecture--design)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Project Status

🚀 **Current Version**: v1.0.0  
📊 **Test Coverage**: 100% (124 tests passing)  
⚡ **Performance**: Optimized with Redis/Memory caching  
🏗️ **Architecture**: Clean Architecture with Domain-Driven Design  
🔄 **CI/CD**: Ready for production deployment

### Recent Development Highlights

- ✅ **Advanced Caching System**: Dual cache strategy (Memory/Redis) with 5-minute TTL
- ✅ **Bulk Weather API**: Optimized parallel processing for up to 50 cities
- ✅ **Complex City Names**: Advanced name normalization and fallback mechanisms
- ✅ **Database Integration**: MongoDB with connection pooling and failover
- ✅ **Comprehensive Testing**: 124 tests with 100% coverage
- ✅ **Error Handling**: Circuit breaker patterns and robust error management
- ✅ **Performance Optimization**: HTTP client with retry logic and connection pooling

## Project Overview

**Weather Reporter Service** is a Node.js microservice that provides comprehensive weather data for cities worldwide. The service integrates with OpenWeatherMap API and offers efficient bulk weather fetching capabilities with intelligent caching for optimal performance.

### Key Features

- 🌦️ **Real-time Weather Data**: Get current weather for any city worldwide
- 🔍 **City Search**: Search and discover cities by name with population filtering
- 🚀 **Bulk Weather API**: Fetch weather for up to 50 cities in a single request
- 💾 **Smart Caching**: 5-minute intelligent caching to reduce API calls and improve response times
- 🏗️ **Clean Architecture**: Domain-driven design with separation of concerns
- 🛡️ **Error Handling**: Robust error handling and circuit breaker patterns
- 📊 **Geographic Data**: Integration with geographic and spatial data services

## Latest Features

### Advanced Caching System

🔥 **NEW**: Implemented dual caching strategy with Redis and Memory cache options:

- **Configurable Cache Strategy**: Switch between Redis and Memory cache via environment variables
- **Smart Cache Management**: Automatic cache validation, TTL management, and fallback mechanisms
- **Performance Optimized**: 5-minute intelligent caching reduces API calls by up to 80%
- **Production Ready**: Redis support for multi-instance deployments
- **Development Friendly**: Memory cache for local development

#### Cache Configuration:

```bash
# Environment Variables
CACHE_STRATEGY=redis          # Options: 'memory' or 'redis'
CACHE_DEFAULT_TTL=300000      # 5 minutes
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=weather:
```

📖 **[Complete Cache System Documentation](./docs/CACHE_SYSTEM.md)**

### Bulk Weather API

🚀 **ENHANCED**: Advanced bulk weather fetching with intelligent processing:

- **Endpoint**: `POST /api/v1/weather/bulk`
- **Features**:
  - Fetch weather for up to 50 cities in one request
  - Parallel processing with error isolation
  - Smart cache integration (Redis/Memory)
  - City name normalization and fallback variations
  - Comprehensive error handling for invalid cities
  - Enhanced response format with metadata and summary

#### Example Usage:

```javascript
// Request
POST /api/v1/weather/bulk
Content-Type: application/json

{
  "cities": [
    { "city": "London", "country": "GB" },
    { "city": "New York", "country": "US" },
    { "city": "São Paulo", "country": "BR" }
  ]
}

// Enhanced Response with Metadata
{
  "success": true,
  "data": {
    "london-gb": {
      "temperature": 15,
      "icon": "04d",
      "description": "Overcast clouds",
      "cached": false
    },
    "new york-us": {
      "temperature": 22,
      "icon": "01d",
      "description": "Clear sky",
      "cached": true
    }
  },
  "meta": {
    "totalRequested": 3,
    "successful": 2,
    "failed": 1,
    "cached": 1,
    "errors": {
      "são paulo-br": "City not found"
    }
  }
}
```

📖 **[Complete Bulk Weather API Documentation](./docs/BULK_WEATHER_API.md)**

### Complex City Name Handling

🌍 **NEW**: Advanced city name processing for international cities:

- **Unicode Support**: Handles diacritics and special characters (São Paulo, Zürich, etc.)
- **Name Normalization**: Smart fallback variations for complex city names
- **Region Deduplication**: Intelligent handling of duplicate city names
- **API Optimization**: Multiple name variations tried automatically

📖 **[Complex City Names Solution](./docs/COMPLEX_CITY_NAMES_HANDLING.md)**

## Tech Stack

### Core Technologies

- **Runtime**: Node.js 18+ (ES Modules)
- **Framework**: Express.js with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis + In-Memory dual strategy
- **External APIs**: OpenWeatherMap API, REST Countries API

### Development & Testing

- **Testing Framework**: Jest with Babel transformation
- **Code Quality**: ESLint + Prettier with custom rules
- **Development Tools**: Nodemon with hot reloading
- **Environment Management**: dotenv with multi-environment support

### Architecture & Patterns

- **Architecture**: Clean Architecture with Domain-Driven Design
- **Design Patterns**: Repository pattern, Circuit breaker, Factory pattern
- **Error Handling**: Custom error hierarchy with middleware
- **HTTP Client**: Axios with retry logic and connection pooling

### Production Features

- **Containerization**: Docker ready with multi-stage builds
- **Database Features**: Connection pooling, failover, migration system
- **Monitoring**: Comprehensive logging and error tracking
- **Security**: Rate limiting, input validation, secure headers

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18.x or later) ⚡
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/) 📦
- [MongoDB](https://www.mongodb.com/) database access 🗄️
- [Redis](https://redis.io/) (optional, for production caching) 🚀
- [OpenWeatherMap API key](https://openweathermap.org/api) 🌦️

### Installation

1. Clone the repository:

```bash
git clone <your-repository-url>
cd weather-reporter-weather-service
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create `.env.development` and `.env.production` files in the `src/` directory with the required environment variables (see [Environment Variables](#environment-variables) section).

### Running the Application

#### Development Mode (with hot reloading):

```bash
npm run dev
```

#### Production Mode:

```bash
npm start
```

#### Available Scripts:

```bash
npm run dev          # Development server with hot reload
npm start            # Production server
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
```

The application will be available at `http://localhost:9001` (or your configured port).

## API Endpoints

The Weather Service provides the following endpoints:

### Weather Endpoints

| Method | Endpoint                                               | Description                              |
| ------ | ------------------------------------------------------ | ---------------------------------------- |
| `GET`  | `/api/v1/weather/current/:cityId`                      | Get current weather by city ID           |
| `GET`  | `/api/v1/weather/current?region=<name>&code=<country>` | Get current weather by region name       |
| `GET`  | `/api/v1/weather/search?q=<term>`                      | Search for regions by name               |
| `POST` | `/api/v1/weather/bulk`                                 | **NEW**: Get weather for multiple cities |

### Geographic Data Endpoints

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| `GET`  | `/api/v1/weather/geo/:region` | Get geographic data for a region |

### Health Check

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| `GET`  | `/api/v1/weather/health` | Service health check |

### Bulk Weather API

The enhanced bulk weather endpoint accepts a JSON payload with an array of cities:

```json
{
  "cities": [
    { "city": "London", "country": "GB" },
    { "city": "Paris", "country": "FR" },
    { "city": "São Paulo", "country": "BR" }
  ]
}
```

Returns enhanced weather data with metadata and caching information:

```json
{
  "success": true,
  "data": {
    "london-gb": {
      "temperature": 15,
      "icon": "04d",
      "description": "Overcast clouds",
      "cached": false
    },
    "paris-fr": {
      "temperature": 18,
      "icon": "01d",
      "description": "Clear sky",
      "cached": true
    }
  },
  "meta": {
    "totalRequested": 3,
    "successful": 2,
    "failed": 1,
    "cached": 1,
    "processingTime": "245ms",
    "errors": {
      "são paulo-br": "City not found after trying 3 variations"
    }
  }
}
```

## Architecture & Design

### Clean Architecture Implementation

The project follows **Clean Architecture** principles with clear separation of concerns:

```
├── Domain Layer (Business Logic)
│   ├── entities/          # Business entities (Weather, Region)
│   ├── repositories/      # Repository interfaces
│   └── usecases/         # Business use cases
├── Infrastructure Layer
│   ├── errors/           # Custom error classes
│   ├── middlewares/      # Express middlewares
│   └── orm/             # Database implementations
├── Interface Layer
│   ├── http/            # HTTP routes and clients
│   └── services/        # External API integrations
└── Utils Layer
    ├── caching/         # Cache implementations
    ├── database/        # Database utilities
    └── helpers/         # Utility functions
```

### Key Design Patterns

- **Repository Pattern**: Abstracts data access logic
- **Factory Pattern**: Dynamic cache strategy selection
- **Circuit Breaker**: Prevents cascading failures
- **Command Pattern**: Encapsulates business operations
- **Strategy Pattern**: Configurable caching strategies

## Environment Variables

The following environment variables are required to configure the Weather Reporter Service. These variables should be placed in `.env.<environment>` files in the `src/` directory.

### Service Configuration

| Variable               | Description                        | Example Value                      |
| ---------------------- | ---------------------------------- | ---------------------------------- |
| `NODE_ENV`             | Environment mode                   | `development`                      |
| `SERVICE_PORT`         | Port on which the service will run | `9001`                             |
| `SERVICE_NAME`         | Name of the service                | `weather-reporter-weather-service` |
| `SERVICE_VERSION`      | Version of the service             | `1.0.0`                            |
| `SERVICE_PROTOCOL`     | Service protocol                   | `http`                             |
| `SERVICE_HOST`         | Service host                       | `localhost`                        |
| `SERVICE_ROUTE_PREFIX` | Prefix for routing                 | `api/v1/weather`                   |

### OpenWeatherMap API Configuration

| Variable                              | Description                | Example Value            |
| ------------------------------------- | -------------------------- | ------------------------ |
| `OPEN_WEATHER_PROTOCOL`               | OpenWeather API protocol   | `https`                  |
| `OPEN_WEATHER_HOST`                   | OpenWeather API host       | `api.openweathermap.org` |
| `OPEN_WEATHER_CURRENT_WEATHER_DOMAIN` | Current weather API domain | `/data/2.5`              |
| `OPEN_WEATHER_ICON_DOMAIN`            | Weather icons domain       | `/img/w`                 |
| `OPEN_WEATHER_API_KEY`                | Your OpenWeather API key   | `your_api_key_here`      |
| `OPEN_WEATHER_UNITS`                  | Temperature units          | `metric`                 |
| `OPEN_WEATHER_LANG`                   | Language for descriptions  | `en`                     |
| `OPEN_WEATHER_RESPONSE_MODE`          | Response format            | `json`                   |

### Database Configuration

| Variable             | Description               | Example Value               |
| -------------------- | ------------------------- | --------------------------- |
| `MONGODB_CONNECTION` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME`    | MongoDB database name     | `weather_reporter`          |

### Cache Configuration

| Variable                   | Description                  | Example Value |
| -------------------------- | ---------------------------- | ------------- |
| `CACHE_STRATEGY`           | Cache strategy to use        | `redis`       |
| `CACHE_DEFAULT_TTL`        | Default cache TTL (ms)       | `300000`      |
| `REDIS_HOST`               | Redis server host            | `localhost`   |
| `REDIS_PORT`               | Redis server port            | `6379`        |
| `REDIS_PASSWORD`           | Redis password (if required) | `yourpass`    |
| `REDIS_DATABASE`           | Redis database number        | `0`           |
| `REDIS_KEY_PREFIX`         | Prefix for Redis keys        | `weather:`    |
| `REDIS_RETRY_DELAY`        | Retry delay on failure (ms)  | `100`         |
| `REDIS_ENABLE_READY_CHECK` | Enable Redis ready check     | `true`        |
| `REDIS_MAX_RETRIES`        | Max retries per request      | `3`           |

### Example .env.development File

```dotenv
# Service Configuration
NODE_ENV=development
SERVICE_PORT=9001
SERVICE_NAME=weather-reporter-weather-service
SERVICE_VERSION=1.0.0
SERVICE_PROTOCOL=http
SERVICE_HOST=localhost
SERVICE_ROUTE_PREFIX=api/v1/weather

# OpenWeatherMap API
OPEN_WEATHER_PROTOCOL=https
OPEN_WEATHER_HOST=api.openweathermap.org
OPEN_WEATHER_CURRENT_WEATHER_DOMAIN=/data/2.5
OPEN_WEATHER_ICON_DOMAIN=/img/w
OPEN_WEATHER_API_KEY=your_openweather_api_key_here
OPEN_WEATHER_UNITS=metric
OPEN_WEATHER_LANG=en
OPEN_WEATHER_RESPONSE_MODE=json

# Database
MONGODB_CONNECTION=mongodb://localhost:27017
MONGODB_DB_NAME=weather_reporter

# Cache Configuration
CACHE_STRATEGY=memory
CACHE_DEFAULT_TTL=300000

# Redis (when CACHE_STRATEGY=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=weather:
```

## Testing

### Test Suite Overview

Our comprehensive test suite ensures reliability and maintainability:

- **📊 Test Coverage**: 100% (124 tests passing)
- **🧪 Test Types**: Unit, Integration, and End-to-End tests
- **🚀 Performance**: Fast execution with parallel test running
- **🔧 Mocking**: Sophisticated mocking for external dependencies

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test files
npm test -- --testPathPattern=GetBulkWeatherData.test.js

# Run tests for specific feature
npm test -- --testNamePattern="Cache"
```

### Test Categories

#### Unit Tests

- **Domain Layer**: Business logic and use cases
- **Utils**: City name processing, caching mechanisms
- **Infrastructure**: Error handling, data transformation

#### Integration Tests

- **API Endpoints**: Full request/response cycle testing
- **Database Operations**: MongoDB integration testing
- **Cache Systems**: Redis and Memory cache integration

#### End-to-End Tests

- **Complex Scenarios**: Multi-city weather requests
- **Error Handling**: Graceful failure scenarios
- **Performance**: Response time and throughput testing

### Manual Testing

Test the bulk weather API manually:

```bash
# Test bulk weather endpoint
node scripts/test-bulk-weather.js

# Test complex city names
node scripts/test-search-regions-deduplication.js
```

### Test Environment Setup

Tests run in isolated environments with:

- **Mocked External APIs**: No real API calls during testing
- **In-Memory Database**: Fast, isolated test database
- **Deterministic Caching**: Predictable cache behavior

## Documentation

### 📚 Available Documentation

- **[Bulk Weather API](./docs/BULK_WEATHER_API.md)** - Complete API reference and examples
- **[Cache System](./docs/CACHE_SYSTEM.md)** - Redis and Memory cache configuration
- **[Complex City Names](./docs/COMPLEX_CITY_NAMES_HANDLING.md)** - International city name handling
- **[Database Integration](./docs/DATABASE_INTEGRATION.md)** - MongoDB setup and optimization

### 🏗️ Architecture Documentation

The service implements **Clean Architecture** with the following layers:

- **Domain Layer**: Core business logic and entities
- **Infrastructure Layer**: Database, caching, and external services
- **Interface Layer**: HTTP routes, controllers, and API clients
- **Utils Layer**: Shared utilities and helper functions

### 🔧 Configuration Management

Environment-specific configurations are managed through:

- Development: `src/.env.development`
- Production: `src/.env.production`
- Test: Automated test environment setup

### 🚀 Deployment

- **Docker**: Multi-stage Dockerfile for optimized production builds
- **Vercel**: Ready for serverless deployment
- **Environment Variables**: Comprehensive configuration management

## Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork the repository** and create a feature branch
2. **Set up the development environment**:
   ```bash
   npm install
   cp src/.env.development.example src/.env.development
   # Configure your environment variables
   ```
3. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```
4. **Make your changes** following our coding standards
5. **Add tests** for new functionality
6. **Run the full test suite**:
   ```bash
   npm run test:coverage
   npm run lint
   ```
7. **Submit a pull request** with a clear description

### Coding Standards

- **ES Modules**: Use modern JavaScript with ES module imports
- **Clean Architecture**: Follow the established layer separation
- **Test Coverage**: Maintain 100% test coverage
- **Code Quality**: Pass ESLint and Prettier checks
- **Documentation**: Update relevant documentation

### Development Tools

```bash
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
npm run dev           # Start development server
```

---

**Developed by**: [Waruna Wimalaweera](mailto:warunamadushanka456@gmail.com)  
**License**: MIT License  
**Version**: 1.0.0
