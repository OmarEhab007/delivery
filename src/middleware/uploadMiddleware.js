const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const { createCustomError } = require('../utils/errorResponse');
const logger = require('../utils/logger'); // Add logger for better debugging

// Define the upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created upload directory: ${UPLOAD_DIR}`);
  logger.info(`Created upload directory: ${UPLOAD_DIR}`);
}

// Create temp directory immediately when middleware is loaded
const tempDir = path.join(UPLOAD_DIR, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created temp directory: ${tempDir}`);
  logger.info(`Created temp directory: ${tempDir}`);
}

// First store in temp directory, we'll move it later
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Initially store all files in temp directory
    const tempDir = path.join(UPLOAD_DIR, 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log(`Created temp directory: ${tempDir}`);
      logger.info(`Created temp directory: ${tempDir}`);
    }
    
    console.log(`File will be uploaded to: ${tempDir}`);
    logger.info(`File will be uploaded to: ${tempDir}`);
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Generate secure filename with timestamp and random string
    const timestamp = Date.now();
    const randomStr = require('crypto').randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const safeName = `${timestamp}-${randomStr}${extension}`;
    console.log(`Generated filename: ${safeName}`);
    logger.info(`Generated filename: ${safeName}`);
    cb(null, safeName);
  }
});

// Helper function to determine subdirectory
function getSubdirectory(entityType) {
  console.log('getSubdirectory called with:', entityType);
  logger.info(`getSubdirectory called with: ${entityType}`);
  
  const type = entityType ? entityType.toLowerCase() : 'unknown';
  console.log('Normalized entity type:', type);
  logger.info(`Normalized entity type: ${type}`);
  
  let result;
  switch (type) {
    case 'shipment':
      result = 'shipments';
      break;
    case 'application':
      result = 'applications';
      break;
    case 'truck':
      result = 'trucks';
      break;
    case 'user':
      result = 'users';
      break;
    default:
      result = 'temp';
  }
  
  console.log('Returning subdirectory:', result);
  logger.info(`Returning subdirectory: ${result}`);
  return result;
}

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types based on document type
  const allowedMimeTypes = {
    // Images
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    // Documents
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    // Spreadsheets
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    // Text
    'text/plain': true,
    'text/csv': true,
    'text/markdown': true,
    // Archives (be careful with these)
    'application/zip': true,
    'application/x-rar-compressed': true,
  };

  console.log(`Checking file type: ${file.mimetype}`);
  logger.info(`Checking file type: ${file.mimetype}`);

  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    console.error(`File type ${file.mimetype} not allowed`);
    logger.error(`File type ${file.mimetype} not allowed`);
    cb(createCustomError(`File type ${file.mimetype} not allowed`, 400), false);
  }
};

// Configure multer limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB limit (adjust as needed)
  files: 5, // Max 5 files per upload
};

// Create uploader
const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Function to move file to correct location based on entityType
function moveFileToCorrectLocation(file, entityType, entityId) {
  if (!file) {
    console.error('No file provided to moveFileToCorrectLocation');
    logger.error('No file provided to moveFileToCorrectLocation');
    return null;
  }
  
  // Determine the correct subdirectory
  const subdir = getSubdirectory(entityType);
  
  // Create target directory path - include entityId in the path if provided
  let targetDir = path.join(UPLOAD_DIR, subdir);
  if (entityId && mongoose.Types.ObjectId.isValid(entityId)) {
    targetDir = path.join(targetDir, entityId.toString());
  }
  
  console.log(`Target directory: ${targetDir}`);
  logger.info(`Target directory: ${targetDir}`);
  
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Created directory: ${targetDir}`);
      logger.info(`Created directory: ${targetDir}`);
    } catch (error) {
      console.error(`Error creating directory ${targetDir}:`, error);
      logger.error(`Error creating directory ${targetDir}: ${error.message}`);
      return null;
    }
  }
  
  // Create new path
  const newPath = path.join(targetDir, path.basename(file.path));
  
  try {
    // Move the file
    console.log(`Attempting to move file from ${file.path} to ${newPath}`);
    logger.info(`Attempting to move file from ${file.path} to ${newPath}`);
    
    // Check if source file exists
    if (!fs.existsSync(file.path)) {
      console.error(`Source file does not exist: ${file.path}`);
      logger.error(`Source file does not exist: ${file.path}`);
      return null;
    }
    
    fs.renameSync(file.path, newPath);
    console.log(`Moved file from ${file.path} to ${newPath}`);
    logger.info(`Moved file from ${file.path} to ${newPath}`);
    
    // Verify the file was moved successfully
    if (!fs.existsSync(newPath)) {
      console.error(`Failed to verify file at new location: ${newPath}`);
      logger.error(`Failed to verify file at new location: ${newPath}`);
      return null;
    }
    
    // Update file object
    file.path = newPath;
    file.destination = targetDir;
    
    // Update the relative path to be stored in database
    const relativePath = path.relative(UPLOAD_DIR, newPath);
    console.log(`Relative path for storage: ${relativePath}`);
    logger.info(`Relative path for storage: ${relativePath}`);
    return relativePath;
  } catch (err) {
    console.error('Error moving file:', err);
    logger.error(`Error moving file: ${err.message}`);
    return null; // Return null if move fails to indicate failure
  }
}

