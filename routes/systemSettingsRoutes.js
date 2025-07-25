const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const systemSettingsController = require('../controllers/systemSettingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All system settings routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

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

module.exports = router;
