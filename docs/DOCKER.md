# Docker Setup Guide

## 🐳 **Docker Configuration Overview**

This project includes a comprehensive Docker setup with multi-stage builds, security best practices, and development/production environments.

## 📁 **Docker Files Structure**

```
├── Dockerfile              # Multi-stage Docker build
├── .dockerignore           # Files to exclude from Docker context
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── docker.sh              # Docker management script
├── .env.example           # Environment variables template
└── nginx/
    └── nginx.conf         # Nginx reverse proxy configuration
```

## 🚀 **Quick Start**

### Development Environment

```bash
# 1. Ensure your environment files exist in src/
# Your project already has:
# - src/.env (common config)
# - src/.env.development (dev overrides)
# - src/.env.production (prod overrides)

# 2. Start development environment
npm run docker:dev
# or
./docker.sh dev

# 3. Access services
# - Weather API: http://localhost:9001
# - MongoDB Express: http://localhost:8082 (admin/admin)
# - Redis Commander: http://localhost:8081
```

### Production Environment

```bash
# 1. Your src/.env.production file is automatically loaded
# 2. Start production environment
npm run docker:prod
# or
./docker.sh prod

# 3. Access service
# - Weather API: http://localhost:9001 (behind Nginx)
```

## 🛠️ **Docker Management Commands**

### Using npm scripts:

```bash
npm run docker:dev          # Start development
npm run docker:dev:down     # Stop development
npm run docker:prod         # Start production
npm run docker:prod:down    # Stop production
npm run docker:build        # Build image only
npm run docker:clean        # Clean up Docker resources
```

### Using docker.sh script:

```bash
chmod +x docker.sh          # Make script executable

./docker.sh dev             # Start development
./docker.sh dev:down        # Stop development
./docker.sh dev:logs        # View development logs
./docker.sh dev:rebuild     # Rebuild development

./docker.sh prod            # Start production
./docker.sh prod:down       # Stop production
./docker.sh prod:logs       # View production logs

./docker.sh test            # Run tests in container
./docker.sh lint            # Run linter in container
./docker.sh health          # Check service health
./docker.sh clean           # Clean up resources
```

## 🏗️ **Multi-Stage Build Explanation**

### Stages:

1. **Base Stage**: Common setup with Alpine Linux and security user
2. **Development Stage**: Includes dev dependencies and hot reload
3. **Build Stage**: Installs production dependencies
4. **Production Stage**: Minimal runtime image with only necessary files

### Benefits:

- **Smaller Images**: Production image ~150MB vs 1GB+ for full Node image
- **Security**: Runs as non-root user
- **Performance**: Optimized layer caching
- **Signal Handling**: Proper process management with dumb-init

## 🔒 **Security Features**

- **Non-root User**: Runs as `nextjs` user (UID 1001)
- **Alpine Base**: Minimal attack surface
- **Signal Handling**: Proper shutdown with dumb-init
- **Health Checks**: Built-in application health monitoring
- **Resource Limits**: Memory and CPU constraints in production

## 🌐 **Services Included**

### Development Environment:

- **Weather Service**: Main application
- **MongoDB**: Database with Mongo Express GUI
- **Redis**: Cache with Redis Commander GUI
- **Volume Mounts**: Live code reloading

### Production Environment:

- **Weather Service**: Optimized production build
- **Nginx**: Reverse proxy with rate limiting
- **Health Checks**: Automatic service monitoring
- **Resource Limits**: Production-ready constraints

## 🔧 **Environment Variables**

Your project uses environment files in the `src/` directory:

- **`src/.env`**: Common configuration (API keys, service names)
- **`src/.env.development`**: Development overrides (MongoDB Atlas, local settings)
- **`src/.env.production`**: Production overrides (Vercel deployment, HTTPS)

### Docker Environment Overrides

Docker containers override specific variables for containerized deployment:

```bash
# Development (docker-compose.yml)
SERVICE_HOST=0.0.0.0                    # Bind to all interfaces
MONGODB_CONNECTION=mongodb://admin:password@mongodb:27017/WeatherReporter
MONGODB_USE_CERT_AUTH=false             # Disable cert auth for local MongoDB
CACHE_STRATEGY=redis                     # Use Redis instead of memory cache

# Production (docker-compose.prod.yml)
SERVICE_PROTOCOL=http                    # HTTP inside container (Nginx handles HTTPS)
MONGODB_CONNECTION=${MONGODB_CONNECTION} # Use your production MongoDB
CACHE_STRATEGY=${CACHE_STRATEGY:-redis}  # Default to Redis if not specified
```

### Important Variables in Your Setup

From your `src/.env` files:

```bash
# API Configuration (src/.env)
OPEN_WEATHER_API_KEY=551e4cf593423293510ff0d1f8e628f0
APP_NAME=weather-reporter
SERVICE_NAME=weather-reporter-weather-service

# MongoDB Atlas (src/.env.development)
MONGODB_CONNECTION=mongodb+srv://slwcluster0.wyprrfj.mongodb.net/...
MONGODB_DB_NAME=WeatherReporter
MONGODB_USE_CERT_AUTH=true

# Cache Strategy
CACHE_STRATEGY=memory                    # Default: memory, Docker: redis
```

## 📊 **Monitoring & Health Checks**

### Health Check Endpoint:

```bash
curl http://localhost:9001/api/v1/health
```

### View Logs:

```bash
# Development
docker-compose logs -f weather-service

# Production
docker-compose -f docker-compose.prod.yml logs -f weather-service
```

### Container Stats:

```bash
docker stats weather-service-dev
```

## 🐛 **Troubleshooting**

### Common Issues:

1. **Port Conflicts**: Ensure ports 9001, 27017, 6379 are available
2. **Environment Variables**: Check `.env` file exists and contains valid values
3. **Docker Permissions**: Ensure Docker daemon is running
4. **Memory Issues**: Increase Docker memory limits if needed

### Debug Commands:

```bash
# Check container status
docker ps

# Inspect container
docker inspect weather-service-dev

# Shell into container
docker exec -it weather-service-dev sh

# Check logs
docker logs weather-service-dev
```

## 📈 **Performance Optimization**

- **Multi-stage builds**: Reduced image size
- **Layer caching**: Optimized Dockerfile order
- **Alpine base**: Minimal overhead
- **nginx caching**: Static asset optimization
- **Rate limiting**: API protection
- **Health checks**: Automatic recovery

## 🚀 **Production Deployment**

1. **Build optimized image**:

   ```bash
   docker build --target production -t weather-service:prod .
   ```

2. **Deploy with docker-compose**:

   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Scale service**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --scale weather-service=3
   ```

## 📋 **Best Practices Implemented**

- ✅ Multi-stage builds for size optimization
- ✅ Non-root user for security
- ✅ Proper signal handling
- ✅ Health checks for reliability
- ✅ Resource limits for stability
- ✅ Comprehensive .dockerignore
- ✅ Separate dev/prod configurations
- ✅ Nginx reverse proxy
- ✅ Rate limiting and security headers
- ✅ Volume mounts for development
- ✅ Automated management scripts
