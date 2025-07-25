const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const advancedReportsController = require('../controllers/advancedReportsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All advanced reports routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get sales report
router.get('/sales',
    [
        query('startDate').isISO8601().withMessage('Valid start date is required'),
        query('endDate').isISO8601().withMessage('Valid end date is required'),
        query('groupBy').optional().isIn(['hour', 'day', 'week', 'month', 'year']).withMessage('Invalid groupBy value'),
        query('productId').optional().isMongoId().withMessage('Invalid product ID'),
        query('categoryId').optional().isMongoId().withMessage('Invalid category ID'),
        query('customerId').optional().isMongoId().withMessage('Invalid customer ID')
    ],
    validateRequest,
    advancedReportsController.getSalesReport
);

// Get profit & loss report
router.get('/profit-loss',
    [
        query('startDate').isISO8601().withMessage('Valid start date is required'),
        query('endDate').isISO8601().withMessage('Valid end date is required')
    ],
    validateRequest,
    advancedReportsController.getProfitLossReport
);

// Get inventory report
router.get('/inventory',
    [
        query('category').optional().isMongoId().withMessage('Invalid category ID'),
        query('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
        query('stockStatus').optional().isIn(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).withMessage('Invalid stock status')
    ],
    validateRequest,
    advancedReportsController.getInventoryReport
);

// Get customer analytics report
router.get('/customer-analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    advancedReportsController.getCustomerAnalyticsReport
);

// Export report to Excel
router.get('/export/excel',
    [
        query('reportType').isIn(['sales', 'inventory', 'profit-loss', 'customer-analytics']).withMessage('Invalid report type'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    advancedReportsController.exportReportToExcel
);

module.exports = router;
