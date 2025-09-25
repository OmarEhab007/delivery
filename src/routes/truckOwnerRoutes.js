const express = require('express');

const router = express.Router();
const { body } = require('express-validator');

const truckOwnerController = require('../controllers/truck/truckOwnerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply middleware to all routes - only TruckOwner can access
router.use(protect);
router.use(restrictTo('TruckOwner'));

/**
 * @swagger
 * /api/truck-owner/shipments:
 *   get:
 *     summary: Get all shipments assigned to this truck owner
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shipments retrieved successfully
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
 *       403:
 *         description: Not authorized as a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/shipments', truckOwnerController.getMyShipments);

/**
 * @swagger
 * /api/truck-owner/shipments/available:
 *   get:
 *     summary: Get available shipments for bidding
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available shipments retrieved successfully
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
 *       403:
 *         description: Not authorized as a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/shipments/available', truckOwnerController.getAvailableShipments);

/**
 * @swagger
 * /api/truck-owner/shipments/{shipmentId}/assign:
 *   patch:
 *     summary: Assign shipment to driver
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shipmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the shipment to assign
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *             properties:
 *               driverId:
 *                 type: string
 *                 description: ID of the driver to assign
 *     responses:
 *       200:
 *         description: Shipment assigned successfully
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
 *         description: Not authorized as a truck owner
 *       404:
 *         description: Shipment or driver not found
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/shipments/:shipmentId/assign',
  [body('driverId').notEmpty().withMessage('Driver ID is required')],
  truckOwnerController.assignShipmentToDriver
);

/**
 * @swagger
 * /api/truck-owner/drivers/available:
 *   get:
 *     summary: Get available drivers for assignment
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available drivers retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not authorized as a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/drivers/available', truckOwnerController.getAvailableDrivers);

/**
 * @swagger
 * /api/truck-owner/trucks/available:
 *   get:
 *     summary: Get available trucks for assignment
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available trucks retrieved successfully
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
 *                     $ref: '#/components/schemas/Truck'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not authorized as a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/trucks/available', truckOwnerController.getAvailableTrucks);

/**
 * @swagger
 * /api/truck-owner/drivers:
 *   get:
 *     summary: Get all drivers for this truck owner
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by driver availability
 *     responses:
 *       200:
 *         description: Drivers retrieved successfully
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not authorized as a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/drivers', truckOwnerController.getAllDrivers);

/**
 * @swagger
 * /api/truck-owner/drivers/{id}:
 *   patch:
 *     summary: Update driver details
 *     tags: [TruckOwner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the driver to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Driver availability status
 *               driverStatus:
 *                 type: string
 *                 description: Current status of the driver
 *               phone:
 *                 type: string
 *                 description: Driver's phone number
 *               licenseNumber:
 *                 type: string
 *                 description: Driver's license number
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Not authorized as a truck owner
 *       404:
 *         description: Driver not found
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/drivers/:id',
  [
    body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    body('driverStatus').optional().isString().withMessage('driverStatus must be a string'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('licenseNumber').optional().isString().withMessage('License number must be a string'),
  ],
  truckOwnerController.updateDriver
);

module.exports = router;
