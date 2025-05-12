const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');

const { Document, DocumentType } = require('../models/Document');
const logger = require('../utils/logger');
const { createCustomError } = require('../utils/errorResponse');

// Convert fs methods to promise-based
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Base directory for document storage
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Create upload directory if it doesn't exist
const initializeStorage = async () => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      logger.info(`Created document storage directory: ${UPLOAD_DIR}`);
    }

    // Create subdirectories for different entity types and temp directory
    const entityTypes = ['shipments', 'applications', 'trucks', 'users', 'temp'];
    for (const type of entityTypes) {
      const typePath = path.join(UPLOAD_DIR, type);
      if (!fs.existsSync(typePath)) {
        await mkdir(typePath, { recursive: true });
        logger.info(`Created subdirectory: ${typePath}`);
      }
    }

    return true;
  } catch (error) {
    logger.error(`Error initializing document storage: ${error.message}`, { error });
    throw error;
  }
};

// Initialize storage when the module is loaded
(async () => {
  try {
    await initializeStorage();
    logger.info('Document storage initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize document storage', { error });
  }
})();

// Generate secure file name
const generateSecureFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  const safeName = `${timestamp}-${randomStr}${extension}`;
  return safeName;
};

// Get subdirectory based on entity type
const getSubdirectory = (entityType) => {
  switch (entityType) {
    case 'Shipment':
      return 'shipments';
    case 'Application':
      return 'applications';
    case 'Truck':
      return 'trucks';
    case 'User':
      return 'users';
    default:
      return 'temp';
  }
};

// Save file to storage and create document record
const saveDocument = async (file, documentData) => {
  try {
    console.log('Starting saveDocument with file:', file ? 'File exists' : 'No file provided');
    logger.info(`Starting saveDocument with file: ${file ? file.originalname : 'No file provided'}`);
    console.log('Document data:', JSON.stringify(documentData, null, 2));
    logger.info(`Document data: ${JSON.stringify(documentData)}`);

    if (!file) {
      throw createCustomError('No file provided', 400);
    }

    await initializeStorage();

    const {
      name,
      description,
      documentType,
      entityType,
      entityId,
      uploadedBy,
      expiryDate,
      metadata,
    } = documentData;

    if (!Object.values(DocumentType).includes(documentType)) {
      throw createCustomError(`Invalid document type: ${documentType}`, 400);
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalname);
    console.log('Generated secure filename:', secureFilename);
    logger.info(`Generated secure filename: ${secureFilename}`);

    // Determine storage path
    const subdir = getSubdirectory(entityType);
    const entityDir = path.join(UPLOAD_DIR, subdir, entityId.toString());
    console.log('Entity directory:', entityDir);
    logger.info(`Entity directory: ${entityDir}`);

    // Create entity directory if it doesn't exist
    if (!fs.existsSync(entityDir)) {
      console.log('Creating entity directory:', entityDir);
      logger.info(`Creating entity directory: ${entityDir}`);
      try {
        await mkdir(entityDir, { recursive: true });
        // Set proper permissions
        fs.chmodSync(entityDir, 0o755);
      } catch (mkdirErr) {
        logger.error(`Error creating directory: ${mkdirErr.message}`, { error: mkdirErr });
        throw createCustomError(`Failed to create directory: ${mkdirErr.message}`, 500);
      }
    }

    // Complete file path
    const filePath = path.join(entityDir, secureFilename);
    const relativeFilePath = path.join(subdir, entityId.toString(), secureFilename);
    console.log('Absolute file path:', filePath);
    logger.info(`Absolute file path: ${filePath}`);
    console.log('Relative file path:', relativeFilePath);
    logger.info(`Relative file path: ${relativeFilePath}`);

    // Write file to disk
    try {
      // Check if file has buffer or needs to be read from path
      let fileContent;
      if (file.buffer) {
        console.log('Writing file buffer of size:', file.buffer.length);
        logger.info(`Writing file buffer of size: ${file.buffer.length}`);
        fileContent = file.buffer;
      } else if (file.path && fs.existsSync(file.path)) {
        console.log('Reading file from path:', file.path);
        logger.info(`Reading file from path: ${file.path}`);
        fileContent = await readFile(file.path);
      } else {
        throw new Error('File has no buffer and path is invalid or missing');
      }
      
      await writeFile(filePath, fileContent);
      console.log('File successfully written to disk');
      logger.info('File successfully written to disk');

      // Set proper permissions
      fs.chmodSync(filePath, 0o644);

      // Verify file was created
      if (fs.existsSync(filePath)) {
        const stats = await stat(filePath);
        console.log('File stats:', stats.size, 'bytes');
        logger.info(`File stats: ${stats.size} bytes`);
      } else {
        console.error('File not found after writing!');
        logger.error('File not found after writing!');
        throw new Error('File verification failed - file not found after writing');
      }
    } catch (writeError) {
      console.error('Error writing file to disk:', writeError);
      logger.error(`Error writing file to disk: ${writeError.message}`, { error: writeError });
      throw writeError;
    }

    // Create document record in database
    const document = new Document({
      name,
      description,
      filePath: relativeFilePath,
      fileSize: file.size || (file.buffer ? file.buffer.length : 0),
      mimeType: file.mimetype,
      fileExtension: path.extname(file.originalname),
      originalName: file.originalname,
      documentType,
      uploadedBy,
      entityType,
      entityId,
      expiryDate,
      metadata: metadata ? new Map(Object.entries(metadata)) : undefined,
    });

    await document.save();

    logger.info(`Document saved: ${document._id} at ${filePath}`);
    return document;
  } catch (error) {
    console.error('Error in saveDocument function:', error);
    logger.error(`Error saving document: ${error.message}`, { error });
    throw error;
  }
};

