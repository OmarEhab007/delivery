/**
 * Utility script for viewing and managing logs
 * Usage: node src/scripts/log-utils.js [action] [options]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
require('dotenv').config();
const logger = require('../utils/logger');

// Convert fs methods to promise-based
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

// Define log directory
const LOG_DIR = path.join(process.cwd(), 'logs');

// Available actions
const ACTIONS = {
  LIST: 'list',
  TAIL: 'tail',
  CLEAN: 'clean',
  ROTATE: 'rotate',
  ARCHIVE: 'archive',
  HELP: 'help',
};

// Help text
const helpText = `
Log Management Utility

Usage: node src/scripts/log-utils.js [action] [options]

Actions:
  list              List all log files
  tail [file] [n]   View the last n lines of a log file (default: 10)
  clean [days]      Delete log files older than n days (default: 30)
  rotate            Force log rotation
  archive           Archive logs to zip file
  help              Show this help message

Examples:
  node src/scripts/log-utils.js list
  node src/scripts/log-utils.js tail application-2023-01-01.log 20
  node src/scripts/log-utils.js clean 15
`;

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const action = args[0] || ACTIONS.HELP;

    // Make sure logs directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      logger.info(`Created logs directory: ${LOG_DIR}`);
    }

    switch (action) {
      case ACTIONS.LIST:
        await listLogs();
        break;

      case ACTIONS.TAIL:
        const logFile = args[1];
        const lines = parseInt(args[2]) || 10;
        await tailLog(logFile, lines);
        break;

      case ACTIONS.CLEAN:
        const days = parseInt(args[1]) || 30;
        await cleanLogs(days);
        break;

      case ACTIONS.ROTATE:
        await forceRotate();
        break;

      case ACTIONS.ARCHIVE:
        await archiveLogs();
        break;

      case ACTIONS.HELP:
      default:
        printHelp();
        break;
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List all log files with size and modified date
 */
async function listLogs() {
  try {
    const files = await readdir(LOG_DIR);

    // Get file stats
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(LOG_DIR, file);
        const stats = await stat(filePath);
        return {
          name: file,
          size: formatBytes(stats.size),
          modified: stats.mtime.toISOString(),
          isAudit: file.startsWith('.') && file.endsWith('-audit.json'),
        };
      })
    );

    // Filter out audit files and sort by modified date (newest first)
    const sortedFiles = fileStats
      .filter((file) => !file.isAudit)
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    if (files.length === 0) {
      logger.info('No log files found in logs directory.');
      return;
    }

    logger.info('Log Files Summary');
    logger.info('=========================================================');
    logger.info('Filename                       Size       Last Modified');
    logger.info('=========================================================');
    sortedFiles.forEach((file) => {
      logger.info(`${file.name.padEnd(30)} ${file.size.padStart(10)} ${file.modified}`);
    });
    logger.info('=========================================================');
    logger.info(`Total: ${sortedFiles.length} log files`);
  } catch (error) {
    logger.error(`Failed to list logs: ${error.message}`);
    throw error;
  }
}

/**
 * View the last n lines of a log file
 * @param {string} file - Log file name
 * @param {number} lines - Number of lines to read
 */
async function tailLog(file, lines = 10) {
  if (!file) {
    logger.error('Please specify a file to tail.');
    return;
  }

  const logFile = path.join(LOG_DIR, file);

  if (!fs.existsSync(logFile)) {
    logger.error(`Error: Log file not found: ${file}`);
    return;
  }

  try {
    // Using tail command on Unix-based systems
    if (process.platform !== 'win32') {
      const { execSync } = require('child_process');
      const result = execSync(`tail -n ${lines} "${logFile}"`, { encoding: 'utf8' });
      logger.info(`Tailing ${file} (last ${lines} lines)`);
      logger.info('=========================================================');
      logger.info(result);
      logger.info('=========================================================');
      return;
    }

    // Fallback for Windows
    const content = fs.readFileSync(logFile, 'utf8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines);

    logger.info(`Tailing ${file} (last ${lines} lines)`);
    logger.info('=========================================================');
    logger.info(lastLines.join('\n'));
    logger.info('=========================================================');
  } catch (error) {
    logger.error(`Failed to read log file: ${error.message}`);
    throw error;
  }
}

/**
 * Delete log files older than n days
 * @param {number} days - Number of days
 */
async function cleanLogs(days = 30) {
  try {
    if (days < 1) {
      logger.error('Error: Days must be positive');
      return;
    }

    logger.info(`Cleaning log files older than ${days} days...`);

    const files = await readdir(LOG_DIR);
    const now = new Date();
    const cutoff = new Date(now.setDate(now.getDate() - days));

    let deleted = 0;
    let skipped = 0;

    for (const file of files) {
      // Skip audit files and non-dated log files
      if (file.startsWith('.') || !file.match(/\d{4}-\d{2}-\d{2}/)) {
        skipped++;
        continue;
      }

      const filePath = path.join(LOG_DIR, file);
      const stats = await stat(filePath);

      if (stats.mtime < cutoff) {
        await unlink(filePath);
        deleted++;
        logger.info(`Deleted: ${file}`);
      }
    }

    logger.info(`Results: ${deleted} files deleted, ${skipped} files skipped`);
  } catch (error) {
    logger.error(`Failed to clean logs: ${error.message}`);
    throw error;
  }
}

/**
 * Force log rotation
 */
async function forceRotate() {
  logger.info('Feature not implemented yet. Winston rotates logs automatically.');
}

/**
 * Archive logs to zip file
 */
async function archiveLogs() {
  logger.info('Feature not implemented yet. Add compression/archival logic here.');
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

const printHelp = () => {
  const helpText = `Usage: npm run logs [command]\n\nCommands:\n  npm run logs              Show help\n  npm run logs:list         List available log files\n  npm run logs:tail <file>  Tail a specific log file\n  npm run logs:clean 7      Delete log files older than N days`;
  logger.info(helpText);
};

// Run the script
main();
