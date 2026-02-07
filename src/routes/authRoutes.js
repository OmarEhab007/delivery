const express = require('express');

const router = express.Router();
const { body } = require('express-validator');

const authController = require('../controllers/auth/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { csrfProtection } = require('../middleware/csrfProtection');

// Password complexity validator
const passwordValidator = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Password is required');
  }
  if (value.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(value)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(value)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(value)) {
    throw new Error('Password must contain at least one digit');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    throw new Error('Password must contain at least one special character');
  }
  return true;
};

// Validation middleware for registration
const registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').custom(passwordValidator),
  body('phone').notEmpty().withMessage('Phone number is required'),
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
  [...registerValidation, body('role').equals('Admin').withMessage('Role must be Admin')],
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
router.post('/register/merchant', registerValidation, authController.registerMerchant);

// Truck Owner registration
router.post(
  '/register/truckOwner',
  [
    ...registerValidation,
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('companyAddress').notEmpty().withMessage('Company address is required'),
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
    body('licenseNumber').notEmpty().withMessage('License number is required'),
  ],
  authController.registerDriver
);

// Test admin registration (for testing purposes only)
// SEC-001: Disable in production to prevent unauthenticated admin creation
if (process.env.NODE_ENV !== 'production') {
  router.post('/register/testadmin', registerValidation, authController.registerTestAdmin);
}

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
 *                 status:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *                 refreshExpiresIn:
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
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: string
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *       403:
 *         description: User account is inactive
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  authController.refreshAccessToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and revoke refresh token
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token to revoke
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/logout', authController.logout);

router.post(
  '/otp/request',
  [body('phone').isMobilePhone().withMessage('Please provide a valid phone number')],
  authController.requestOtp
);

router.post(
  '/otp/verify',
  [
    body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
    body('otp').isLength({ min: 4, max: 10 }).withMessage('OTP must be between 4 and 10 digits'),
  ],
  authController.verifyOtp
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
  [body('email').isEmail().withMessage('Please provide a valid email')],
  authController.forgotPassword
);

// Reset Password
router.patch(
  '/resetPassword/:token',
  csrfProtection,
  [body('password').custom(passwordValidator)],
  authController.resetPassword
);

// Update Password (for logged in users)
router.patch(
  '/updatePassword',
  protect,
  csrfProtection,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').custom(passwordValidator),
  ],
  authController.updatePassword
);

// Generate CSRF token
router.get('/csrf-token', csrfProtection, authController.getCsrfToken);

module.exports = router;
