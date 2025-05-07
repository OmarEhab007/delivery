# Database Scripts

This directory contains scripts for database management and optimization.

## Available Scripts

### `createIndexes.js`

This script creates optimized MongoDB indexes to improve query performance across all collections in the delivery application.

#### Features:

- Creates strategic indexes for all collections (User, Shipment, Truck, Application, Document)
- Implements single-field indexes for frequent lookups
- Creates compound indexes for common query patterns
- Adds geospatial indexes for location-based queries
- Sets up unique constraints where needed
- Configures background index creation to minimize impact on production

#### Usage:

```bash
# Run during initial setup
node src/scripts/database/createIndexes.js

# Run after schema updates
node src/scripts/database/createIndexes.js
```

#### When to Run:

1. After initial database setup
2. When new fields are added that require indexing
3. When query patterns change and need optimization
4. After significant schema changes

#### Index Strategies by Collection:

##### User Collection
- Email (unique)
- Role-based queries
- Verification status
- Geolocation queries
- Driver availability

##### Shipment Collection
- Status-based queries
- Merchant/Driver/Truck filtering
- Location-based queries
- Date-based sorting
- Specialized business queries (hazardous cargo, payment status)

##### Truck Collection
- Owner/Driver association
- Availability and status filtering
- Capacity-based queries
- Document expiration dates

##### Application Collection
- Shipment association
- Status-based filtering
- Price-based sorting
- Unique constraints

##### Document Collection
- Entity association
- Verification status
- Expiration tracking

#### Notes:

- Indexes improve read performance but can impact write performance
- The script logs detailed information about created indexes
- Index creation runs in the background to minimize impact on production systems
- All indexes are documented in the script with comments explaining their purpose

### `monitorIndexes.js`

This script monitors the usage of MongoDB indexes to help identify underused or overused indexes for performance optimization.

#### Features:

- Analyzes index usage statistics across all collections
- Identifies unused indexes that can be safely removed
- Highlights the most frequently used indexes
- Provides usage percentage for each index
- Generates recommendations for index optimization

#### Usage:

```bash
# Run periodically to check index usage
node src/scripts/database/monitorIndexes.js
```

#### When to Run:

1. After the application has been running in production for some time
2. Periodically (weekly/monthly) to identify optimization opportunities
3. When experiencing performance issues
4. Before major database schema changes

#### Output:

The script provides a detailed report including:

- Summary of index usage across all collections
- List of unused indexes that might be candidates for removal
- Most heavily used indexes per collection
- Usage statistics for all indexes
- Recommendations for optimizations

#### Notes:

- MongoDB requires some operational time to gather meaningful statistics
- The script is non-destructive and only analyzes without making changes
- Consider keeping the output for historical comparison
- Review recommendations carefully before dropping any indexes

## Performance Considerations

- Each index increases storage requirements
- Too many indexes can slow down write operations
- Regularly monitor index usage with MongoDB commands:
  ```
  db.collection.aggregate([{$indexStats:{}}])
  ```
- Consider dropping unused indexes using:
  ```
  db.collection.dropIndex("indexName")
  ```

## Future Scripts

This directory may include additional scripts for database management:

- Data migration scripts
- Consistency checks
- Performance optimization tools
- Backup and restore utilities 