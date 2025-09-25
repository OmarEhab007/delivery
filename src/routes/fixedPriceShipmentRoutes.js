const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const fixedPriceController = require('../controllers/shipment/fixedPriceShipmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply protection middleware to all routes
router.use(protect);

// ===== MERCHANT ROUTES =====

/**
 * @swagger
 * /api/shipments/fixed-price:
 *   post:
 *     summary: Create a fixed-price shipment
 *     tags: [Fixed-Price Shipments]
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
 *               - fixedPriceDetails
 *             properties:
 *               origin:
 *                 type: object
 *                 required:
 *                   - address
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   country:
 *                     type: string
 *               destination:
 *                 type: object
 *                 required:
 *                   - address
 *                 properties:
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   country:
 *                     type: string
 *               cargoDetails:
 *                 type: object
 *                 required:
 *                   - description
 *                   - weight
 *                 properties:
 *                   description:
 *                     type: string
 *                   weight:
 *                     type: number
 *                   volume:
 *                     type: number
 *                   category:
 *                     type: string
 *                   hazardous:
 *                     type: boolean
 *                   specialInstructions:
 *                     type: string
 *               fixedPriceDetails:
 *                 type: object
 *                 required:
 *                   - amount
 *                 properties:
 *                   amount:
 *                     type: number
 *                     minimum: 0
 *                   currency:
 *                     type: string
 *                     default: USD
 *                   autoAssign:
 *                     type: boolean
 *                     default: true
 *                   requirements:
 *                     type: object
 *                     properties:
 *                       minTruckCapacity:
 *                         type: number
 *                       requiredFeatures:
 *                         type: array
 *                         items:
 *                           type: string
 *                       maxDeliveryDays:
 *                         type: number
 *               estimatedPickupDate:
 *                 type: string
 *                 format: date-time
 *               estimatedDeliveryDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Fixed-price shipment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user is not a merchant
 */
router.post(
  '/fixed-price',
  restrictTo('Merchant'),
  [
    body('origin.address').notEmpty().withMessage('Origin address is required'),
    body('destination.address').notEmpty().withMessage('Destination address is required'),
    body('cargoDetails.description').notEmpty().withMessage('Cargo description is required'),
    body('cargoDetails.weight').isNumeric().withMessage('Cargo weight must be a number'),
    body('fixedPriceDetails.amount')
      .isNumeric()
      .withMessage('Fixed price amount must be a number')
      .custom((value) => value > 0)
      .withMessage('Fixed price amount must be greater than 0'),
    body('fixedPriceDetails.currency')
      .optional()
      .isString()
      .withMessage('Currency must be a string'),
    body('fixedPriceDetails.requirements.minTruckCapacity')
      .optional()
      .isNumeric()
      .withMessage('Minimum truck capacity must be a number'),
    body('fixedPriceDetails.requirements.maxDeliveryDays')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Maximum delivery days must be at least 1'),
  ],
  fixedPriceController.createFixedPriceShipment
);

/**
 * @swagger
 * /api/shipments/fixed-price/my:
 *   get:
 *     summary: Get my fixed-price shipments (Merchant)
 *     tags: [Fixed-Price Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [REQUESTED, ASSIGNED, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED]
 *         description: Filter by shipment status
 *     responses:
 *       200:
 *         description: List of merchant's fixed-price shipments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user is not a merchant
 */
router.get(
  '/fixed-price/my',
  restrictTo('Merchant'),
  fixedPriceController.getMyFixedPriceShipments
);

/**
 * @swagger
 * /api/shipments/{id}/convert-to-bidding:
 *   patch:
 *     summary: Convert a fixed-price shipment to bidding
 *     tags: [Fixed-Price Shipments]
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
 *         description: Shipment converted to bidding successfully
 *       400:
 *         description: Cannot convert shipment
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shipment not found
 */
router.patch(
  '/:id/convert-to-bidding',
  restrictTo('Merchant'),
  fixedPriceController.convertToBidding
);

/**
 * @swagger
 * /api/shipments/{id}/fixed-price-details:
 *   patch:
 *     summary: Update fixed-price details of a shipment
 *     tags: [Fixed-Price Shipments]
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
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               currency:
 *                 type: string
 *               requirements:
 *                 type: object
 *                 properties:
 *                   minTruckCapacity:
 *                     type: number
 *                   requiredFeatures:
 *                     type: array
 *                     items:
 *                       type: string
 *                   maxDeliveryDays:
 *                     type: number
 *     responses:
 *       200:
 *         description: Fixed-price details updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shipment not found
 */
router.patch(
  '/:id/fixed-price-details',
  restrictTo('Merchant'),
  [
    body('amount')
      .optional()
      .isNumeric()
      .withMessage('Amount must be a number')
      .custom((value) => value > 0)
      .withMessage('Amount must be greater than 0'),
    body('currency').optional().isString().withMessage('Currency must be a string'),
    body('requirements.minTruckCapacity')
      .optional()
      .isNumeric()
      .withMessage('Minimum truck capacity must be a number'),
    body('requirements.maxDeliveryDays')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Maximum delivery days must be at least 1'),
  ],
  fixedPriceController.updateFixedPriceDetails
);

// ===== TRUCK OWNER ROUTES =====

/**
 * @swagger
 * /api/shipments/available-fixed-price:
 *   get:
 *     summary: Get available fixed-price shipments for truck owners
 *     tags: [Fixed-Price Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Origin country filter
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Destination country filter
 *       - in: query
 *         name: truckCapacity
 *         schema:
 *           type: number
 *         description: Your truck capacity (to filter compatible shipments)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of available fixed-price shipments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user is not a truck owner
 */
router.get(
  '/available-fixed-price',
  restrictTo('TruckOwner'),
  fixedPriceController.getAvailableFixedPriceShipments
);

/**
 * @swagger
 * /api/shipments/{id}/accept-fixed-price:
 *   post:
 *     summary: Accept a fixed-price shipment (first-come-first-served)
 *     tags: [Fixed-Price Shipments]
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
 *               - truckId
 *               - driverId
 *             properties:
 *               truckId:
 *                 type: string
 *                 description: ID of the truck to assign
 *               driverId:
 *                 type: string
 *                 description: ID of the driver to assign
 *               acceptanceNote:
 *                 type: string
 *                 description: Optional note about the acceptance
 *     responses:
 *       200:
 *         description: Fixed-price shipment accepted successfully
 *       400:
 *         description: Validation error or shipment not available
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user is not a truck owner
 *       404:
 *         description: Shipment not found
 */
router.post(
  '/:id/accept-fixed-price',
  restrictTo('TruckOwner'),
  [
    body('truckId').notEmpty().withMessage('Truck ID is required'),
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('acceptanceNote').optional().isString().withMessage('Acceptance note must be a string'),
  ],
  fixedPriceController.acceptFixedPriceShipment
);

/**
 * @swagger
 * /api/truck-owner/fixed-price-shipments:
 *   get:
 *     summary: Get my accepted fixed-price shipments (TruckOwner)
 *     tags: [Fixed-Price Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ASSIGNED, IN_TRANSIT, DELIVERED, COMPLETED]
 *         description: Filter by shipment status
 *     responses:
 *       200:
 *         description: List of accepted fixed-price shipments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user is not a truck owner
 */
router.get(
  '/truck-owner/fixed-price-shipments',
  restrictTo('TruckOwner'),
  fixedPriceController.getMyAcceptedFixedPriceShipments
);

module.exports = router;