// Delete a document from storage and database
const deleteDocument = async (documentId, userId) => {
  try {
    const document = await Document.findById(documentId);

    if (!document) {
      throw createCustomError('Document not found', 404);
    }

    // Only the uploader or admin can delete documents
    if (document.uploadedBy.toString() !== userId.toString()) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        throw createCustomError('Not authorized to delete this document', 403);
      }
    }

    // Delete from storage
    const fullPath = path.join(UPLOAD_DIR, document.filePath);
    if (fs.existsSync(fullPath)) {
      await unlink(fullPath);
    }

    // Delete from database
    await Document.findByIdAndDelete(documentId);

    logger.info(`Document deleted: ${documentId}`);
    return { success: true, message: 'Document deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting document: ${error.message}`);
    throw error;
  }
};

// Get document file
const getDocumentFile = async (documentId, userId) => {
  try {
    const document = await Document.findById(documentId);

    if (!document) {
      throw createCustomError('Document not found', 404);
    }

    // Check permissions (implement according to your access control policy)

    const fullPath = path.join(UPLOAD_DIR, document.filePath);

    if (!fs.existsSync(fullPath)) {
      throw createCustomError('Document file not found on disk', 404);
    }

    const fileBuffer = await readFile(fullPath);

    return {
      file: fileBuffer,
      metadata: {
        name: document.name,
        mimeType: document.mimeType,
        size: document.fileSize,
        originalName: document.originalName,
      },
    };
  } catch (error) {
    logger.error(`Error retrieving document: ${error.message}`);
    throw error;
  }
};

// Get document by ID
const getDocumentById = async (documentId) => {
  try {
    const document = await Document.findById(documentId)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email');

    if (!document) {
      throw createCustomError('Document not found', 404);
    }

    return document;
  } catch (error) {
    logger.error(`Error retrieving document by ID: ${error.message}`);
    throw error;
  }
};

// Get documents by entity
const getDocumentsByEntity = async (entityType, entityId) => {
  try {
    const documents = await Document.find({
      entityType,
      entityId,
      isActive: true,
    })
      .populate('uploadedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return documents;
  } catch (error) {
    logger.error(`Error retrieving entity documents: ${error.message}`);
    throw error;
  }
};

// Verify a document
const verifyDocument = async (documentId, verifierId, notes) => {
  try {
    const document = await Document.findById(documentId);

    if (!document) {
      throw createCustomError('Document not found', 404);
    }

    // Document verification logic
    document.isVerified = true;
    document.verifiedBy = verifierId;
    document.verificationDate = new Date();
    if (notes) {
      document.verificationNotes = notes;
    }

    await document.save();
    logger.info(`Document verified: ${documentId} by ${verifierId}`);

    return document;
  } catch (error) {
    logger.error(`Error verifying document: ${error.message}`);
    throw error;
  }
};

// Update document metadata
const updateDocumentMetadata = async (documentId, userId, updateData) => {
  try {
    const document = await Document.findById(documentId);

    if (!document) {
      throw createCustomError('Document not found', 404);
    }

    // Authorization check
    if (document.uploadedBy.toString() !== userId.toString()) {
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        throw createCustomError('Not authorized to update this document', 403);
      }
    }

    // Allowed fields to update
    const allowedUpdates = ['name', 'description', 'documentType', 'expiryDate', 'metadata'];

    // Update allowed fields
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'metadata' && typeof updateData[key] === 'object') {
          // Convert object to Map for metadata
          document.metadata = new Map(Object.entries(updateData[key]));
        } else {
          document[key] = updateData[key];
        }
      }
    });

    await document.save();

    logger.info(`Document updated: ${documentId}`);
    return document;
  } catch (error) {
    logger.error(`Error updating document metadata: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeStorage,
  saveDocument,
  deleteDocument,
  getDocumentFile,
  getDocumentById,
  getDocumentsByEntity,
  verifyDocument,
  updateDocumentMetadata,
};
