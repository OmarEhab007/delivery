/**
 * Utility script for viewing and managing logs
 * Usage: node src/scripts/log-utils.js [action] [options]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
require('dotenv').config();

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
      console.log(`Created logs directory: ${LOG_DIR}`);
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
        console.log(helpText);
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
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

    // Print table
    console.log('\nLog Files:');
    console.log('=========================================================');
    console.log('Filename                       Size       Last Modified');
    console.log('=========================================================');

    sortedFiles.forEach((file) => {
      const name = file.name.padEnd(30);
      const size = file.size.padEnd(10);
      console.log(`${name} ${size} ${file.modified}`);
    });

    console.log('=========================================================');
    console.log(`Total: ${sortedFiles.length} log files\n`);
  } catch (error) {
    console.error(`Failed to list logs: ${error.message}`);
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
    console.error('Error: Log file name required');
    console.log('Available log files:');
    await listLogs();
    return;
  }

  const logFile = path.join(LOG_DIR, file);

  if (!fs.existsSync(logFile)) {
    console.error(`Error: Log file not found: ${file}`);
    console.log('Available log files:');
    await listLogs();
    return;
  }

  try {
    // Using tail command on Unix-based systems
    if (process.platform !== 'win32') {
      const { execSync } = require('child_process');
      const result = execSync(`tail -n ${lines} "${logFile}"`, { encoding: 'utf8' });
      console.log(`\nLast ${lines} lines of ${file}:`);
      console.log('=========================================================');
      console.log(result);
      console.log('=========================================================');
      return;
    }

    // Fallback for Windows
    const content = fs.readFileSync(logFile, 'utf8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines);

    console.log(`\nLast ${lines} lines of ${file}:`);
    console.log('=========================================================');
    console.log(lastLines.join('\n'));
    console.log('=========================================================');
  } catch (error) {
    console.error(`Failed to read log file: ${error.message}`);
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
      console.error('Error: Days must be positive');
      return;
    }

    console.log(`Cleaning log files older than ${days} days...`);

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
        console.log(`Deleted: ${file}`);
      }
    }

    console.log(`\nResults: ${deleted} files deleted, ${skipped} files skipped`);
  } catch (error) {
    console.error(`Failed to clean logs: ${error.message}`);
    throw error;
  }
}

/**
 * Force log rotation
 */
async function forceRotate() {
  console.log('Feature not implemented yet');
  console.log('Winston will automatically rotate logs based on your configuration.');
}

/**
 * Archive logs to zip file
 */
async function archiveLogs() {
  console.log('Feature not implemented yet');
  console.log('You can implement archiving logs to a zip file here.');
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

// Run the script
main();
