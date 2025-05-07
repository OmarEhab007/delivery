const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const driverController = require('../controllers/driver/driverController');

// All routes in this router are protected and restricted to Driver role
router.use(protect);
router.use(restrictTo('Driver'));

/**
 * @swagger
 * /api/driver/profile:
 *   get:
 *     summary: Get driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not authorized as a driver
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/profile', driverController.getProfile);

/**
 * @swagger
 * /api/driver/truck:
 *   get:
 *     summary: Get driver's current truck assignment
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current truck assignment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Truck'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: No current truck assignment found
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/truck', driverController.getCurrentTruck);

// Shipment routes - organized by type
/**
 * @swagger
 * /api/driver/shipments/active:
 *   get:
 *     summary: Get driver's active shipments
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active shipments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shipment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/shipments', driverController.getActiveShipments); // Legacy route - keep for backward compatibility
router.get('/shipments/active', driverController.getActiveShipments);
router.get('/shipments/assigned', driverController.getAssignedShipments);
router.get('/shipments/history', driverController.getShipmentHistory);

/**
 * @swagger
 * /api/driver/shipments/{shipmentId}/start:
 *   post:
 *     summary: Start a delivery
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the shipment to start delivery for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startOdometer
 *             properties:
 *               startOdometer:
 *                 type: number
 *                 description: Odometer reading at start of delivery
 *               notes:
 *                 type: string
 *                 description: Optional notes about the delivery
 *     responses:
 *       200:
 *         description: Delivery started successfully
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
 *       404:
 *         description: Shipment not found
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/shipments/:shipmentId/start',
  [
    body('notes').optional(),
    body('startOdometer').isNumeric().withMessage('Odometer reading must be a number')
  ],
  driverController.startDelivery
);

/**
 * @swagger
 * /api/driver/shipments/{shipmentId}/complete:
 *   post:
 *     summary: Complete a delivery
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the shipment to complete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endOdometer
 *               - recipientName
 *             properties:
 *               endOdometer:
 *                 type: number
 *                 description: Odometer reading at end of delivery
 *               recipientName:
 *                 type: string
 *                 description: Name of the person who received the shipment
 *               recipientSignature:
 *                 type: string
 *                 description: Base64 encoded signature image
 *               notes:
 *                 type: string
 *                 description: Optional notes about the delivery
 *     responses:
 *       200:
 *         description: Delivery completed successfully
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
 *       404:
 *         description: Shipment not found
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/shipments/:shipmentId/complete',
  [
    body('notes').optional(),
    body('endOdometer').isNumeric().withMessage('Odometer reading must be a number'),
    body('recipientName').notEmpty().withMessage('Recipient name is required'),
    body('recipientSignature').optional()
  ],
  driverController.completeDelivery
);

// Report issue
router.post(
  '/shipments/:shipmentId/issues',
  [
    body('issueType').notEmpty().withMessage('Issue type is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 })
  ],
  driverController.reportIssue
);

/**
 * @swagger
 * /api/driver/shipments/{shipmentId}/proof:
 *   post:
 *     summary: Upload proof of delivery
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the shipment
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               proof:
 *                 type: string
 *                 format: binary
 *                 description: Image file as proof of delivery
 *     responses:
 *       200:
 *         description: Proof of delivery uploaded successfully
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
 *                     url:
 *                       type: string
 *                       description: URL of the uploaded proof
 *       400:
 *         description: File upload error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Shipment not found
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/shipments/:shipmentId/proof',
  driverController.uploadProofOfDelivery
);

// Get delivery route
router.get('/route/:shipmentId', driverController.getDeliveryRoute);

// Update shipment status
router.patch(
  '/shipments/:shipmentId/status',
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
  ],
  driverController.updateShipmentStatus
);

// Driver dashboard
router.get('/dashboard', driverController.getDriverDashboard);

// Driver check-in
router.post(
  '/checkin',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('truckCondition').notEmpty().withMessage('Truck condition is required'),
    body('fuelLevel').isInt({ min: 0, max: 100 }).withMessage('Fuel level must be between 0-100')
  ],
  driverController.driverCheckin
);

// Driver check-out
router.post(
  '/checkout',
  [
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('totalMiles').isNumeric().withMessage('Total miles must be a number'),
    body('fuelLevel').isInt({ min: 0, max: 100 }).withMessage('Fuel level must be between 0-100')
  ],
  driverController.driverCheckout
);

// Update availability status
router.patch(
  '/availability',
  [
    body('isAvailable')
      .isBoolean()
      .withMessage('Availability status must be a boolean')
  ],
  driverController.updateAvailability
);

// Update driver status (more detailed than availability)
router.patch(
  '/status',
  [
    body('status')
      .notEmpty()
      .withMessage('Status is required')
  ],
  driverController.updateDriverStatus
);

/**
 * @swagger
 * /api/driver/location:
 *   patch:
 *     summary: Update driver's current location
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: Current latitude
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Current longitude
 *     responses:
 *       200:
 *         description: Location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
// Update location - support both PATCH and POST methods
const locationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude value'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude value')
];

router.patch('/location', locationValidation, driverController.updateLocation);
router.post('/location', locationValidation, driverController.updateLocation);

module.exports = router; 