const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Convert fs methods to promise-based
const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);
const stat = promisify(fs.stat);

/**
 * Ensures the log directory exists and has proper permissions
 * @returns {Promise<boolean>} Returns true if successful
 */
const ensureLogDirectory = async () => {
  try {
    const logDir = path.join(process.cwd(), 'logs');

    // Check if directory exists
    let dirExists = false;
    try {
      await stat(logDir);
      dirExists = true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Create directory if it doesn't exist
    if (!dirExists) {
      await mkdir(logDir, { recursive: true });
      console.log(`Created logs directory: ${logDir}`);
    }

    // Set permissions (rwxr-xr-x)
    await chmod(logDir, 0o755);

    // Create test file to verify write permissions
    const testFilePath = path.join(logDir, 'test.log');
    try {
      const testData = `Log test: ${new Date().toISOString()}\n`;
      await fs.promises.writeFile(testFilePath, testData, { flag: 'a' });

      // Remove test file
      await fs.promises.unlink(testFilePath);
    } catch (error) {
      console.error(`Cannot write to logs directory: ${error.message}`);
      throw new Error(`Log directory exists but is not writable: ${logDir}`);
    }

    return true;
  } catch (error) {
    console.error(`Error ensuring log directory: ${error.message}`);
    throw error;
  }
};

module.exports = ensureLogDirectory;
