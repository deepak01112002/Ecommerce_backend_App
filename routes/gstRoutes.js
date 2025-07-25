const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const gstController = require('../controllers/gstController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All GST routes require authentication
router.use(authMiddleware);

// Get GST configuration
router.get('/config',
    gstController.getGSTConfig
);

// Calculate GST for amount
router.post('/calculate',
    [
        body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
        body('gstRate').isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
        body('fromState').notEmpty().withMessage('From state is required'),
        body('toState').notEmpty().withMessage('To state is required')
    ],
    validateRequest,
    gstController.calculateGST
);

// Get GST analytics
router.get('/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
    ],
    validateRequest,
    gstController.getGSTAnalytics
);

// Admin routes (require admin privileges)
router.use(adminMiddleware);

// Update GST configuration (Admin only)
router.put('/config',
    [
        body('companyGSTDetails.gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
        body('companyGSTDetails.legalName').optional().isString().withMessage('Legal name must be string'),
        body('companyGSTDetails.address.street').optional().isString().withMessage('Street must be string'),
        body('companyGSTDetails.address.city').optional().isString().withMessage('City must be string'),
        body('companyGSTDetails.address.state').optional().isString().withMessage('State must be string'),
        body('companyGSTDetails.address.pincode').optional().isString().withMessage('Pincode must be string'),
        body('companyGSTDetails.stateCode').optional().isLength({ min: 2, max: 2 }).withMessage('State code must be 2 characters'),
        body('taxRules.tdsRate').optional().isFloat({ min: 0, max: 100 }).withMessage('TDS rate must be between 0 and 100'),
        body('taxRules.tcsRate').optional().isFloat({ min: 0, max: 100 }).withMessage('TCS rate must be between 0 and 100'),
        body('invoiceConfig.dueDays').optional().isInt({ min: 0 }).withMessage('Due days must be positive integer')
    ],
    validateRequest,
    gstController.updateGSTConfig
);

// Add HSN code (Admin only)
router.post('/hsn-codes',
    [
        body('code').notEmpty().withMessage('HSN code is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('gstRate').isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
        body('category').optional().isString().withMessage('Category must be string')
    ],
    validateRequest,
    gstController.addHSNCode
);

// Update HSN code (Admin only)
router.put('/hsn-codes/:code',
    [
        param('code').notEmpty().withMessage('HSN code is required'),
        body('description').optional().isString().withMessage('Description must be string'),
        body('gstRate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
        body('category').optional().isString().withMessage('Category must be string'),
        body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
    ],
    validateRequest,
    gstController.updateHSNCode
);

// Generate tax report (Admin only)
router.post('/reports/generate',
    [
        body('reportType').isIn(['monthly_summary', 'GSTR1', 'GSTR3B', 'quarterly_summary', 'annual_summary']).withMessage('Invalid report type'),
        body('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        body('year').isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
        body('quarter').optional().isInt({ min: 1, max: 4 }).withMessage('Quarter must be between 1 and 4')
    ],
    validateRequest,
    gstController.generateTaxReport
);

// Get all tax reports (Admin only)
router.get('/reports',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('reportType').optional().isIn(['monthly_summary', 'GSTR1', 'GSTR3B', 'quarterly_summary', 'annual_summary']).withMessage('Invalid report type'),
        query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
        query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        query('filingStatus').optional().isIn(['draft', 'filed', 'revised', 'cancelled']).withMessage('Invalid filing status')
    ],
    validateRequest,
    gstController.getTaxReports
);

// Get single tax report (Admin only)
router.get('/reports/:id',
    [
        param('id').isMongoId().withMessage('Invalid report ID')
    ],
    validateRequest,
    gstController.getTaxReport
);

// Export tax report to Excel (Admin only)
router.get('/reports/:id/export/excel',
    [
        param('id').isMongoId().withMessage('Invalid report ID')
    ],
    validateRequest,
    gstController.exportTaxReportToExcel
);

// Mark tax report as filed (Admin only)
router.patch('/reports/:id/mark-filed',
    [
        param('id').isMongoId().withMessage('Invalid report ID'),
        body('acknowledgmentNumber').notEmpty().withMessage('Acknowledgment number is required')
    ],
    validateRequest,
    gstController.markReportAsFiled
);

module.exports = router;
