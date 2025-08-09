const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const systemSettingsController = require('../controllers/systemSettingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// PUBLIC ROUTES (No authentication required)
// Get public system settings (for app status, maintenance mode, etc.)
router.get('/public',
    systemSettingsController.getPublicSettings
);

// Get app status for users (to show maintenance popup)
router.get('/public/app-status',
    systemSettingsController.getPublicAppStatus
);

// Get public invoice settings (for download options)
router.get('/public/invoice-settings',
    systemSettingsController.getPublicInvoiceSettings
);

// ADMIN ROUTES (Authentication required)
// All system settings routes below require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// App status (activate/deactivate) - Admin only
router.get('/app-status', systemSettingsController.getAppStatus);
router.put('/app-status', [
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('reason').optional().isString().withMessage('reason must be string'),
    body('maintenanceMessage').optional().custom((value) => {
        if (value === null || typeof value === 'string') return true;
        throw new Error('maintenanceMessage must be string or null');
    }),
    body('estimatedDowntime').optional().custom((value) => {
        if (value === null || typeof value === 'string') return true;
        throw new Error('estimatedDowntime must be string or null');
    })
], validateRequest, systemSettingsController.updateAppStatus);

// Get all system settings
router.get('/',
    systemSettingsController.getSystemSettings
);

// Get specific setting section
router.get('/sections/:section',
    [
        param('section').isIn(['general', 'business', 'order', 'payment', 'shipping', 'inventory', 'tax', 'notification', 'returnRefund', 'security', 'seo', 'socialMedia', 'api', 'backup', 'performance', 'features']).withMessage('Invalid setting section')
    ],
    validateRequest,
    systemSettingsController.getSettingSection
);

// Update system settings
router.put('/',
    [
        body().isObject().withMessage('Settings must be an object')
    ],
    validateRequest,
    systemSettingsController.updateSystemSettings
);

// Update specific setting section
router.put('/sections/:section',
    [
        param('section').isIn(['general', 'business', 'order', 'payment', 'shipping', 'inventory', 'tax', 'notification', 'returnRefund', 'security', 'seo', 'socialMedia', 'api', 'backup', 'performance', 'features']).withMessage('Invalid setting section'),
        body().isObject().withMessage('Settings must be an object')
    ],
    validateRequest,
    systemSettingsController.updateSettingSection
);

// Get specific setting value
router.get('/values/:path',
    [
        param('path').notEmpty().withMessage('Setting path is required')
    ],
    validateRequest,
    systemSettingsController.getSettingValue
);

// Update specific setting value
router.put('/values/:path',
    [
        param('path').notEmpty().withMessage('Setting path is required'),
        body('value').exists().withMessage('Value is required')
    ],
    validateRequest,
    systemSettingsController.updateSettingValue
);

// Reset settings to default
router.post('/reset',
    [
        body('section').optional().isIn(['general', 'business', 'order', 'payment', 'shipping', 'inventory', 'tax', 'notification', 'returnRefund', 'security', 'seo', 'socialMedia', 'api', 'backup', 'performance', 'features']).withMessage('Invalid setting section')
    ],
    validateRequest,
    systemSettingsController.resetSettings
);

// Export settings
router.get('/export',
    systemSettingsController.exportSettings
);

// Import settings
router.post('/import',
    [
        body('settings').isObject().withMessage('Settings must be an object'),
        body('overwrite').optional().isBoolean().withMessage('Overwrite must be boolean')
    ],
    validateRequest,
    systemSettingsController.importSettings
);

// Get settings history/audit
router.get('/history',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    systemSettingsController.getSettingsHistory
);

// Validate settings
router.get('/validate',
    systemSettingsController.validateSettings
);

// Get system status
router.get('/status',
    systemSettingsController.getSystemStatus
);

// Invoice settings management
router.get('/invoice',
    systemSettingsController.getInvoiceSettings
);

router.put('/invoice',
    [
        body('enableInvoiceDownload').optional().isBoolean().withMessage('enableInvoiceDownload must be boolean'),
        body('invoiceFormat').optional().isIn(['pdf']).withMessage('Invalid invoice format'),
        body('includeCompanyLogo').optional().isBoolean().withMessage('includeCompanyLogo must be boolean'),
        body('invoiceTemplate').optional().isString().withMessage('invoiceTemplate must be string'),
        body('invoiceNumberPrefix').optional().isString().withMessage('invoiceNumberPrefix must be string'),
        body('companyDetails').optional().isObject().withMessage('companyDetails must be object')
    ],
    validateRequest,
    systemSettingsController.updateInvoiceSettings
);

// Get invoice template
router.get('/invoice/template/:templateId',
    [
        param('templateId').notEmpty().withMessage('Template ID is required')
    ],
    validateRequest,
    systemSettingsController.getInvoiceTemplate
);

// Update invoice template
router.put('/invoice/template/:templateId',
    [
        param('templateId').notEmpty().withMessage('Template ID is required'),
        body('templateContent').notEmpty().withMessage('Template content is required'),
        body('templateName').optional().isString().withMessage('Template name must be string')
    ],
    validateRequest,
    systemSettingsController.updateInvoiceTemplate
);

module.exports = router;
