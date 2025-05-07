const express = require('express');
const documentController = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { singleUpload, multiUpload } = require('../middleware/uploadMiddleware');
const path = require('path');
const fs = require('fs');
const { Document } = require('../models/Document');

const router = express.Router();

// Create a separate router for our debug routes
const debugRouter = express.Router();

/**
 * @swagger
 * /api/documents/debug:
 *   get:
 *     summary: Debug documents model (development only)
 *     tags: [Documents]
 *     responses:
 *       200:
 *         description: Debug information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
debugRouter.get('/debug', documentController.debugModels);

/**
 * @swagger
 * /api/documents/debug-file/{id}:
 *   get:
 *     summary: Get debug file information for a document (development only)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: File path information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       type: object
 *                     filePath:
 *                       type: object
 *                       properties:
 *                         relative:
 *                           type: string
 *                         absolute:
 *                           type: string
 *                         exists:
 *                           type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
debugRouter.get('/debug-file/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const fullPath = path.join(uploadDir, document.filePath);
    
    // Check if file exists
    const fileExists = fs.existsSync(fullPath);
    
    res.status(200).json({
      success: true,
      data: {
        document,
        filePath: {
          relative: document.filePath,
          absolute: fullPath,
          exists: fileExists
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply authentication middleware to protected routes
router.use(protect);

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a single document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - documentType
 *               - entityType
 *               - entityId
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *               documentType:
 *                 type: string
 *                 enum: [ID_PROOF, DRIVING_LICENSE, VEHICLE_REGISTRATION, SHIPMENT_INVOICE, DELIVERY_PROOF, OTHER]
 *                 description: Type of document
 *               entityType:
 *                 type: string
 *                 enum: [USER, TRUCK, SHIPMENT, APPLICATION]
 *                 description: Type of entity this document belongs to
 *               entityId:
 *                 type: string
 *                 description: ID of the entity this document belongs to
 *               description:
 *                 type: string
 *                 description: Optional description of the document
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     filePath:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *                     documentType:
 *                       type: string
 *                     entityType:
 *                       type: string
 *                     entityId:
 *                       type: string
 *                     uploadedBy:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/upload', 
  singleUpload('document'),
  documentController.uploadDocument
);

/**
 * @swagger
 * /api/documents/upload-multiple:
 *   post:
 *     summary: Upload multiple documents (up to 5)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documents
 *               - documentType
 *               - entityType
 *               - entityId
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Document files to upload (up to 5)
 *               documentType:
 *                 type: string
 *                 enum: [ID_PROOF, DRIVING_LICENSE, VEHICLE_REGISTRATION, SHIPMENT_INVOICE, DELIVERY_PROOF, OTHER]
 *                 description: Type of documents
 *               entityType:
 *                 type: string
 *                 enum: [USER, TRUCK, SHIPMENT, APPLICATION]
 *                 description: Type of entity these documents belong to
 *               entityId:
 *                 type: string
 *                 description: ID of the entity these documents belong to
 *               description:
 *                 type: string
 *                 description: Optional description of the documents
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       filePath:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/upload-multiple',
  multiUpload('documents', 5),
  documentController.uploadMultipleDocuments
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document details by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     filePath:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *                     documentType:
 *                       type: string
 *                     entityType:
 *                       type: string
 *                     entityId:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get(
  '/:id',
  documentController.getDocument
);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: The document file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get(
  '/:id/download',
  documentController.downloadDocument
);

/**
 * @swagger
 * /api/documents/entity/{entityType}/{entityId}:
 *   get:
 *     summary: Get all documents related to an entity
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [USER, TRUCK, SHIPMENT, APPLICATION]
 *         required: true
 *         description: Type of entity
 *       - in: path
 *         name: entityId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the entity
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       documentType:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get(
  '/entity/:entityType/:entityId',
  documentController.getDocumentsByEntity
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.delete(
  '/:id',
  documentController.deleteDocument
);

/**
 * @swagger
 * /api/documents/{id}/verify:
 *   patch:
 *     summary: Verify a document (admin/manager only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                       enum: [true]
 *                     verifiedBy:
 *                       type: string
 *                     verifiedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not an admin or manager
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id/verify',
  restrictTo('admin', 'manager'),
  documentController.verifyDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   patch:
 *     summary: Update document details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum: [ID_PROOF, DRIVING_LICENSE, VEHICLE_REGISTRATION, SHIPMENT_INVOICE, DELIVERY_PROOF, OTHER]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     documentType:
 *                       type: string
 *                     description:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id',
  documentController.updateDocument
);

// Combine routers
const combinedRouter = express.Router();
combinedRouter.use('/', debugRouter);
combinedRouter.use('/', router);

// Export combined router
module.exports = combinedRouter; 