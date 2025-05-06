const express = require('express');
const documentController = require('../controllers/documentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { singleUpload, multiUpload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Routes for document operations
router.post(
  '/upload', 
  singleUpload('document'),
  documentController.uploadDocument
);

router.post(
  '/upload-multiple',
  multiUpload('documents', 5),
  documentController.uploadMultipleDocuments
);

router.get(
  '/:id',
  documentController.getDocument
);

router.get(
  '/:id/download',
  documentController.downloadDocument
);

router.get(
  '/entity/:entityType/:entityId',
  documentController.getDocumentsByEntity
);

router.delete(
  '/:id',
  documentController.deleteDocument
);

// Routes requiring admin/manager privileges
router.patch(
  '/:id/verify',
  restrictTo('admin', 'manager'),
  documentController.verifyDocument
);

router.patch(
  '/:id',
  documentController.updateDocument
);

// Create a separate router for our debug route
const debugRouter = express.Router();

// Debug route - no authentication required
debugRouter.get('/debug', documentController.debugModels);

// Export both routers
module.exports = router; 