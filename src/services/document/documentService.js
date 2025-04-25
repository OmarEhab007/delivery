/**
 * Document Service
 * Handles document upload, storage, and retrieval
 */
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../utils/logger');

// Initialize AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Document types
const DocumentTypes = {
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
  CUSTOMS_FORM: 'CUSTOMS_FORM',
  LOADING_CONFIRMATION: 'LOADING_CONFIRMATION',
  BILL_OF_LADING: 'BILL_OF_LADING',
  DELIVERY_CONFIRMATION: 'DELIVERY_CONFIRMATION',
  INVOICE: 'INVOICE',
  OTHER: 'OTHER'
};

/**
 * Generate a unique filename for the document
 * @param {string} originalFilename - The original filename
 * @returns {string} - A unique filename
 */
const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalFilename);
  
  return `${timestamp}-${randomString}${extension}`;
};

/**
 * Upload a document to S3
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalFilename - Original filename
 * @param {string} contentType - MIME type of the file
 * @param {string} documentType - Type of document (from DocumentTypes)
 * @param {string} shipmentId - ID of the associated shipment
 * @param {string} userId - ID of the uploading user
 * @returns {Promise<Object>} - Document metadata
 */
const uploadDocument = async (fileBuffer, originalFilename, contentType, documentType, shipmentId, userId) => {
  try {
    const filename = generateUniqueFilename(originalFilename);
    const key = `shipments/${shipmentId}/${documentType.toLowerCase()}/${filename}`;
    
    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'private', // Private access
      Metadata: {
        'shipment-id': shipmentId,
        'document-type': documentType,
        'uploaded-by': userId
      }
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    logger.info(`Document uploaded to S3: ${result.Location}`);
    
    // Return document metadata
    return {
      filename: originalFilename,
      key: result.Key,
      url: result.Location,
      contentType,
      documentType,
      shipmentId,
      uploadedBy: userId,
      uploadedAt: new Date()
    };
  } catch (error) {
    logger.error(`Error uploading document to S3: ${error.message}`);
    throw error;
  }
};

/**
 * Get a document from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - Document data with metadata
 */
const getDocument = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };
    
    const data = await s3.getObject(params).promise();
    
    return {
      data: data.Body,
      contentType: data.ContentType,
      metadata: data.Metadata,
      lastModified: data.LastModified
    };
  } catch (error) {
    logger.error(`Error retrieving document from S3: ${error.message}`);
    throw error;
  }
};

/**
 * Generate a presigned URL for document download
 * @param {string} key - S3 object key
 * @param {number} expirySeconds - URL expiry time in seconds
 * @returns {string} - Presigned URL
 */
const getPresignedUrl = (key, expirySeconds = 3600) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Expires: expirySeconds
  };
  
  return s3.getSignedUrl('getObject', params);
};

/**
 * Delete a document from S3
 * @param {string} key - S3 object key
 * @returns {Promise<Object>} - Deletion result
 */
const deleteDocument = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    };
    
    const result = await s3.deleteObject(params).promise();
    
    logger.info(`Document deleted from S3: ${key}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting document from S3: ${error.message}`);
    throw error;
  }
};

/**
 * List all documents for a shipment
 * @param {string} shipmentId - Shipment ID
 * @returns {Promise<Array>} - Array of document metadata
 */
const listShipmentDocuments = async (shipmentId) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: `shipments/${shipmentId}/`
    };
    
    const data = await s3.listObjectsV2(params).promise();
    
    return data.Contents.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: getPresignedUrl(item.Key)
    }));
  } catch (error) {
    logger.error(`Error listing documents for shipment ${shipmentId}: ${error.message}`);
    throw error;
  }
};

/**
 * Validate document type and content
 * @param {string} filename - Original filename
 * @param {string} contentType - MIME type
 * @param {number} fileSize - Size in bytes
 * @param {string} documentType - Type from DocumentTypes
 * @returns {boolean} - Whether document is valid
 */
const validateDocument = (filename, contentType, fileSize, documentType) => {
  // Check if document type is valid
  if (!Object.values(DocumentTypes).includes(documentType)) {
    return false;
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileSize > maxSize) {
    return false;
  }
  
  // Check file type (allow only images, PDFs, and common document formats)
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(contentType)) {
    return false;
  }
  
  return true;
};

module.exports = {
  DocumentTypes,
  uploadDocument,
  getDocument,
  getPresignedUrl,
  deleteDocument,
  listShipmentDocuments,
  validateDocument
};
