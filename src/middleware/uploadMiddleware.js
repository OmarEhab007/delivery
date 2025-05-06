const multer = require('multer');
const { createCustomError } = require('../utils/errorResponse');

// Configure multer memory storage
const storage = multer.memoryStorage();

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
    'application/x-rar-compressed': true
  };

  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(createCustomError(`File type ${file.mimetype} not allowed`, 400), false);
  }
};

// Configure multer limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB limit (adjust as needed)
  files: 5 // Max 5 files per upload
};

// Create uploader
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Single file upload middleware
const singleUpload = (fieldName) => (req, res, next) => {
  const uploadSingle = upload.single(fieldName);
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createCustomError('File size exceeds the 5MB limit', 400));
      }
      return next(createCustomError(`Multer upload error: ${err.message}`, 400));
    } else if (err) {
      // An unknown error occurred
      return next(err);
    }
    
    // If no file was uploaded
    if (!req.file) {
      return next(createCustomError('No file uploaded', 400));
    }
    
    next();
  });
};

// Multiple files upload middleware
const multiUpload = (fieldName, maxCount = 5) => (req, res, next) => {
  const uploadMultiple = upload.array(fieldName, maxCount);
  
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(createCustomError('File size exceeds the 5MB limit', 400));
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return next(createCustomError(`Cannot upload more than ${maxCount} files`, 400));
      }
      return next(createCustomError(`Multer upload error: ${err.message}`, 400));
    } else if (err) {
      // An unknown error occurred
      return next(err);
    }
    
    // If no files were uploaded
    if (!req.files || req.files.length === 0) {
      return next(createCustomError('No files uploaded', 400));
    }
    
    next();
  });
};

module.exports = {
  singleUpload,
  multiUpload
}; 