const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const documentService = require('../services/documentService');
const { Document, DocumentType } = require('../models/Document');
const { Shipment } = require('../models/Shipment');
const { Application } = require('../models/Application');
const Truck = require('../models/Truck');
const User = require('../models/User');
const { catchAsync } = require('../utils/catchAsync');
const { createCustomError } = require('../utils/errorResponse');
const logger = require('../utils/logger');
const { ApiError } = require('../utils/apiError');

// Define the upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Validate entity exists before document upload
const validateEntity = async (entityType, entityId) => {
  try {
    // Debug logging
    logger.debug('validateEntity called with:', { entityType, entityId });

    let entity;
    switch (entityType) {
      case 'Shipment':
        if (!Shipment || typeof Shipment.findById !== 'function') {
          throw createCustomError('Shipment model is not properly initialized', 500);
        }
        entity = await Shipment.findById(entityId);
        break;
      case 'Application':
        if (!Application || typeof Application.findById !== 'function') {
          throw createCustomError('Application model is not properly initialized', 500);
        }
        entity = await Application.findById(entityId);
        break;
      case 'Truck':
        if (!Truck || typeof Truck.findById !== 'function') {
          throw createCustomError('Truck model is not properly initialized', 500);
        }
        entity = await Truck.findById(entityId);
        break;
      case 'User':
        if (!User || typeof User.findById !== 'function') {
          throw createCustomError('User model is not properly initialized', 500);
        }
        entity = await User.findById(entityId);
        break;
      default:
        throw createCustomError(`Invalid entity type: ${entityType}`, 400);
    }

    if (!entity) {
      throw createCustomError(`${entityType} with ID ${entityId} not found`, 404);
    }

    return entity;
  } catch (error) {
    logger.error('Error in validateEntity:', error);
    throw error;
  }
};

// Upload a document
const uploadDocument = catchAsync(async (req, res, next) => {
  logger.info('Starting document upload process');

  // Ensure required fields are provided
  const { entityType, entityId, documentType, name } = req.body;

  if (!entityType || !entityId || !documentType || !name) {
    return next(
      new ApiError(
        'Missing required fields. Please provide entityType, entityId, documentType, and name.',
        400
      )
    );
  }

  logger.info(`Received document upload request for ${entityType} ${entityId}`);

  // Validate entity exists
  await validateEntity(entityType, entityId);

  // Check if file was uploaded
  if (!req.file) {
    return next(new ApiError('No file was uploaded', 400));
  }

  logger.info('Upload file details', {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath: req.file.path,
  });

  try {
    // For disk storage, create document directly from uploaded file info
    const document = new Document({
      name: req.body.name,
      description: req.body.description,
      filePath: req.file.relativePath || req.file.path.replace(process.cwd() + '/uploads/', ''), // Use the relative path from middleware if available
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: path.extname(req.file.originalname),
      originalName: req.file.originalname,
      documentType: req.body.documentType,
      uploadedBy: req.user.id,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      expiryDate: req.body.expiryDate,
      metadata: req.body.metadata ? new Map(Object.entries(req.body.metadata)) : undefined,
    });

    await document.save();

    // Log the successful document upload
    logger.info(`Document uploaded: ${document._id} for ${entityType} ${entityId}`);

    res.status(201).json({
      status: 'success',
      data: {
        document,
      },
    });
  } catch (error) {
    logger.error(`Error saving document: ${error.message}`);
    return next(new ApiError(`Failed to save document: ${error.message}`, 500));
  }
});

