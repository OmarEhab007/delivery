const documentService = require('../services/documentService');
const { Document, DocumentType } = require('../models/Document');
const { Shipment } = require('../models/Shipment');
const { Application } = require('../models/Application');
const { Truck } = require('../models/Truck');
const User = require('../models/User');
const { catchAsync } = require('../utils/catchAsync');
const { createCustomError } = require('../utils/errorResponse');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Validate entity exists before document upload
const validateEntity = async (entityType, entityId) => {
  try {
    let entity;
    switch (entityType) {
      case 'Shipment':
        entity = await Shipment.findById(entityId);
        break;
      case 'Application':
        entity = await Application.findById(entityId);
        break;
      case 'Truck':
        entity = await Truck.findById(entityId);
        break;
      case 'User':
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
    throw error;
  }
};

// Upload a document
const uploadDocument = catchAsync(async (req, res) => {
  const { entityType, entityId, documentType, name, description, expiryDate, metadata } = req.body;
  
  // Validate required fields
  if (!entityType || !entityId || !documentType || !name) {
    throw createCustomError('Missing required fields: entityType, entityId, documentType, name', 400);
  }
  
  // Validate entity type
  if (!['Shipment', 'Application', 'Truck', 'User'].includes(entityType)) {
    throw createCustomError(`Invalid entity type: ${entityType}`, 400);
  }
  
  // Validate document type
  if (!Object.values(DocumentType).includes(documentType)) {
    throw createCustomError(`Invalid document type: ${documentType}`, 400);
  }
  
  // Validate entityId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(entityId)) {
    throw createCustomError(`Invalid entity ID format: ${entityId}`, 400);
  }
  
  // Verify entity exists
  const entity = await validateEntity(entityType, entityId);
  
  // Prepare document data
  const documentData = {
    name,
    description,
    documentType,
    entityType,
    entityId,
    uploadedBy: req.user.id,
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    metadata: metadata ? JSON.parse(metadata) : undefined
  };
  
  // Save the document
  const document = await documentService.saveDocument(req.file, documentData);
  
  // Update the associated entity to include reference to this document
  switch (entityType) {
    case 'Shipment':
      await entity.addDocument(document);
      break;
    case 'Application':
      await entity.addDocument(document);
      break;
    case 'Truck':
      await entity.addDocument(document);
      break;
    case 'User':
      await entity.addDocument(document);
      break;
  }
  
  // Log the successful document upload
  logger.info(`Document uploaded: ${document._id} for ${entityType} ${entityId}`);
  
  res.status(201).json({
    success: true,
    data: document
  });
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
      metadata: fileData.metadata
    };
    
    // Save the document
    const document = await documentService.saveDocument(file, documentData);
    
    // Link document to entity
    switch (entityType) {
      case 'Shipment':
        await entity.addDocument(document);
        break;
      case 'Application':
        await entity.addDocument(document);
        break;
      case 'Truck':
        await entity.addDocument(document);
        break;
      case 'User':
        await entity.addDocument(document);
        break;
    }
    
    documents.push(document);
  }
  
  res.status(201).json({
    success: true,
    count: documents.length,
    data: documents
  });
});

// Get document by ID
const getDocument = catchAsync(async (req, res) => {
  const document = await documentService.getDocumentById(req.params.id);
  
  // Implement proper access control here
  // For example, check if user has permission to access this document
  
  res.status(200).json({
    success: true,
    data: document
  });
});

// Download document
const downloadDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  const documentData = await documentService.getDocumentFile(id, req.user.id);
  
  res.set({
    'Content-Type': documentData.metadata.mimeType,
    'Content-Disposition': `attachment; filename="${documentData.metadata.originalName}"`,
    'Content-Length': documentData.metadata.size
  });
  
  res.send(documentData.file);
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
    data: documents
  });
});

// Delete document
const deleteDocument = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const document = await Document.findById(id);
  if (!document) {
    throw createCustomError('Document not found', 404);
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
            doc => !doc.documentId || doc.documentId.toString() !== id
          );
          await entity.save();
        }
        break;
      case 'Application':
        entity = await Application.findById(entityId);
        if (entity) {
          entity.documents = entity.documents.filter(
            doc => !doc.documentId || doc.documentId.toString() !== id
          );
          await entity.save();
        }
        break;
      case 'Truck':
        entity = await Truck.findById(entityId);
        if (entity) {
          entity.documents = entity.documents.filter(
            doc => !doc.documentId || doc.documentId.toString() !== id
          );
          
          // Also clear specific references
          if (entity.insuranceInfo && entity.insuranceInfo.documentId && 
              entity.insuranceInfo.documentId.toString() === id) {
            entity.insuranceInfo.documentId = null;
          }
          
          if (entity.registrationInfo && entity.registrationInfo.documentId && 
              entity.registrationInfo.documentId.toString() === id) {
            entity.registrationInfo.documentId = null;
          }
          
          if (entity.technicalInspection && entity.technicalInspection.documentId && 
              entity.technicalInspection.documentId.toString() === id) {
            entity.technicalInspection.documentId = null;
          }
          
          await entity.save();
        }
        break;
      case 'User':
        entity = await User.findById(entityId);
        if (entity) {
          entity.documents = entity.documents.filter(
            doc => !doc.documentId || doc.documentId.toString() !== id
          );
          
          // Clear driver license reference if needed
          if (entity.driverLicense && entity.driverLicense.documentId && 
              entity.driverLicense.documentId.toString() === id) {
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
  if (!['admin', 'manager'].includes(req.user.role)) {
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
            doc => doc.documentId && doc.documentId.toString() === document._id.toString()
          );
          
          if (docIndex >= 0) {
            truck.documents[docIndex].verified = true;
          }
          
          // Also update specific document references
          if (documentType === 'INSURANCE_CERTIFICATE' && 
              truck.insuranceInfo && 
              truck.insuranceInfo.documentId && 
              truck.insuranceInfo.documentId.toString() === document._id.toString()) {
            truck.insuranceInfo.verified = true;
          }
          
          if (documentType === 'VEHICLE_REGISTRATION' && 
              truck.registrationInfo && 
              truck.registrationInfo.documentId && 
              truck.registrationInfo.documentId.toString() === document._id.toString()) {
            truck.registrationInfo.verified = true;
          }
          
          if (documentType === 'TECHNICAL_INSPECTION' && 
              truck.technicalInspection && 
              truck.technicalInspection.documentId && 
              truck.technicalInspection.documentId.toString() === document._id.toString()) {
            truck.technicalInspection.verified = true;
          }
          
          // Check if truck has all required documents verified
          const allVerified = truck.documents.every(doc => !doc.required || doc.verified);
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
            doc => doc.documentId && doc.documentId.toString() === document._id.toString()
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
    data: document
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
                  ...(updateData.documentType && { 'documents.$.documentType': document.documentType })
                } 
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
                  ...(updateData.documentType && { 'documents.$.documentType': document.documentType })
                } 
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
    data: document
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
  updateDocument
}; 