const AppSettings = require('../models/AppSettings');
const { asyncHandler } = require('../middlewares/errorHandler');
const { validationResult } = require('express-validator');

// @desc    Get application settings (public)
// @route   GET /api/app-settings
// @access  Public
const getAppSettings = asyncHandler(async (req, res) => {
    const settings = await AppSettings.getSettings();
    
    // Return only public information
    const publicSettings = {
        isApplicationActive: settings.isApplicationActive,
        maintenanceMode: settings.maintenanceMode,
        currentStatus: settings.currentStatus,
        orderSettings: {
            allowOrders: settings.orderSettings.allowOrders,
            minOrderAmount: settings.orderSettings.minOrderAmount,
            maxOrderAmount: settings.orderSettings.maxOrderAmount,
            allowCOD: settings.orderSettings.allowCOD,
            allowOnlinePayment: settings.orderSettings.allowOnlinePayment
        },
        deliverySettings: {
            allowDelivery: settings.deliverySettings.allowDelivery,
            freeDeliveryThreshold: settings.deliverySettings.freeDeliveryThreshold,
            deliveryCharges: settings.deliverySettings.deliveryCharges,
            estimatedDeliveryDays: settings.deliverySettings.estimatedDeliveryDays
        },
        contactInfo: settings.contactInfo,
        appVersion: settings.appVersion,
        features: settings.features,
        businessHours: settings.businessHours.enabled ? {
            enabled: settings.businessHours.enabled,
            timezone: settings.businessHours.timezone,
            schedule: settings.businessHours.schedule
        } : { enabled: false },
        popupData: settings.getInactivePopupData()
    };
    
    res.success({ settings: publicSettings }, 'Application settings retrieved successfully');
});

// @desc    Get application status for quick check
// @route   GET /api/app-settings/status
// @access  Public
const getAppStatus = asyncHandler(async (req, res) => {
    const settings = await AppSettings.getSettings();
    
    const status = {
        isActive: settings.isApplicationActive && !settings.maintenanceMode,
        currentStatus: settings.currentStatus,
        canPlaceOrder: settings.canPlaceOrder(),
        popupData: settings.getInactivePopupData(),
        appVersion: settings.appVersion
    };
    
    res.success({ status }, 'Application status retrieved successfully');
});

// @desc    Get all application settings (admin)
// @route   GET /api/admin/app-settings
// @access  Admin
const getAllAppSettings = asyncHandler(async (req, res) => {
    const settings = await AppSettings.getSettings();
    
    res.success({ settings }, 'Application settings retrieved successfully');
});

// @desc    Update application settings
// @route   PUT /api/admin/app-settings
// @access  Admin
const updateAppSettings = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', 400, errors.array());
    }
    
    const updates = req.body;
    const settings = await AppSettings.updateSettings(updates, req.user._id);
    
    res.success({ settings }, 'Application settings updated successfully');
});

// @desc    Toggle application active status
// @route   PUT /api/admin/app-settings/toggle-active
// @access  Admin
const toggleApplicationStatus = asyncHandler(async (req, res) => {
    const { isActive, reason } = req.body;
    
    const settings = await AppSettings.updateSettings({
        isApplicationActive: isActive,
        ...(reason && {
            'inactiveMessage.message': reason
        })
    }, req.user._id);
    
    res.success({ 
        settings: {
            isApplicationActive: settings.isApplicationActive,
            currentStatus: settings.currentStatus,
            inactiveMessage: settings.inactiveMessage
        }
    }, `Application ${isActive ? 'activated' : 'deactivated'} successfully`);
});

// @desc    Toggle maintenance mode
// @route   PUT /api/admin/app-settings/maintenance
// @access  Admin
const toggleMaintenanceMode = asyncHandler(async (req, res) => {
    const { maintenanceMode, message } = req.body;
    
    const updates = { maintenanceMode };
    if (message) {
        updates['inactiveMessage.message'] = message;
    }
    
    const settings = await AppSettings.updateSettings(updates, req.user._id);
    
    res.success({ 
        settings: {
            maintenanceMode: settings.maintenanceMode,
            currentStatus: settings.currentStatus,
            inactiveMessage: settings.inactiveMessage
        }
    }, `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'} successfully`);
});

// @desc    Update business hours
// @route   PUT /api/admin/app-settings/business-hours
// @access  Admin
const updateBusinessHours = asyncHandler(async (req, res) => {
    const { businessHours } = req.body;
    
    const settings = await AppSettings.updateSettings({
        businessHours
    }, req.user._id);
    
    res.success({ 
        businessHours: settings.businessHours 
    }, 'Business hours updated successfully');
});

