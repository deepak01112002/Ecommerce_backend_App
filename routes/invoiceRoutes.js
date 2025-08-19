const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const invoiceManagementController = require('../controllers/invoiceManagementController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// USER ROUTES (Authentication required, no admin needed)

// Get user's invoices
router.get('/my-invoices',
    authMiddleware,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('status').optional().isIn(['draft', 'sent', 'paid', 'cancelled', 'refunded']).withMessage('Invalid status'),
        query('paymentStatus').optional().isIn(['pending', 'paid', 'partial', 'overdue', 'cancelled']).withMessage('Invalid payment status')
    ],
    validateRequest,
    invoiceController.getUserInvoices
);

// Get user's invoice by order ID
router.get('/order/:orderId',
    authMiddleware,
    [
        param('orderId').isMongoId().withMessage('Invalid order ID')
    ],
    validateRequest,
    invoiceController.getUserInvoiceByOrder
);

// Download user's invoice PDF by order ID
router.get('/order/:orderId/download',
    authMiddleware,
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        query('format').optional().isIn(['A4', 'thermal', '4x6']).withMessage('Invalid format. Use A4, thermal or 4x6')
    ],
    validateRequest,
    invoiceController.downloadUserInvoiceByOrder
);

// ADMIN ROUTES (Authentication + Admin required)
// All admin routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Generate invoice from order (Admin only)
router.post('/generate/:orderId',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('companyDetails.name').optional().isString().withMessage('Company name must be string'),
        body('companyDetails.address').optional().isString().withMessage('Company address must be string'),
        body('companyDetails.gstin').optional().isString().withMessage('GSTIN must be string'),
        body('companyDetails.phone').optional().isString().withMessage('Phone must be string'),
        body('companyDetails.email').optional().isEmail().withMessage('Invalid email format'),
        body('notes').optional().isString().withMessage('Notes must be string'),
        body('termsAndConditions').optional().isString().withMessage('Terms must be string')
    ],
    validateRequest,
    invoiceController.generateInvoice
);

// Get all invoices (Admin only)
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['draft', 'sent', 'paid', 'cancelled', 'refunded']).withMessage('Invalid status'),
        query('paymentStatus').optional().isIn(['pending', 'paid', 'partial', 'overdue', 'cancelled']).withMessage('Invalid payment status'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('search').optional().isString().withMessage('Search must be string')
    ],
    validateRequest,
    invoiceController.getAllInvoices
);

// Get invoice analytics (Admin only)
router.get('/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
    ],
    validateRequest,
    invoiceController.getInvoiceAnalytics
);

// Update invoice (Admin only)
router.put('/:id',
    [
        param('id').isMongoId().withMessage('Invalid invoice ID'),
        body('customerDetails.name').optional().isString().withMessage('Customer name must be string'),
        body('customerDetails.email').optional().isEmail().withMessage('Invalid email format'),
        body('customerDetails.phone').optional().isString().withMessage('Phone must be string'),
        body('notes').optional().isString().withMessage('Notes must be string'),
        body('termsAndConditions').optional().isString().withMessage('Terms must be string')
    ],
    validateRequest,
    invoiceController.updateInvoice
);

// Mark invoice as paid (Admin only)
router.patch('/:id/mark-paid',
    [
        param('id').isMongoId().withMessage('Invalid invoice ID'),
        body('paymentDate').optional().isISO8601().withMessage('Invalid payment date format'),
        body('transactionId').optional().isString().withMessage('Transaction ID must be string'),
        body('paymentReference').optional().isString().withMessage('Payment reference must be string'),
        body('paidAmount').optional().isFloat({ min: 0 }).withMessage('Paid amount must be positive')
    ],
    validateRequest,
    invoiceController.markAsPaid
);

// Cancel invoice (Admin only)
router.patch('/:id/cancel',
    [
        param('id').isMongoId().withMessage('Invalid invoice ID'),
        body('reason').notEmpty().withMessage('Cancellation reason is required')
    ],
    validateRequest,
    invoiceController.cancelInvoice
);

// Generate PDF invoice
router.get('/:id/pdf',
    [
        param('id').isMongoId().withMessage('Invalid invoice ID'),
        query('format').optional().isIn(['A4', 'thermal']).withMessage('Invalid format. Use A4 or thermal')
    ],
    validateRequest,
    invoiceController.generatePDF
);

// Enhanced invoice generation from order (with thermal support)
router.post('/enhanced/generate/:orderId',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('generatePDF').optional().isBoolean().withMessage('generatePDF must be boolean'),
        body('thermalFormat').optional().isBoolean().withMessage('thermalFormat must be boolean')
    ],
    validateRequest,
    invoiceManagementController.generateInvoiceFromOrder
);

// Enhanced get all invoices (with better filtering)
router.get('/enhanced/all',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isString().withMessage('Status must be string'),
        query('search').optional().isString().withMessage('Search must be string')
    ],
    validateRequest,
    invoiceManagementController.getAllInvoices
);

// Enhanced get single invoice (with order details)
router.get('/enhanced/:id',
    [
        param('id').isMongoId().withMessage('Invalid invoice ID')
    ],
    validateRequest,
    invoiceManagementController.getInvoice
);

module.exports = router;
