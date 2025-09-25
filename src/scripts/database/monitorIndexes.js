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
const logger = require('../../utils/logger');

const log = (message, meta = {}) => {
  logger.info(message, meta);
};

async function monitorCollectionIndexes(db, collectionName) {
  try {
    log('Analyzing collection indexes', { collectionName });

    const indexStats = await db
      .collection(collectionName)
      .aggregate([{ $indexStats: {} }])
      .toArray();

    if (!indexStats || indexStats.length === 0) {
      log('No index statistics available', { collectionName });
      return {
        collectionName,
        indexCount: 0,
        indexes: [],
      };
    }

    const processedStats = indexStats.map((stat) => ({
      name: stat.name,
      key: JSON.stringify(stat.key),
      ops: stat.accesses.ops,
      since: stat.accesses.since,
    }));

    const unusedIndexes = processedStats
      .filter((stat) => stat.ops === 0 && stat.name !== '_id_')
      .map((stat) => stat.name);

    const sortedByUsage = [...processedStats].sort((a, b) => b.ops - a.ops);
    const mostUsedIndexes = sortedByUsage.slice(0, 5).map((stat) => ({
      name: stat.name,
      ops: stat.ops,
    }));

    const totalOps = processedStats.reduce((acc, stat) => acc + stat.ops, 0);
    const usageData = processedStats.map((stat) => ({
      name: stat.name,
      key: stat.key,
      ops: stat.ops,
      usagePercentage: totalOps > 0 ? `${((stat.ops / totalOps) * 100).toFixed(2)}%` : '0%',
    }));

    return {
      collectionName,
      indexCount: processedStats.length,
      totalOperations: totalOps,
      unusedIndexes: unusedIndexes.length > 0 ? unusedIndexes : null,
      mostUsedIndexes: mostUsedIndexes.length > 0 ? mostUsedIndexes : null,
      allIndexes: usageData,
    };
  } catch (error) {
    logger.error('Error analyzing collection indexes', {
      collectionName,
      error: error.message,
    });
    return {
      collectionName,
      error: error.message,
    };
  }
}

async function monitorIndexes() {
  log('Starting index usage monitoring');

  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    log('Connected to MongoDB for index monitoring');

    const db = client.db();
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((coll) => coll.name);

    log('Collections discovered', { count: collectionNames.length });

    const results = [];
    for (const collName of collectionNames) {
      const stats = await monitorCollectionIndexes(db, collName);
      results.push(stats);
    }

    const summary = {
      totalCollections: results.length,
      collectionsWithUnusedIndexes: results.filter(
        (r) => r.unusedIndexes && r.unusedIndexes.length > 0
      ).length,
      totalUnusedIndexes: results.reduce(
        (acc, r) => acc + (r.unusedIndexes ? r.unusedIndexes.length : 0),
        0
      ),
      timestamp: new Date().toISOString(),
    };

    log('Index usage summary', summary);

    const collectionsWithUnusedIndexes = results.filter(
      (r) => r.unusedIndexes && r.unusedIndexes.length > 0
    );
    if (collectionsWithUnusedIndexes.length > 0) {
      collectionsWithUnusedIndexes.forEach((coll) => {
        log('Unused indexes detected', {
          collectionName: coll.collectionName,
          indexes: coll.unusedIndexes,
        });
      });

      log('Recommendation', {
        message: 'Consider dropping unused indexes to improve write performance.',
      });
    } else {
      log('No unused indexes found across collections');
    }

    results.forEach((coll) => {
      if (coll.mostUsedIndexes && coll.mostUsedIndexes.length > 0) {
        log('Most used indexes', {
          collectionName: coll.collectionName,
          indexes: coll.mostUsedIndexes,
        });
      }
    });

    return {
      summary,
      details: results,
    };
  } catch (error) {
    logger.error('Error monitoring indexes', { error: error.message });
    return { error: error.message };
  } finally {
    await client.close();
    log('MongoDB connection closed after monitoring');
  }
}

if (require.main === module) {
  monitorIndexes()
    .then(() => {
      log('Index monitoring completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Index monitoring failed', { error: err.message });
      process.exit(1);
    });
} else {
  module.exports = monitorIndexes;
}