// Upload multiple documents
const uploadMultipleDocuments = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.body;

  // Validate required fields
  if (!entityType || !entityId) {
    throw createCustomError('Missing required fields: entityType, entityId', 400);
  }

  // Validate entity type
  if (!['Shipment', 'Application', 'Truck', 'User'].includes(entityType)) {
    throw createCustomError(`Invalid entity type: ${entityType}`, 400);
  }

  // Validate entityId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    throw createCustomError(`Invalid entity ID format: ${entityId}`, 400);
  }

  // Verify entity exists
  const entity = await validateEntity(entityType, entityId);

  const documents = [];

  // Upload each file
  for (const file of req.files) {
    const fileData = JSON.parse(req.body[`fileData_${file.originalname}`] || '{}');

    // Validate document type
    if (!fileData.documentType || !Object.values(DocumentType).includes(fileData.documentType)) {
      throw createCustomError(`Invalid document type for file ${file.originalname}`, 400);
    }

    const documentData = {
      name: fileData.name || file.originalname,
      description: fileData.description || '',
      documentType: fileData.documentType,
      entityType,
      entityId,
      uploadedBy: req.user.id,
      expiryDate: fileData.expiryDate ? new Date(fileData.expiryDate) : undefined,
      metadata: fileData.metadata,
    };

    // If we have a relativePath from middleware, prioritize it
    if (file.relativePath) {
      // Use file directly without going through service's file moving logic
      const document = new Document({
        name: documentData.name,
        description: documentData.description,
        filePath: file.relativePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileExtension: path.extname(file.originalname),
        originalName: file.originalname,
        documentType: documentData.documentType,
        uploadedBy: documentData.uploadedBy,
        entityType: documentData.entityType,
        entityId: documentData.entityId,
        expiryDate: documentData.expiryDate,
        metadata: documentData.metadata
          ? new Map(Object.entries(documentData.metadata))
          : undefined,
      });

      await document.save();
      documents.push(document);
    } else {
      // Use the existing service
      const document = await documentService.saveDocument(file, documentData);
      documents.push(document);
    }

    // Link document to entity
    switch (entityType) {
      case 'Shipment':
        await entity.addDocument(documents[documents.length - 1]);
        break;
      case 'Application':
        await entity.addDocument(documents[documents.length - 1]);
        break;
      case 'Truck':
        await entity.addDocument(documents[documents.length - 1]);
        break;
      case 'User':
        await entity.addDocument(documents[documents.length - 1]);
        break;
    }
  }

  res.status(201).json({
    success: true,
    count: documents.length,
    data: documents,
  });
});

// Get document by ID
const getDocument = catchAsync(async (req, res, next) => {
  const document = await documentService.getDocumentById(req.params.id);

  // SEC-010: Implement document access control
  // OWASP A01:2021 - Broken Access Control
  // Users can only access documents they uploaded or documents related to their entities
  const isAdmin = req.user.role === 'Admin';
  const isUploader = document.uploadedBy.toString() === req.user.id;

  // Check if user has access to the entity this document belongs to
  let hasEntityAccess = false;
  if (document.entityType === 'User' && document.entityId.toString() === req.user.id) {
    hasEntityAccess = true;
  } else if (document.entityType === 'Shipment' || document.entityType === 'Application') {
    // Merchants can access their shipments/applications, truck owners can access applications they bid on
    const entity = await validateEntity(document.entityType, document.entityId);
    if (entity.merchant && entity.merchant.toString() === req.user.id) {
      hasEntityAccess = true;
    } else if (entity.truckOwner && entity.truckOwner.toString() === req.user.id) {
      hasEntityAccess = true;
    }
  } else if (document.entityType === 'Truck') {
    // Truck owners can access their own trucks
    const truck = await Truck.findById(document.entityId);
    if (truck && truck.ownerId && truck.ownerId.toString() === req.user.id) {
      hasEntityAccess = true;
    }
  }

  if (!isAdmin && !isUploader && !hasEntityAccess) {
    return next(new ApiError('You do not have permission to access this document', 403));
  }

  res.status(200).json({
    success: true,
    data: document,
  });
});

// Download document
const downloadDocument = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the document details first to check if it exists
    const document = await Document.findById(id);
    if (!document) {
      logger.warn(`Download attempted for missing document ${id}`);
      return next(new ApiError('Document not found', 404));
    }

    // Build the full path and check if file exists
    const fullPath = path.join(
      UPLOAD_DIR,
      document.filePath.startsWith('/') ? document.filePath.substring(1) : document.filePath
    );

    // Verify the file exists
    if (!fs.existsSync(fullPath)) {
      logger.warn(`File not found on disk for document ${document._id}: ${fullPath}`);
      return next(new ApiError('Document file not found on disk', 404));
    }

    // Get the complete file data
    const documentData = await documentService.getDocumentFile(id, req.user.id);

    res.set({
      'Content-Type': documentData.metadata.mimeType,
      'Content-Disposition': `attachment; filename="${documentData.metadata.originalName}"`,
      'Content-Length': documentData.metadata.size,
    });

    logger.debug(
      `Sending file: ${documentData.metadata.originalName}, size: ${documentData.metadata.size}`
    );
    res.send(documentData.file);
  } catch (error) {
    logger.error(`Error downloading document: ${error.message}`);
    return next(new ApiError(`Error downloading document: ${error.message}`, 500));
  }
});

