/**
 * MongoDB Index Usage Monitoring Script
 * 
 * This script monitors the usage of indexes in MongoDB collections
 * to help identify underused or overused indexes and optimize database performance.
 * 
 * Usage:
 * - Run periodically to analyze index usage: node src/scripts/database/monitorIndexes.js
 * - Consider running in production every week or month to identify optimization opportunities
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Function to log with timestamp
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Monitor index usage for a collection
async function monitorCollectionIndexes(db, collectionName) {
  try {
    log(`Analyzing indexes for collection: ${collectionName}`);
    
    // Get index statistics
    const indexStats = await db.collection(collectionName).aggregate([
      { $indexStats: {} }
    ]).toArray();
    
    // If no index stats available
    if (!indexStats || indexStats.length === 0) {
      log(`No index statistics available for ${collectionName}`);
      return {
        collectionName,
        indexCount: 0,
        indexes: []
      };
    }
    
    // Process index statistics
    const processedStats = indexStats.map(stat => ({
      name: stat.name,
      key: JSON.stringify(stat.key),
      ops: stat.accesses.ops,
      since: stat.accesses.since
    }));
    
    // Identify unused indexes (except _id which is required)
    const unusedIndexes = processedStats
      .filter(stat => stat.ops === 0 && stat.name !== '_id_')
      .map(stat => stat.name);
    
    // Get the most used indexes
    const sortedByUsage = [...processedStats].sort((a, b) => b.ops - a.ops);
    const mostUsedIndexes = sortedByUsage.slice(0, 5).map(stat => ({
      name: stat.name,
      ops: stat.ops
    }));
    
    // Calculate usage ratio for reporting
    const totalOps = processedStats.reduce((acc, stat) => acc + stat.ops, 0);
    const usageData = processedStats.map(stat => ({
      name: stat.name,
      key: stat.key,
      ops: stat.ops,
      usagePercentage: totalOps > 0 ? ((stat.ops / totalOps) * 100).toFixed(2) + '%' : '0%'
    }));
    
    // Return analysis
    return {
      collectionName,
      indexCount: processedStats.length,
      totalOperations: totalOps,
      unusedIndexes: unusedIndexes.length > 0 ? unusedIndexes : null,
      mostUsedIndexes: mostUsedIndexes.length > 0 ? mostUsedIndexes : null,
      allIndexes: usageData
    };
  } catch (error) {
    log(`Error analyzing indexes for ${collectionName}: ${error.message}`);
    return {
      collectionName,
      error: error.message
    };
  }
}

// Main function to monitor all collection indexes
async function monitorIndexes() {
  log('Starting index usage monitoring...');
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  try {
    await client.connect();
    log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(coll => coll.name);
    
    log(`Found ${collectionNames.length} collections`);
    
    // Monitor indexes for each collection
    const results = [];
    for (const collName of collectionNames) {
      const stats = await monitorCollectionIndexes(db, collName);
      results.push(stats);
    }
    
    // Generate report
    log('Index Usage Report:');
    
    // Summary section
    const summary = {
      totalCollections: results.length,
      collectionsWithUnusedIndexes: results.filter(r => r.unusedIndexes && r.unusedIndexes.length > 0).length,
      totalUnusedIndexes: results.reduce((acc, r) => acc + (r.unusedIndexes ? r.unusedIndexes.length : 0), 0),
      timestamp: new Date().toISOString()
    };
    
    log('Summary:');
    console.log(JSON.stringify(summary, null, 2));
    
    // Detailed results for collections with unused indexes
    const collectionsWithUnusedIndexes = results.filter(r => r.unusedIndexes && r.unusedIndexes.length > 0);
    if (collectionsWithUnusedIndexes.length > 0) {
      log('\nCollections with unused indexes:');
      collectionsWithUnusedIndexes.forEach(coll => {
        log(`- ${coll.collectionName}: ${coll.unusedIndexes.join(', ')}`);
      });
      
      log('\nRecommendation: Consider dropping these unused indexes to improve write performance.');
      log('Example command:');
      collectionsWithUnusedIndexes.forEach(coll => {
        coll.unusedIndexes.forEach(idx => {
          log(`db.${coll.collectionName}.dropIndex("${idx}")`);
        });
      });
    } else {
      log('\nNo unused indexes found. All indexes appear to be in use.');
    }
    
    // Highest usage indexes
    log('\nMost used indexes by collection:');
    results.forEach(coll => {
      if (coll.mostUsedIndexes && coll.mostUsedIndexes.length > 0) {
        log(`\n${coll.collectionName}:`);
        coll.mostUsedIndexes.forEach(idx => {
          log(`- ${idx.name}: ${idx.ops} operations`);
        });
      }
    });
    
    // Return compiled results
    return {
      summary,
      details: results
    };
  } catch (error) {
    log(`Error monitoring indexes: ${error.message}`);
    console.error(error);
    return { error: error.message };
  } finally {
    await client.close();
    log('MongoDB connection closed');
  }
}

// If script is run directly (not imported)
if (require.main === module) {
  monitorIndexes()
    .then(results => {
      log('Index monitoring completed');
      process.exit(0);
    })
    .catch(err => {
      log(`Error in monitoring script: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = monitorIndexes;
} 