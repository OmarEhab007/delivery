# MongoDB Transactions Support

This document explains how to enable and use MongoDB transactions in the Delivery App.

## Transaction Support Requirements

MongoDB transactions require either:
- A replica set deployment
- A sharded cluster with shards deployed as replica sets

Transactions **will not work** with a standalone MongoDB server.

## Error: "Transaction numbers are only allowed on a replica set member or mongos"

If you see this error, it means you're trying to use transactions with a standalone MongoDB server.

## Solutions

You have two options:

### Option 1: Disable Transactions (Recommended for Development)

This application includes a fallback mechanism that will automatically detect whether transactions are supported and use an alternative approach when they're not. 

To explicitly disable transactions for development:

1. Set the `USE_MONGODB_TRANSACTIONS` environment variable to `false` in your docker-compose.yml or .env file:
   ```
   USE_MONGODB_TRANSACTIONS=false
   ```

2. The application will automatically detect this setting and use non-transactional operations.

### Option 2: Enable Replica Set (For Production)

For production environments, we recommend using a replica set configuration to support transactions.

#### Using Docker Compose

1. Edit the docker-compose.yml file and uncomment the following lines:
   ```yaml
   # For enabling transactions, uncomment these lines to run as a replica set
   command: mongod --replSet rs0 --bind_ip_all
   environment:
     - MONGO_INITDB_DATABASE=delivery-app
   ```

2. Set the `USE_MONGODB_TRANSACTIONS` environment variable to `true`:
   ```
   USE_MONGODB_TRANSACTIONS=true
   ```

3. Restart your Docker containers:
   ```
   docker-compose down
   docker-compose up -d
   ```

#### Manual MongoDB Configuration

If you're running MongoDB directly (not via Docker):

1. Start MongoDB with the `--replSet` option:
   ```
   mongod --replSet rs0 --bind_ip_all
   ```

2. Connect to MongoDB and initialize the replica set:
   ```
   mongo
   > rs.initiate()
   ```

3. Set the `USE_MONGODB_TRANSACTIONS` environment variable to `true` for your application.

## Verifying Transaction Support

When the application starts, it will log whether transactions are supported:

- If supported: `MongoDB transactions are supported and enabled.`
- If not supported: `MongoDB transactions are not supported or disabled by configuration. Operating in fallback mode.`

## Application Behavior

- When transactions are supported, the application will use them for operations that modify multiple collections to ensure data consistency.
- When transactions are not supported, the application will fall back to non-transactional operations but still try to maintain data consistency as much as possible.

## Recommendation

For development and testing, using the fallback mode (Option 1) is simpler and requires no special MongoDB configuration. 

For production deployments, using a properly configured replica set (Option 2) is recommended for full data consistency. 