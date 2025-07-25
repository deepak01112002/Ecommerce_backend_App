const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminManagementController = require('../controllers/adminManagementController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All admin management routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// User Management
router.get('/users',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
        query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
        query('search').optional().isString().withMessage('Search must be string'),
        query('sortBy').optional().isIn(['createdAt', 'firstName', 'lastName', 'email']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
    ],
    validateRequest,
    adminManagementController.getAllUsers
);

router.get('/users/:id',
    [
        param('id').isMongoId().withMessage('Invalid user ID')
    ],
    validateRequest,
    adminManagementController.getUserDetails
);

router.patch('/users/:id/status',
    [
        param('id').isMongoId().withMessage('Invalid user ID'),
        body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
        body('role').optional().isIn(['user', 'admin', 'moderator']).withMessage('Invalid role')
    ],
    validateRequest,
    adminManagementController.updateUserStatus
);

router.post('/users/admin',
    [
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        body('phone').notEmpty().withMessage('Phone is required'),
        body('role').optional().isIn(['admin', 'moderator']).withMessage('Invalid role')
    ],
    validateRequest,
    adminManagementController.createAdminUser
);

// Order Management
router.patch('/orders/:id/status',
    [
        param('id').isMongoId().withMessage('Invalid order ID'),
        body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).withMessage('Invalid status'),
        body('trackingNumber').optional().isString().withMessage('Tracking number must be string'),
        body('notes').optional().isString().withMessage('Notes must be string')
    ],
    validateRequest,
    adminManagementController.updateOrderStatus
);

// Product Management
router.patch('/products/:id/toggle-status',
    [
        param('id').isMongoId().withMessage('Invalid product ID')
    ],
    validateRequest,
    adminManagementController.toggleProductStatus
);

router.patch('/products/:id/stock',
    [
        param('id').isMongoId().withMessage('Invalid product ID'),
        body('stock').isInt({ min: 0 }).withMessage('Stock must be non-negative integer'),
        body('operation').optional().isIn(['set', 'add', 'subtract']).withMessage('Invalid operation')
    ],
    validateRequest,
    adminManagementController.updateProductStock
);

// Category Management
router.patch('/categories/:id/toggle-status',
    [
        param('id').isMongoId().withMessage('Invalid category ID')
    ],
    validateRequest,
    adminManagementController.toggleCategoryStatus
);

// Coupon Management
router.patch('/coupons/:id/toggle-status',
    [
        param('id').isMongoId().withMessage('Invalid coupon ID')
    ],
    validateRequest,
    adminManagementController.toggleCouponStatus
);

// System Management
router.get('/system/overview',
    adminManagementController.getSystemOverview
);

router.patch('/system/maintenance',
    [
        body('enabled').isBoolean().withMessage('Enabled must be boolean'),
        body('message').optional().isString().withMessage('Message must be string')
    ],
    validateRequest,
    adminManagementController.toggleMaintenanceMode
);

module.exports = router;
