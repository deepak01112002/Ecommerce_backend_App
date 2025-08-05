const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const {
    getAppSettings,
    getAppStatus,
    getAllAppSettings,
    updateAppSettings,
    toggleApplicationStatus,
    toggleMaintenanceMode,
    updateBusinessHours,
    updateOrderSettings,
    updateDeliverySettings,
    updateContactInfo,
    updateAppVersion,
    updateFeatures,
    resetAppSettings
} = require('../controllers/appSettingsController');

// Validation middleware
const validateAppSettings = [
    body('isApplicationActive').optional().isBoolean(),
    body('maintenanceMode').optional().isBoolean(),
    body('inactiveMessage.title').optional().trim().isLength({ max: 100 }),
    body('inactiveMessage.message').optional().trim().isLength({ max: 500 }),
    body('inactiveMessage.showContactInfo').optional().isBoolean(),
    body('orderSettings.allowOrders').optional().isBoolean(),
    body('orderSettings.minOrderAmount').optional().isFloat({ min: 0 }),
    body('orderSettings.maxOrderAmount').optional().isFloat({ min: 0 }),
    body('orderSettings.allowCOD').optional().isBoolean(),
    body('orderSettings.allowOnlinePayment').optional().isBoolean(),
    body('deliverySettings.allowDelivery').optional().isBoolean(),
    body('deliverySettings.freeDeliveryThreshold').optional().isFloat({ min: 0 }),
    body('deliverySettings.deliveryCharges').optional().isFloat({ min: 0 }),
    body('deliverySettings.estimatedDeliveryDays.min').optional().isInt({ min: 1 }),
    body('deliverySettings.estimatedDeliveryDays.max').optional().isInt({ min: 1 }),
    body('contactInfo.phone').optional().trim(),
    body('contactInfo.email').optional().trim().isEmail(),
    body('contactInfo.whatsapp').optional().trim(),
    body('contactInfo.address').optional().trim().isLength({ max: 500 }),
    body('appVersion.current').optional().trim().matches(/^\d+\.\d+\.\d+$/),
    body('appVersion.minimum').optional().trim().matches(/^\d+\.\d+\.\d+$/),
    body('appVersion.forceUpdate').optional().isBoolean(),
    body('appVersion.updateMessage').optional().trim().isLength({ max: 200 })
];

const validateBusinessHours = [
    body('businessHours.enabled').optional().isBoolean(),
    body('businessHours.timezone').optional().isString(),
    body('businessHours.outsideHoursMessage').optional().trim().isLength({ max: 200 }),
    body('businessHours.schedule.*.open').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('businessHours.schedule.*.close').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('businessHours.schedule.*.isOpen').optional().isBoolean()
];

const validateToggleStatus = [
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
    body('reason').optional().trim().isLength({ max: 500 })
];

const validateMaintenanceMode = [
    body('maintenanceMode').isBoolean().withMessage('maintenanceMode must be a boolean'),
    body('message').optional().trim().isLength({ max: 500 })
];

const validateOrderSettings = [
    body('orderSettings.allowOrders').optional().isBoolean(),
    body('orderSettings.minOrderAmount').optional().isFloat({ min: 0 }),
    body('orderSettings.maxOrderAmount').optional().isFloat({ min: 0 }),
    body('orderSettings.allowCOD').optional().isBoolean(),
    body('orderSettings.allowOnlinePayment').optional().isBoolean()
];

const validateDeliverySettings = [
    body('deliverySettings.allowDelivery').optional().isBoolean(),
    body('deliverySettings.freeDeliveryThreshold').optional().isFloat({ min: 0 }),
    body('deliverySettings.deliveryCharges').optional().isFloat({ min: 0 }),
    body('deliverySettings.estimatedDeliveryDays.min').optional().isInt({ min: 1 }),
    body('deliverySettings.estimatedDeliveryDays.max').optional().isInt({ min: 1 })
];

const validateContactInfo = [
    body('contactInfo.phone').optional().trim(),
    body('contactInfo.email').optional().trim().isEmail(),
    body('contactInfo.whatsapp').optional().trim(),
    body('contactInfo.address').optional().trim().isLength({ max: 500 })
];

const validateAppVersion = [
    body('appVersion.current').optional().trim().matches(/^\d+\.\d+\.\d+$/),
    body('appVersion.minimum').optional().trim().matches(/^\d+\.\d+\.\d+$/),
    body('appVersion.forceUpdate').optional().isBoolean(),
    body('appVersion.updateMessage').optional().trim().isLength({ max: 200 })
];

const validateFeatures = [
    body('features.enableWishlist').optional().isBoolean(),
    body('features.enableReviews').optional().isBoolean(),
    body('features.enableReferral').optional().isBoolean(),
    body('features.enableLoyaltyPoints').optional().isBoolean(),
    body('features.enableChat').optional().isBoolean(),
    body('features.enableNotifications').optional().isBoolean()
];

const validateResetSection = [
    body('section').isIn(['businessHours', 'orderSettings', 'deliverySettings', 'features'])
        .withMessage('Invalid section')
];

// Public routes
// @desc    Get public application settings
// @route   GET /api/app-settings
// @access  Public
router.get('/', getAppSettings);

// @desc    Get application status for quick check
// @route   GET /api/app-settings/status
// @access  Public
router.get('/status', getAppStatus);

// Admin routes - require authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// @desc    Get all application settings (admin)
// @route   GET /api/admin/app-settings
// @access  Admin
router.get('/admin', getAllAppSettings);

// @desc    Update application settings
// @route   PUT /api/admin/app-settings
// @access  Admin
router.put('/admin', validateAppSettings, updateAppSettings);

// @desc    Toggle application active status
// @route   PUT /api/admin/app-settings/toggle-active
// @access  Admin
router.put('/admin/toggle-active', validateToggleStatus, toggleApplicationStatus);

// @desc    Toggle maintenance mode
// @route   PUT /api/admin/app-settings/maintenance
// @access  Admin
router.put('/admin/maintenance', validateMaintenanceMode, toggleMaintenanceMode);

// @desc    Update business hours
// @route   PUT /api/admin/app-settings/business-hours
// @access  Admin
router.put('/admin/business-hours', validateBusinessHours, updateBusinessHours);

// @desc    Update order settings
// @route   PUT /api/admin/app-settings/order-settings
// @access  Admin
router.put('/admin/order-settings', validateOrderSettings, updateOrderSettings);

// @desc    Update delivery settings
// @route   PUT /api/admin/app-settings/delivery-settings
// @access  Admin
router.put('/admin/delivery-settings', validateDeliverySettings, updateDeliverySettings);

// @desc    Update contact information
// @route   PUT /api/admin/app-settings/contact-info
// @access  Admin
router.put('/admin/contact-info', validateContactInfo, updateContactInfo);

// @desc    Update app version
// @route   PUT /api/admin/app-settings/app-version
// @access  Admin
router.put('/admin/app-version', validateAppVersion, updateAppVersion);

// @desc    Update feature flags
// @route   PUT /api/admin/app-settings/features
// @access  Admin
router.put('/admin/features', validateFeatures, updateFeatures);

// @desc    Reset settings to default
// @route   POST /api/admin/app-settings/reset
// @access  Admin
router.post('/admin/reset', validateResetSection, resetAppSettings);

module.exports = router;