// Get documents by entity
const getDocumentsByEntity = catchAsync(async (req, res) => {
  const { entityType, entityId } = req.params;

  // Validate entity type
  if (!['Shipment', 'Application', 'Truck', 'User'].includes(entityType)) {
    throw createCustomError(`Invalid entity type: ${entityType}`, 400);
  }

  // Validate entityId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    throw createCustomError(`Invalid entity ID format: ${entityId}`, 400);
  }

  // Verify entity exists
  await validateEntity(entityType, entityId);

  const documents = await documentService.getDocumentsByEntity(entityType, entityId);

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents,
  });
});

// Delete document
const deleteDocument = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const document = await Document.findById(id);
  if (!document) {
    throw createCustomError('Document not found', 404);
  }

  logger.info(`Deleting document ${document._id} - ${document.name}`);

  // Verify that the file exists before attempting to delete
  const fullPath = path.join(UPLOAD_DIR, document.filePath);

  // Delete from disk if file exists
  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
    logger.info(`Deleted file from disk: ${fullPath}`);
  }

  // Get the entity to update its document references
  const { entityType, entityId } = document;
  let entity;

  try {
    switch (entityType) {
      case 'Shipment':
        entity = await Shipment.findById(entityId);
        if (entity) {
          // Remove reference from documents array
          entity.documents = entity.documents.filter(
            (doc) => !doc.documentId || doc.documentId.toString() !== id
          );
          await entity.save();
        }
        break;
      case 'Application':
        entity = await Application.findById(entityId);
        if (entity) {
          entity.documents = entity.documents.filter(
            (doc) => !doc.documentId || doc.documentId.toString() !== id
          );
          await entity.save();
        }
        break;
      case 'Truck':
        entity = await Truck.findById(entityId);
        if (entity) {
          entity.documents = entity.documents.filter(
            (doc) => !doc.documentId || doc.documentId.toString() !== id
          );

          // Also clear specific references
          if (
            entity.insuranceInfo &&
            entity.insuranceInfo.documentId &&
            entity.insuranceInfo.documentId.toString() === id
          ) {
            entity.insuranceInfo.documentId = null;
          }

          if (
            entity.registrationInfo &&
            entity.registrationInfo.documentId &&
            entity.registrationInfo.documentId.toString() === id
          ) {
            entity.registrationInfo.documentId = null;
          }

          if (
            entity.technicalInspection &&
            entity.technicalInspection.documentId &&
            entity.technicalInspection.documentId.toString() === id
          ) {
            entity.technicalInspection.documentId = null;
          }

          await entity.save();
        }
        break;
      case 'User':
        entity = await User.findById(entityId);
        if (entity) {
          entity.documents = entity.documents.filter(
            (doc) => !doc.documentId || doc.documentId.toString() !== id
          );

          // Clear driver license reference if needed
          if (
            entity.driverLicense &&
            entity.driverLicense.documentId &&
            entity.driverLicense.documentId.toString() === id
          ) {
            entity.driverLicense.documentId = null;
          }

          await entity.save();
        }
        break;
    }
  } catch (error) {
    logger.error(`Error updating entity references: ${error.message}`);
    // Continue with document deletion even if entity update fails
  }

  const result = await documentService.deleteDocument(id, req.user.id);

  res.status(200).json(result);
});

