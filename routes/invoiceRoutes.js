const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All invoice routes require authentication
router.use(authMiddleware);

// Generate invoice from order (Admin only)
router.post('/generate/:orderId',
    adminMiddleware,
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
    adminMiddleware,
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
    adminMiddleware,
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
    ],
    validateRequest,
    invoiceController.getInvoiceAnalytics
);

// Get single invoice
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid invoice ID')
    ],
    validateRequest,
    invoiceController.getInvoice
);

// Update invoice (Admin only)
router.put('/:id',
    adminMiddleware,
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
    adminMiddleware,
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
    adminMiddleware,
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

module.exports = router;
