const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middlewares/errorHandler');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const estimateController = require('../controllers/estimateController');

// USER ROUTES (Authenticated users only)

// Get user's estimates
router.get('/',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).withMessage('Invalid status'),
        query('search').optional().isString().withMessage('Search must be string')
    ],
    validateRequest,
    estimateController.getUserEstimates
);

// Get single estimate
router.get('/:id',
    authMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID')
    ],
    validateRequest,
    estimateController.getEstimate
);

// Generate estimate from cart
router.post('/generate-from-cart',
    authMiddleware,
    [
        body('cartItems').isArray({ min: 1 }).withMessage('Cart items are required'),
        body('cartItems.*.productId').isMongoId().withMessage('Valid product ID is required'),
        body('cartItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
        body('cartItems.*.price').isFloat({ min: 0 }).withMessage('Price must be positive number'),
        body('billingAddress').optional().isObject().withMessage('Billing address must be object'),
        body('shippingAddress').optional().isObject().withMessage('Shipping address must be object'),
        body('notes').optional().isString().withMessage('Notes must be string'),
        body('termsAndConditions').optional().isString().withMessage('Terms and conditions must be string'),
        body('isGSTApplicable').optional().isBoolean().withMessage('GST applicable must be boolean'),
        body('taxType').optional().isIn(['GST', 'IGST', 'NON_GST']).withMessage('Invalid tax type'),
        body('isInterState').optional().isBoolean().withMessage('Inter state must be boolean')
    ],
    validateRequest,
    estimateController.generateEstimateFromCart
);

// Download estimate PDF
router.get('/:id/download',
    authMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID'),
        query('format').optional().isIn(['standard', 'thermal', '4x6']).withMessage('Invalid format')
    ],
    validateRequest,
    estimateController.downloadEstimatePDF
);

// Accept estimate
router.patch('/:id/accept',
    authMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID')
    ],
    validateRequest,
    estimateController.acceptEstimate
);

// Convert estimate to order
router.post('/:id/convert-to-order',
    authMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID'),
        body('paymentMethod').optional().isString().withMessage('Payment method must be string'),
        body('shippingAddress').optional().isObject().withMessage('Shipping address must be object'),
        body('billingAddress').optional().isObject().withMessage('Billing address must be object')
    ],
    validateRequest,
    estimateController.convertEstimateToOrder
);

// ADMIN ROUTES (Admin only)

// Generate estimate from order (Admin)
router.post('/admin/generate/:orderId',
    authMiddleware,
    adminMiddleware,
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('companyDetails').optional().isObject().withMessage('Company details must be object'),
        body('notes').optional().isString().withMessage('Notes must be string'),
        body('termsAndConditions').optional().isString().withMessage('Terms and conditions must be string'),
        body('isGSTApplicable').optional().isBoolean().withMessage('GST applicable must be boolean'),
        body('taxType').optional().isIn(['GST', 'IGST', 'NON_GST']).withMessage('Invalid tax type'),
        body('isInterState').optional().isBoolean().withMessage('Inter state must be boolean'),
        body('validityDays').optional().isInt({ min: 1, max: 365 }).withMessage('Validity days must be between 1 and 365')
    ],
    validateRequest,
    estimateController.generateEstimate
);

// Get all estimates (Admin)
router.get('/admin/all',
    authMiddleware,
    adminMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']).withMessage('Invalid status'),
        query('search').optional().isString().withMessage('Search must be string'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('sortBy').optional().isIn(['estimateDate', 'grandTotal', 'status', 'customerName']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
    ],
    validateRequest,
    estimateController.getAllEstimates
);

// Convert estimate to invoice (Admin)
router.post('/admin/:id/convert-to-invoice',
    authMiddleware,
    adminMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID')
    ],
    validateRequest,
    estimateController.convertToInvoice
);

// Update estimate status (Admin)
router.patch('/admin/:id/status',
    authMiddleware,
    adminMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID'),
        body('status').isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']).withMessage('Invalid status')
    ],
    validateRequest,
    estimateController.updateEstimateStatus
);

// Delete estimate (Admin)
router.delete('/admin/:id',
    authMiddleware,
    adminMiddleware,
    [
        param('id').isMongoId().withMessage('Invalid estimate ID')
    ],
    validateRequest,
    estimateController.deleteEstimate
);

// Get estimate analytics (Admin)
router.get('/admin/analytics',
    authMiddleware,
    adminMiddleware,
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    estimateController.getEstimateAnalytics
);

module.exports = router;