// Single file upload middleware
const singleUpload = (fieldName) => (req, res, next) => {
  console.log(`Starting upload for field: ${fieldName}`);
  logger.info(`Starting upload for field: ${fieldName}`);
  console.log('Initial request body:', req.body);
  
  const uploadSingle = upload.single(fieldName);

  uploadSingle(req, res, (err) => {
    console.log('After upload - request body:', req.body);
    
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error('Multer error:', err);
      logger.error(`Multer error: ${err.message}`);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createCustomError('File size exceeds the 5MB limit', 400));
      }
      return next(createCustomError(`Multer upload error: ${err.message}`, 400));
    }
    if (err) {
      // An unknown error occurred
      console.error('Unknown upload error:', err);
      logger.error(`Unknown upload error: ${err.message}`);
      return next(err);
    }

    // If no file was uploaded
    if (!req.file) {
      console.error('No file uploaded');
      logger.error('No file uploaded');
      return next(createCustomError('No file uploaded', 400));
    }

    console.log('File uploaded successfully:', req.file.path);
    logger.info(`File uploaded successfully: ${req.file.path}`);
    
    // Now we have the file and the correct entityType, move file to its proper location
    if (req.body.entityType) {
      const relativePath = moveFileToCorrectLocation(req.file, req.body.entityType, req.body.entityId);
      if (relativePath) {
        // Store the relative path for use in the controller
        req.file.relativePath = relativePath;
      } else {
        console.error('Failed to move file to final location');
        logger.error('Failed to move file to final location');
        // Continue anyway but log the error
      }
    } else {
      console.log('No entityType provided, file will remain in temp directory');
      logger.info('No entityType provided, file will remain in temp directory');
    }
    
    console.log('Updated file details:', {
      path: req.file.path,
      relativePath: req.file.relativePath,
      destination: req.file.destination,
      filename: req.file.filename
    });
    logger.info(`Updated file details: ${JSON.stringify({
      path: req.file.path,
      relativePath: req.file.relativePath,
      destination: req.file.destination,
      filename: req.file.filename
    })}`);
    
    next();
  });
};

// Multiple files upload middleware
const multiUpload =
  (fieldName, maxCount = 5) =>
  (req, res, next) => {
    console.log(`Starting multiple upload for field: ${fieldName}`);
    logger.info(`Starting multiple upload for field: ${fieldName}`);
    const uploadMultiple = upload.array(fieldName, maxCount);

    uploadMultiple(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        console.error('Multer error:', err);
        logger.error(`Multer error: ${err.message}`);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(createCustomError('File size exceeds the 5MB limit', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(createCustomError(`Cannot upload more than ${maxCount} files`, 400));
        }
        return next(createCustomError(`Multer upload error: ${err.message}`, 400));
      }
      if (err) {
        // An unknown error occurred
        console.error('Unknown upload error:', err);
        logger.error(`Unknown upload error: ${err.message}`);
        return next(err);
      }

      // If no files were uploaded
      if (!req.files || req.files.length === 0) {
        console.error('No files uploaded');
        logger.error('No files uploaded');
        return next(createCustomError('No files uploaded', 400));
      }

      console.log(`${req.files.length} files uploaded successfully`);
      logger.info(`${req.files.length} files uploaded successfully`);
      
      // Move files to their proper location
      if (req.body.entityType) {
        req.files.forEach(file => {
          const relativePath = moveFileToCorrectLocation(file, req.body.entityType, req.body.entityId);
          if (relativePath) {
            file.relativePath = relativePath;
          } else {
            console.error(`Failed to move file ${file.originalname} to final location`);
            logger.error(`Failed to move file ${file.originalname} to final location`);
          }
        });
      } else {
        console.log('No entityType provided, files will remain in temp directory');
        logger.info('No entityType provided, files will remain in temp directory');
      }
      
      next();
    });
  };

// Export middleware functions
module.exports = {
  singleUpload,
  multiUpload,
};