// @desc    Update order settings
// @route   PUT /api/admin/app-settings/order-settings
// @access  Admin
const updateOrderSettings = asyncHandler(async (req, res) => {
    const { orderSettings } = req.body;
    
    const settings = await AppSettings.updateSettings({
        orderSettings: {
            ...settings.orderSettings,
            ...orderSettings
        }
    }, req.user._id);
    
    res.success({ 
        orderSettings: settings.orderSettings 
    }, 'Order settings updated successfully');
});

// @desc    Update delivery settings
// @route   PUT /api/admin/app-settings/delivery-settings
// @access  Admin
const updateDeliverySettings = asyncHandler(async (req, res) => {
    const { deliverySettings } = req.body;
    
    const settings = await AppSettings.updateSettings({
        deliverySettings: {
            ...settings.deliverySettings,
            ...deliverySettings
        }
    }, req.user._id);
    
    res.success({ 
        deliverySettings: settings.deliverySettings 
    }, 'Delivery settings updated successfully');
});

// @desc    Update contact information
// @route   PUT /api/admin/app-settings/contact-info
// @access  Admin
const updateContactInfo = asyncHandler(async (req, res) => {
    const { contactInfo } = req.body;
    
    const settings = await AppSettings.updateSettings({
        contactInfo: {
            ...settings.contactInfo,
            ...contactInfo
        }
    }, req.user._id);
    
    res.success({ 
        contactInfo: settings.contactInfo 
    }, 'Contact information updated successfully');
});

// @desc    Update app version
// @route   PUT /api/admin/app-settings/app-version
// @access  Admin
const updateAppVersion = asyncHandler(async (req, res) => {
    const { appVersion } = req.body;
    
    const settings = await AppSettings.updateSettings({
        appVersion: {
            ...settings.appVersion,
            ...appVersion
        }
    }, req.user._id);
    
    res.success({ 
        appVersion: settings.appVersion 
    }, 'App version updated successfully');
});

// @desc    Update feature flags
// @route   PUT /api/admin/app-settings/features
// @access  Admin
const updateFeatures = asyncHandler(async (req, res) => {
    const { features } = req.body;
    
    const settings = await AppSettings.updateSettings({
        features: {
            ...settings.features,
            ...features
        }
    }, req.user._id);
    
    res.success({ 
        features: settings.features 
    }, 'Feature flags updated successfully');
});

// @desc    Reset settings to default
// @route   POST /api/admin/app-settings/reset
// @access  Admin
const resetAppSettings = asyncHandler(async (req, res) => {
    const { section } = req.body;
    
    let updates = {};
    
    switch (section) {
        case 'businessHours':
            updates.businessHours = {
                enabled: false,
                timezone: 'Asia/Kolkata',
                schedule: {
                    monday: { open: '09:00', close: '18:00', isOpen: true },
                    tuesday: { open: '09:00', close: '18:00', isOpen: true },
                    wednesday: { open: '09:00', close: '18:00', isOpen: true },
                    thursday: { open: '09:00', close: '18:00', isOpen: true },
                    friday: { open: '09:00', close: '18:00', isOpen: true },
                    saturday: { open: '09:00', close: '18:00', isOpen: true },
                    sunday: { open: '10:00', close: '17:00', isOpen: false }
                },
                outsideHoursMessage: 'We are currently closed. Please visit us during business hours.'
            };
            break;
        case 'orderSettings':
            updates.orderSettings = {
                allowOrders: true,
                minOrderAmount: 0,
                maxOrderAmount: 50000,
                allowCOD: true,
                allowOnlinePayment: true
            };
            break;
        case 'deliverySettings':
            updates.deliverySettings = {
                allowDelivery: true,
                freeDeliveryThreshold: 500,
                deliveryCharges: 50,
                estimatedDeliveryDays: { min: 2, max: 7 }
            };
            break;
        case 'features':
            updates.features = {
                enableWishlist: true,
                enableReviews: true,
                enableReferral: false,
                enableLoyaltyPoints: false,
                enableChat: false,
                enableNotifications: true
            };
            break;
        default:
            return res.error('Invalid section specified', 400);
    }
    
    const settings = await AppSettings.updateSettings(updates, req.user._id);
    
    res.success({ settings }, `${section} reset to default successfully`);
});

module.exports = {
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
};
