# Database Access Layer

This directory contains the database connection and migration scripts for the SL-WEATHER API.

## Connection Pooling

The database connection has been enhanced with connection pooling to improve performance and reliability. Connection pooling allows the application to reuse database connections instead of creating new ones for each request, which reduces overhead and improves response times.

### Configuration

Connection pooling is configured in `mongoose.js` with the following settings:

- **poolSize**: 10 (Maximum number of sockets to keep open)
- **minSize**: 2 (Minimum number of sockets to keep open)
- **maxIdleTimeMS**: 30000 (Close sockets after 30 seconds of inactivity)

These settings can be adjusted based on the application's needs and server resources.

## Database Migrations

Database migrations allow for versioned changes to the database schema. This ensures that all environments (development, staging, production) have consistent database structures and indexes.

### Migration Commands

The following npm scripts are available for managing migrations:

- `npm run migrate:create <name>` - Create a new migration file
- `npm run migrate:up` - Run all pending migrations
- `npm run migrate:down` - Revert the last applied migration
- `npm run migrate:status` - Show the status of all migrations

### Migration Files

Migration files are stored in the `db/migrations` directory. Each migration file exports two functions:

- `up`: Function to apply the migration
- `down`: Function to revert the migration

Example:

```javascript
export const up = async (db) => {
  // Apply changes
  await db.collection('collection').createIndex({ field: 1 })
}

export const down = async (db) => {
  // Revert changes
  await db.collection('collection').dropIndex({ field: 1 })
}
```

## Optimized Indexes

The database has been optimized with carefully selected indexes to improve query performance. These indexes are created through migrations to ensure consistency across environments.

### Key Indexes

- **WeatherData Collection**:

  - Single-field indexes on `deviceId`, `sentAt`, and various metric values
  - Compound indexes for common query patterns (`deviceId`+`sentAt`, `stationId`+`temperature`)

- **User Collection**:

  - Unique indexes on `email` and `username`

- **Station Collection**:

  - Geospatial index on `location`
  - Index on `name`

- **Device Collection**:

  - Indexes on `stationId` and `status`

- **API Keys Collection**:
  - Index on `userId`
  - TTL index on `expiresAt` for automatic expiration

## Best Practices

When working with the database layer, follow these best practices:

1. **Use migrations for schema changes**: Any change to the database schema should be done through migrations.
2. **Test migrations**: Always test migrations in a development environment before applying them to production.
3. **Monitor connection pool**: Keep an eye on the connection pool metrics to ensure it's properly sized.
4. **Consider query patterns**: When adding new queries, consider if new indexes are needed.
5. **Avoid index bloat**: Don't add unnecessary indexes as they can slow down write operations.
