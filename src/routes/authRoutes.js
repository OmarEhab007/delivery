const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { csrfProtection } = require('../middleware/csrfProtection');

// Validation middleware for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required')
];

/**
 * @swagger
 * /api/auth/register/admin:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin]
 *     responses:
 *       201:
 *         description: Admin user created successfully
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
router.post(
  '/register/admin',
  protect,
  restrictTo('Admin'),
  [
    ...registerValidation,
    body('role').equals('Admin').withMessage('Role must be Admin')
  ],
  authController.registerAdmin
);

/**
 * @swagger
 * /api/auth/register/merchant:
 *   post:
 *     summary: Register a new merchant user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Merchant]
 *     responses:
 *       201:
 *         description: Merchant user created successfully
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
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/register/merchant',
  [
    ...registerValidation,
    body('role').equals('Merchant').withMessage('Role must be Merchant')
  ],
  authController.registerMerchant
);

// Truck Owner registration
router.post(
  '/register/truckOwner',
  [
    ...registerValidation,
    body('role').equals('TruckOwner').withMessage('Role must be TruckOwner'),
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('companyAddress').notEmpty().withMessage('Company address is required')
  ],
  authController.registerTruckOwner
);

// Driver registration (by Truck Owner)
router.post(
  '/register/driver',
  protect,
  restrictTo('TruckOwner'),
  [
    ...registerValidation,
    body('role').equals('Driver').withMessage('Role must be Driver'),
    body('licenseNumber').notEmpty().withMessage('License number is required')
  ],
  authController.registerDriver
);

// Test admin registration (for testing purposes only)
router.post(
  '/register/testadmin',
  [
    ...registerValidation,
    body('role').optional().equals('Admin').withMessage('Role must be Admin')
  ],
  authController.registerTestAdmin
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   default: false
 *                 message:
 *                   type: string
 *                   default: "Invalid credentials"
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
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
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/me', protect, authController.getCurrentUser);

// Forgot Password
router.post(
  '/forgotPassword',
  [
    body('email').isEmail().withMessage('Please provide a valid email')
  ],
  authController.forgotPassword
);

// Reset Password
router.patch(
  '/resetPassword/:token',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  authController.resetPassword
);

// Update Password (for logged in users)
router.patch(
  '/updatePassword',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  authController.updatePassword
);

// Generate CSRF token
router.get('/csrf-token', csrfProtection, authController.getCsrfToken);

module.exports = router;
