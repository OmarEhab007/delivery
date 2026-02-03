const express = require('express');

const router = express.Router();
const { body } = require('express-validator');

const shipmentController = require('../controllers/shipment/shipmentController');
const applicationController = require('../controllers/application/applicationController');
const truckOwnerController = require('../controllers/truck/truckOwnerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { singleUpload } = require('../middleware/uploadMiddleware');

// Import validators
const {
  isValidObjectId,
  paginationValidation,
} = require('../middleware/validators/commonValidators');
const {
  createShipmentValidation,
  updateShipmentValidation,
  handleValidationErrors,
} = require('../middleware/validators/shipmentValidators');

// Apply protection middleware to all routes
router.use(protect);

const setShipmentUploadContext = (req, res, next) => {
  req.body.entityType = 'Shipment';
  req.body.entityId = req.params.id;
  next();
};
/**
 * @swagger
 * /api/shipments:
 *   post:
 *     summary: Create a new shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - cargoDetails
 *             properties:
 *               origin:
 *                 type: object
 *                 required:
 *                   - address
 *                 properties:
 *                   address:
 *                     type: string
 *                     description: Origin address
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude]
 *               destination:
 *                 type: object
 *                 required:
 *                   - address
 *                 properties:
 *                   address:
 *                     type: string
 *                     description: Destination address
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude]
 *               cargoDetails:
 *                 type: object
 *                 required:
 *                   - description
 *                   - weight
 *                 properties:
 *                   description:
 *                     type: string
 *                     description: Description of the cargo
 *                   weight:
 *                     type: number
 *                     description: Weight of cargo in tons
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                         description: Length in meters
 *                       width:
 *                         type: number
 *                         description: Width in meters
 *                       height:
 *                         type: number
 *                         description: Height in meters
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 description: Scheduled pickup date
 *     responses:
 *       201:
 *         description: Shipment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Shipment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/',
  restrictTo('Merchant'),
  createShipmentValidation,
  handleValidationErrors,
  shipmentController.createShipment
);

/**
 * @swagger
 * /api/shipments:
 *   get:
 *     summary: Get all shipments for the current merchant
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipments
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
 *                     $ref: '#/components/schemas/Shipment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', restrictTo('Merchant'), shipmentController.getMyShipments);

/**
 * @swagger
 * /api/shipments/available:
 *   get:
 *     summary: Get available shipments for truck owners
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available shipments retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a truck owner
 */
router.get('/available', restrictTo('TruckOwner'), truckOwnerController.getAvailableShipments);

/**
 * @swagger
 * /api/shipments/{shipmentId}/assign-driver:
 *   post:
 *     summary: Assign a driver to a shipment (truck owner)
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:shipmentId/assign-driver',
  restrictTo('TruckOwner'),
  [body('driverId').notEmpty().withMessage('Driver ID is required')],
  truckOwnerController.assignShipmentToDriver
);

/**
 * @swagger
 * /api/shipments/search:
 *   get:
 *     summary: Search for shipments with filters
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, ACCEPTED, IN_TRANSIT, DELIVERED, CANCELLED]
 *         description: Filter by shipment status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by minimum scheduled date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by maximum scheduled date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: List of matching shipments
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
 *                     $ref: '#/components/schemas/Shipment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get(
  '/search',
  restrictTo('Merchant'),
  paginationValidation,
  shipmentController.searchShipments
);

/**
 * @swagger
 * /api/shipments/{shipmentId}/applications:
 *   get:
 *     summary: Get all applications for a specific shipment
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: List of applications for the shipment
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
 *                       truckOwnerId:
 *                         type: string
 *                       shipmentId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       bidDetails:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get(
  '/:shipmentId/applications',
  restrictTo('Merchant'),
  isValidObjectId('shipmentId'),
  applicationController.getShipmentApplications
);

/**
 * @swagger
 * /api/shipments/{id}:
 *   get:
 *     summary: Get a shipment by ID
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Shipment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Shipment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user doesn't have access to this shipment
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', isValidObjectId('id'), shipmentController.getShipment);

/**
 * @swagger
 * /api/shipments/{id}:
 *   patch:
 *     summary: Update a shipment (Merchant only)
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Shipment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               origin:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               destination:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               cargoDetails:
 *                 type: object
 *                 properties:
 *                   description:
 *                     type: string
 *                   weight:
 *                     type: number
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Shipment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Shipment'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant or shipment is not in REQUESTED status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  updateShipmentValidation,
  handleValidationErrors,
  shipmentController.updateShipment
);

/**
 * @swagger
 * /api/shipments/{id}/cancel:
 *   patch:
 *     summary: Cancel a shipment (Merchant only)
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Shipment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Shipment cancelled successfully
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
 *                     status:
 *                       type: string
 *                       enum: [CANCELLED]
 *                     cancellationReason:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant or shipment cannot be cancelled
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id/cancel',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  [body('reason').optional().notEmpty().withMessage('Reason cannot be empty')],
  shipmentController.cancelShipment
);

/**
 * @swagger
 * /api/shipments/{id}/timeline:
 *   post:
 *     summary: Add timeline entry to a shipment (TruckOwner or assigned Driver)
 *     tags: [Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Shipment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PICKED_UP, IN_TRANSIT, DELIVERED, DELAYED]
 *                 description: New status of the shipment
 *               note:
 *                 type: string
 *                 description: Additional note about the status update
 *               location:
 *                 type: object
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude]
 *     responses:
 *       200:
 *         description: Timeline entry added successfully
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
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           note:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           location:
 *                             type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not authorized for this action
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/:id/timeline',
  isValidObjectId('id'),
  [
    body('status').notEmpty().withMessage('Status is required'),
    body('note').optional().notEmpty().withMessage('Note cannot be empty'),
  ],
  shipmentController.addTimelineEntry
);

router.patch(
  '/:id/compliance',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  shipmentController.updateComplianceDetails
);

router.get(
  '/:id/compliance',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  shipmentController.getComplianceStatus
);

router.post(
  '/:id/compliance/documents',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  setShipmentUploadContext,
  singleUpload('document'),
  shipmentController.uploadComplianceDocument
);

router.post(
  '/:id/payment-proof',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  setShipmentUploadContext,
  singleUpload('document'),
  shipmentController.uploadPaymentProof
);

router.get(
  '/:id/tracking',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  shipmentController.getTracking
);

router.get(
  '/:id/tracking/history',
  restrictTo('Merchant'),
  isValidObjectId('id'),
  shipmentController.getTrackingHistory
);

module.exports = router;
