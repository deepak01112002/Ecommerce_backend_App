const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const billManagementController = require('../controllers/billManagementController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All bill management routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get bill management dashboard
router.get('/dashboard',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    billManagementController.getBillDashboard
);

// Get all bills with advanced filtering
router.get('/bills',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['draft', 'sent', 'paid', 'cancelled', 'refunded']).withMessage('Invalid status'),
        query('paymentStatus').optional().isIn(['pending', 'paid', 'partial', 'overdue', 'cancelled']).withMessage('Invalid payment status'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('search').optional().isString().withMessage('Search must be string'),
        query('sortBy').optional().isIn(['invoiceDate', 'grandTotal', 'customerName', 'status']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
        query('customerName').optional().isString().withMessage('Customer name must be string'),
        query('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be positive'),
        query('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be positive')
    ],
    validateRequest,
    billManagementController.getAllBills
);

// Export bills to Excel for CA
router.get('/export/excel',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('status').optional().isIn(['draft', 'sent', 'paid', 'cancelled', 'refunded']).withMessage('Invalid status'),
        query('paymentStatus').optional().isIn(['pending', 'paid', 'partial', 'overdue', 'cancelled']).withMessage('Invalid payment status'),
        query('format').optional().isIn(['detailed', 'summary']).withMessage('Format must be detailed or summary')
    ],
    validateRequest,
    billManagementController.exportBillsToExcel
);

// Get bill analytics for CA
router.get('/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('groupBy').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid groupBy value')
    ],
    validateRequest,
    billManagementController.getBillAnalytics
);

// Generate comprehensive CA report
router.post('/generate-ca-report',
    [
        body('startDate').isISO8601().withMessage('Valid start date is required'),
        body('endDate').isISO8601().withMessage('Valid end date is required'),
        body('reportType').optional().isIn(['comprehensive', 'summary', 'gst_only']).withMessage('Invalid report type')
    ],
    validateRequest,
    billManagementController.generateCAReport
);

module.exports = router;
