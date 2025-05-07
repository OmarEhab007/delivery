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
    
    // Create subdirectories for different entity types
    const entityTypes = ['shipments', 'applications', 'trucks', 'users'];
    for (const type of entityTypes) {
      const typePath = path.join(UPLOAD_DIR, type);
      if (!fs.existsSync(typePath)) {
        await mkdir(typePath, { recursive: true });
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error initializing document storage: ${error.message}`);
    throw error;
  }
};

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
  switch(entityType) {
    case 'Shipment':
      return 'shipments';
    case 'Application':
      return 'applications';
    case 'Truck':
      return 'trucks';
    case 'User':
      return 'users';
    default:
      return 'other';
  }
};

// Save file to storage and create document record
const saveDocument = async (file, documentData) => {
  try {
    console.log('Starting saveDocument with file:', file ? 'File exists' : 'No file provided');
    console.log('Document data:', JSON.stringify(documentData, null, 2));
    
    await initializeStorage();
    
    const {
      name,
      description,
      documentType,
      entityType,
      entityId,
      uploadedBy,
      expiryDate,
      metadata
    } = documentData;

    if (!Object.values(DocumentType).includes(documentType)) {
      throw createCustomError(`Invalid document type: ${documentType}`, 400);
    }
    
    // Generate secure filename
    const secureFilename = generateSecureFilename(file.originalname);
    console.log('Generated secure filename:', secureFilename);
    
    // Determine storage path
    const subdir = getSubdirectory(entityType);
    const entityDir = path.join(UPLOAD_DIR, subdir, entityId.toString());
    console.log('Entity directory:', entityDir);
    
    // Create entity directory if it doesn't exist
    if (!fs.existsSync(entityDir)) {
      console.log('Creating entity directory:', entityDir);
      await mkdir(entityDir, { recursive: true });
    }
    
    // Complete file path
    const filePath = path.join(entityDir, secureFilename);
    const relativeFilePath = path.join(subdir, entityId.toString(), secureFilename);
    console.log('Absolute file path:', filePath);
    console.log('Relative file path:', relativeFilePath);
    
    // Write file to disk
    try {
      console.log('Writing file buffer of size:', file.buffer.length);
      await writeFile(filePath, file.buffer);
      console.log('File successfully written to disk');
      
      // Verify file was created
      if (fs.existsSync(filePath)) {
        const stats = await stat(filePath);
        console.log('File stats:', stats.size, 'bytes');
      } else {
        console.error('File not found after writing!');
      }
    } catch (writeError) {
      console.error('Error writing file to disk:', writeError);
      throw writeError;
    }
    
    // Create document record in database
    const document = new Document({
      name,
      description,
      filePath: relativeFilePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileExtension: path.extname(file.originalname),
      originalName: file.originalname,
      documentType,
      uploadedBy,
      entityType,
      entityId,
      expiryDate,
      metadata: metadata ? new Map(Object.entries(metadata)) : undefined
    });
    
    await document.save();
    
    logger.info(`Document saved: ${document._id} at ${filePath}`);
    return document;
  } catch (error) {
    console.error('Error in saveDocument function:', error);
    logger.error(`Error saving document: ${error.message}`);
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
        originalName: document.originalName
      }
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
      isActive: true 
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
    Object.keys(updateData).forEach(key => {
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
  updateDocumentMetadata
}; 