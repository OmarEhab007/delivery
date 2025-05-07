const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const truckController = require('../controllers/truck/truckController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply middleware to all routes - only TruckOwner can access
router.use(protect);
router.use(restrictTo('TruckOwner'));

/**
 * @swagger
 * /api/trucks:
 *   post:
 *     summary: Create a new truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plateNumber
 *               - model
 *               - capacity
 *               - year
 *             properties:
 *               plateNumber:
 *                 type: string
 *                 description: License plate number of the truck
 *               model:
 *                 type: string
 *                 description: Truck model
 *               capacity:
 *                 type: number
 *                 description: Truck capacity in tons
 *               year:
 *                 type: number
 *                 description: Manufacturing year
 *               type:
 *                 type: string
 *                 enum: [Flatbed, Refrigerated, Container, Box]
 *                 description: Type of truck
 *     responses:
 *       201:
 *         description: Truck created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Truck'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/',
  [
    body('plateNumber').notEmpty().withMessage('Plate number is required'),
    body('model').notEmpty().withMessage('Truck model is required'),
    body('capacity').isNumeric().withMessage('Capacity must be a number'),
    body('year').isNumeric().withMessage('Year must be a number')
  ],
  truckController.createTruck
);

/**
 * @swagger
 * /api/trucks:
 *   get:
 *     summary: Get all trucks for the current truck owner
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of trucks
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
 *                     $ref: '#/components/schemas/Truck'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', truckController.getMyTrucks);

/**
 * @swagger
 * /api/trucks/search:
 *   get:
 *     summary: Search for trucks with filters
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, In Transit, Under Maintenance, Inactive]
 *         description: Filter by truck status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Flatbed, Refrigerated, Container, Box]
 *         description: Filter by truck type
 *       - in: query
 *         name: capacity
 *         schema:
 *           type: number
 *         description: Minimum capacity in tons
 *     responses:
 *       200:
 *         description: List of matching trucks
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
 *                     $ref: '#/components/schemas/Truck'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/search', truckController.searchTrucks);

/**
 * @swagger
 * /api/trucks/{id}:
 *   get:
 *     summary: Get a truck by ID
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Truck ID
 *     responses:
 *       200:
 *         description: Truck details
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
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', truckController.getTruck);

/**
 * @swagger
 * /api/trucks/{id}:
 *   patch:
 *     summary: Update a truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Truck ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plateNumber:
 *                 type: string
 *               model:
 *                 type: string
 *               capacity:
 *                 type: number
 *               year:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Available, In Transit, Under Maintenance, Inactive]
 *               type:
 *                 type: string
 *                 enum: [Flatbed, Refrigerated, Container, Box]
 *     responses:
 *       200:
 *         description: Truck updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Truck'
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
  [
    body('plateNumber').optional().notEmpty().withMessage('Plate number cannot be empty'),
    body('model').optional().notEmpty().withMessage('Truck model cannot be empty'),
    body('capacity').optional().isNumeric().withMessage('Capacity must be a number'),
    body('year').optional().isNumeric().withMessage('Year must be a number')
  ],
  truckController.updateTruck
);

/**
 * @swagger
 * /api/trucks/{id}:
 *   delete:
 *     summary: Delete a truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Truck ID
 *     responses:
 *       200:
 *         description: Truck deleted successfully
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
router.delete('/:id', truckController.deleteTruck);

/**
 * @swagger
 * /api/trucks/{truckId}/assign/{driverId}:
 *   patch:
 *     summary: Assign a driver to a truck
 *     tags: [Trucks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: truckId
 *         schema:
 *           type: string
 *         required: true
 *         description: Truck ID
 *       - in: path
 *         name: driverId
 *         schema:
 *           type: string
 *         required: true
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver assigned successfully
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
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch('/:truckId/assign/:driverId', truckController.assignDriver);

module.exports = router; 