// Verify document
const verifyDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  // Check if user has permission to verify documents (admin, manager, etc.)
  if (!['Admin', 'manager'].includes(req.user.role)) {
    throw createCustomError('Not authorized to verify documents', 403);
  }

  const document = await documentService.verifyDocument(id, req.user.id, notes);

  // Update the associated entity's document verification status
  try {
    const { entityType, entityId, documentType } = document;

    switch (entityType) {
      case 'Shipment':
        await Shipment.updateOne(
          { _id: entityId, 'documents.documentId': document._id },
          { $set: { 'documents.$.verified': true } }
        );
        break;
      case 'Application':
        await Application.updateOne(
          { _id: entityId, 'documents.documentId': document._id },
          { $set: { 'documents.$.verified': true } }
        );
        break;
      case 'Truck':
        const truck = await Truck.findById(entityId);
        if (truck) {
          // Update document in the documents array
          const docIndex = truck.documents.findIndex(
            (doc) => doc.documentId && doc.documentId.toString() === document._id.toString()
          );

          if (docIndex >= 0) {
            truck.documents[docIndex].verified = true;
          }

          // Also update specific document references
          if (
            documentType === 'INSURANCE_CERTIFICATE' &&
            truck.insuranceInfo &&
            truck.insuranceInfo.documentId &&
            truck.insuranceInfo.documentId.toString() === document._id.toString()
          ) {
            truck.insuranceInfo.verified = true;
          }

          if (
            documentType === 'VEHICLE_REGISTRATION' &&
            truck.registrationInfo &&
            truck.registrationInfo.documentId &&
            truck.registrationInfo.documentId.toString() === document._id.toString()
          ) {
            truck.registrationInfo.verified = true;
          }

          if (
            documentType === 'TECHNICAL_INSPECTION' &&
            truck.technicalInspection &&
            truck.technicalInspection.documentId &&
            truck.technicalInspection.documentId.toString() === document._id.toString()
          ) {
            truck.technicalInspection.verified = true;
          }

          // Check if truck has all required documents verified
          const allVerified = truck.documents.every((doc) => !doc.required || doc.verified);
          if (allVerified) {
            truck.verificationStatus = 'VERIFIED';
          }

          await truck.save();
        }
        break;
      case 'User':
        const user = await User.findById(entityId);
        if (user) {
          // Update document in the documents array
          const docIndex = user.documents.findIndex(
            (doc) => doc.documentId && doc.documentId.toString() === document._id.toString()
          );

          if (docIndex >= 0) {
            user.documents[docIndex].verified = true;
          }

          // Handle driver license verification
          if (documentType === 'DRIVER_LICENSE' && user.role === 'Driver') {
            user.driverLicense.verified = true;
            user.driverLicense.verificationDate = new Date();

            // Update driver verification status
            user.verificationStatus = 'VERIFIED';
          }

          await user.save();
        }
        break;
    }
  } catch (error) {
    logger.error(`Error updating entity verification status: ${error.message}`);
    // Continue despite error updating entity
  }

  res.status(200).json({
    success: true,
    data: document,
  });
});

// Update document
const updateDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const document = await documentService.updateDocumentMetadata(id, req.user.id, updateData);

  // If name or documentType changed, update in the entity's reference too
  if (updateData.name || updateData.documentType) {
    try {
      const { entityType, entityId } = document;

      switch (entityType) {
        case 'Shipment':
          if (updateData.name) {
            await Shipment.updateOne(
              { _id: entityId, 'documents.documentId': document._id },
              { $set: { 'documents.$.name': document.name } }
            );
          }
          if (updateData.documentType) {
            await Shipment.updateOne(
              { _id: entityId, 'documents.documentId': document._id },
              { $set: { 'documents.$.documentType': document.documentType } }
            );
          }
          break;
        case 'Application':
          if (updateData.name) {
            await Application.updateOne(
              { _id: entityId, 'documents.documentId': document._id },
              { $set: { 'documents.$.name': document.name } }
            );
          }
          if (updateData.documentType) {
            await Application.updateOne(
              { _id: entityId, 'documents.documentId': document._id },
              { $set: { 'documents.$.documentType': document.documentType } }
            );
          }
          break;
        case 'Truck':
          if (updateData.name || updateData.documentType) {
            await Truck.updateOne(
              { _id: entityId, 'documents.documentId': document._id },
              {
                $set: {
                  ...(updateData.name && { 'documents.$.name': document.name }),
                  ...(updateData.documentType && {
                    'documents.$.documentType': document.documentType,
                  }),
                },
              }
            );
          }
          break;
        case 'User':
          if (updateData.name || updateData.documentType) {
            await User.updateOne(
              { _id: entityId, 'documents.documentId': document._id },
              {
                $set: {
                  ...(updateData.name && { 'documents.$.name': document.name }),
                  ...(updateData.documentType && {
                    'documents.$.documentType': document.documentType,
                  }),
                },
              }
            );
          }
          break;
      }
    } catch (error) {
      logger.error(`Error updating entity document reference: ${error.message}`);
      // Continue despite error updating entity
    }
  }

  res.status(200).json({
    success: true,
    data: document,
  });
});

// Debug function to check if models are accessible
const debugModels = catchAsync(async (req, res) => {
  const models = {
    Document: typeof Document !== 'undefined',
    Shipment: typeof Shipment !== 'undefined',
    Application: typeof Application !== 'undefined',
    Truck: typeof Truck !== 'undefined',
    User: typeof User !== 'undefined',
  };

  const methods = {
    Document: typeof Document.findById === 'function',
    Shipment: typeof Shipment.findById === 'function',
    Application: typeof Application.findById === 'function',
    Truck: typeof Truck.findById === 'function',
    User: typeof User.findById === 'function',
  };

  res.status(200).json({
    success: true,
    models,
    methods,
  });
});

module.exports = {
  uploadDocument,
  uploadMultipleDocuments,
  getDocument,
  downloadDocument,
  getDocumentsByEntity,
  deleteDocument,
  verifyDocument,
  updateDocument,
  debugModels,
};
