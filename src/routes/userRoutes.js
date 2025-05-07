const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/users/updateMe:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               companyName:
 *                 type: string
 *                 description: Company name (for TruckOwner)
 *               companyAddress:
 *                 type: string
 *                 description: Company address (for TruckOwner)
 *               licenseNumber:
 *                 type: string
 *                 description: Driver's license number (for Driver)
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch(
  '/updateMe',
  protect,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
    // TruckOwner specific validations
    body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
    body('companyAddress').optional().notEmpty().withMessage('Company address cannot be empty'),
    // Driver specific validations
    body('licenseNumber').optional().notEmpty().withMessage('License number cannot be empty')
  ],
  userController.updateMe
);

/**
 * @swagger
 * /api/users/deleteMe:
 *   delete:
 *     summary: Delete current user profile (soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
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
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/deleteMe', protect, userController.deleteMe);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Admin, Merchant, TruckOwner, Driver]
 *         description: Filter users by role
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter users by active status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of users
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user does not have admin privileges
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', protect, userController.getAllUsers);

/**
 * @swagger
 * /api/users/myDrivers:
 *   get:
 *     summary: Get all drivers for a truck owner
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of drivers
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
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - user is not a truck owner
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/myDrivers', protect, restrictTo('TruckOwner'), userController.getMyDrivers);

module.exports = router; 