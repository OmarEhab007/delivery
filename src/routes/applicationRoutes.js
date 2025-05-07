const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const applicationController = require('../controllers/application/applicationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply protection middleware to all routes
router.use(protect);

// ===== IMPORTANT: Define static routes BEFORE dynamic routes =====

/**
 * @swagger
 * /api/applications:
 *   post:
 *     summary: Create a new application for a shipment
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shipmentId
 *               - assignedTruckId
 *               - driverId
 *               - bidDetails
 *             properties:
 *               shipmentId:
 *                 type: string
 *                 description: ID of the shipment to apply for
 *               assignedTruckId:
 *                 type: string
 *                 description: ID of the truck assigned to this application
 *               driverId:
 *                 type: string
 *                 description: ID of the driver assigned to this application
 *               bidDetails:
 *                 type: object
 *                 required:
 *                   - price
 *                 properties:
 *                   price:
 *                     type: number
 *                     description: Bid price
 *                   currency:
 *                     type: string
 *                     default: "USD"
 *                     description: Currency for the bid price
 *                   notes:
 *                     type: string
 *                     description: Additional notes for the application
 *                   validUntil:
 *                     type: string
 *                     format: date-time
 *                     description: Date until which the bid is valid
 *     responses:
 *       201:
 *         description: Application created successfully
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
 *                     truckOwnerId:
 *                       type: string
 *                     shipmentId:
 *                       type: string
 *                     assignedTruckId:
 *                       type: string
 *                     driverId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     bidDetails:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/',
  restrictTo('TruckOwner'),
  [
    body('shipmentId').notEmpty().withMessage('Shipment ID is required'),
    body('assignedTruckId').notEmpty().withMessage('Truck ID is required'),
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('bidDetails.price').isNumeric().withMessage('Bid price must be a number'),
    body('bidDetails.currency').optional().isString().withMessage('Currency must be a string'),
    body('bidDetails.notes').optional().isString().withMessage('Notes must be a string'),
    body('bidDetails.validUntil').optional().isISO8601().withMessage('Valid until date must be a valid date')
  ],
  applicationController.createApplication
);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications for the current truck owner
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED]
 *         description: Filter applications by status
 *     responses:
 *       200:
 *         description: List of applications
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
 *                       assignedTruckId:
 *                         type: string
 *                       driverId:
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
 *         description: Forbidden - user is not a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', restrictTo('TruckOwner'), applicationController.getMyApplications);

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     summary: Get all applications for the current truck owner (alias)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED, CANCELLED]
 *         description: Filter applications by status
 *     responses:
 *       200:
 *         description: List of applications
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
 *                       assignedTruckId:
 *                         type: string
 *                       driverId:
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
 *         description: Forbidden - user is not a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/my', restrictTo('TruckOwner'), applicationController.getMyApplications);

// ===== Dynamic routes with parameters below =====

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     summary: Get an application by ID
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application details
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
 *                     truckOwnerId:
 *                       type: string
 *                     shipmentId:
 *                       type: string
 *                     assignedTruckId:
 *                       type: string
 *                     driverId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     bidDetails:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', applicationController.getApplication);

/**
 * @swagger
 * /api/applications/{id}:
 *   patch:
 *     summary: Update an application (TruckOwner only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTruckId:
 *                 type: string
 *                 description: ID of the truck assigned to this application
 *               driverId:
 *                 type: string
 *                 description: ID of the driver assigned to this application
 *               bidDetails:
 *                 type: object
 *                 properties:
 *                   price:
 *                     type: number
 *                     description: Bid price
 *                   currency:
 *                     type: string
 *                     description: Currency for the bid price
 *                   notes:
 *                     type: string
 *                     description: Additional notes for the application
 *                   validUntil:
 *                     type: string
 *                     format: date-time
 *                     description: Date until which the bid is valid
 *     responses:
 *       200:
 *         description: Application updated successfully
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
 *                     truckOwnerId:
 *                       type: string
 *                     shipmentId:
 *                       type: string
 *                     assignedTruckId:
 *                       type: string
 *                     driverId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     bidDetails:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a truck owner or application is not in PENDING status
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id',
  restrictTo('TruckOwner'),
  [
    body('assignedTruckId').optional().notEmpty().withMessage('Truck ID cannot be empty'),
    body('driverId').optional().notEmpty().withMessage('Driver ID cannot be empty'),
    body('bidDetails.price').optional().isNumeric().withMessage('Bid price must be a number'),
    body('bidDetails.currency').optional().isString().withMessage('Currency must be a string'),
    body('bidDetails.notes').optional().isString().withMessage('Notes must be a string'),
    body('bidDetails.validUntil').optional().isISO8601().withMessage('Valid until date must be a valid date')
  ],
  applicationController.updateApplication
);

/**
 * @swagger
 * /api/applications/{id}/cancel:
 *   patch:
 *     summary: Cancel an application (TruckOwner only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application cancelled successfully
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a truck owner or application cannot be cancelled
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id/cancel',
  restrictTo('TruckOwner'),
  applicationController.cancelApplication
);

/**
 * @swagger
 * /api/applications/{id}/accept:
 *   patch:
 *     summary: Accept an application (Merchant only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application accepted successfully
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
 *                       enum: [ACCEPTED]
 *                     shipment:
 *                       type: object
 *                       description: Updated shipment details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant or application cannot be accepted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id/accept',
  restrictTo('Merchant'),
  applicationController.acceptApplication
);

/**
 * @swagger
 * /api/applications/{id}/reject:
 *   patch:
 *     summary: Reject an application (Merchant only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Application ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Application rejected successfully
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
 *                       enum: [REJECTED]
 *                     rejectionReason:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a merchant or application cannot be rejected
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/:id/reject',
  restrictTo('Merchant'),
  [
    body('reason').optional().notEmpty().withMessage('Reason cannot be empty')
  ],
  applicationController.rejectApplication
);

module.exports = router; 