const SystemSettings = require('../models/SystemSettings');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all system settings
exports.getSystemSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();
    
    res.success({
        settings: settings.getFormattedSettings()
    }, 'System settings retrieved successfully');
});

// Get specific setting section
exports.getSettingSection = asyncHandler(async (req, res) => {
    const { section } = req.params;
    
    const settings = await SystemSettings.getCurrentSettings();
    const sectionData = settings[section];
    
    if (!sectionData) {
        return res.error('Setting section not found', [], 404);
    }
    
    res.success({
        section,
        settings: sectionData
    }, `${section} settings retrieved successfully`);
});

// Update system settings
exports.updateSystemSettings = asyncHandler(async (req, res) => {
    const updates = req.body;
    
    const settings = await SystemSettings.updateSettings(updates, req.user._id);
    
    res.success({
        settings: settings.getFormattedSettings()
    }, 'System settings updated successfully');
});

// Update specific setting section
exports.updateSettingSection = asyncHandler(async (req, res) => {
    const { section } = req.params;
    const updates = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    if (!(section in settings)) {
        return res.error('Setting section not found', [], 404);
    }
    
    const sectionUpdates = { [section]: updates };
    const updatedSettings = await SystemSettings.updateSettings(sectionUpdates, req.user._id);
    
    res.success({
        section,
        settings: updatedSettings[section]
    }, `${section} settings updated successfully`);
});

// Get specific setting value
exports.getSettingValue = asyncHandler(async (req, res) => {
    const { path } = req.params;
    
    const settings = await SystemSettings.getCurrentSettings();
    const value = settings.getSetting(path);
    
    if (value === null) {
        return res.error('Setting not found', [], 404);
    }
    
    res.success({
        path,
        value
    }, 'Setting value retrieved successfully');
});

// Update specific setting value
exports.updateSettingValue = asyncHandler(async (req, res) => {
    const { path } = req.params;
    const { value } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    settings.setSetting(path, value);
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        path,
        value
    }, 'Setting value updated successfully');
});

// Reset settings to default
exports.resetSettings = asyncHandler(async (req, res) => {
    const { section } = req.body;
    
    if (section) {
        // Reset specific section
        const defaultSettings = new SystemSettings();
        const sectionUpdates = { [section]: defaultSettings[section] };
        const settings = await SystemSettings.updateSettings(sectionUpdates, req.user._id);
        
        res.success({
            section,
            settings: settings[section]
        }, `${section} settings reset to default`);
    } else {
        // Reset all settings
        await SystemSettings.deleteMany({});
        const settings = await SystemSettings.getCurrentSettings();
        
        res.success({
            settings: settings.getFormattedSettings()
        }, 'All settings reset to default');
    }
});

// Export settings
exports.exportSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();
    const exportData = {
        exportedAt: new Date(),
        version: settings.version,
        settings: settings.getFormattedSettings()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="system-settings-export.json"');
    res.send(JSON.stringify(exportData, null, 2));
});

// Import settings
exports.importSettings = asyncHandler(async (req, res) => {
    const { settings: importedSettings, overwrite = false } = req.body;
    
    if (!importedSettings) {
        return res.error('Settings data is required', [], 400);
    }
    
    let settings;
    if (overwrite) {
        // Delete existing settings and create new
        await SystemSettings.deleteMany({});
        settings = await SystemSettings.create({
            ...importedSettings,
            updatedBy: req.user._id
        });
    } else {
        // Merge with existing settings
        settings = await SystemSettings.updateSettings(importedSettings, req.user._id);
    }
    
    res.success({
        settings: settings.getFormattedSettings()
    }, 'Settings imported successfully');
});

// Get settings history/audit
exports.getSettingsHistory = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        startDate,
        endDate
    } = req.query;
    
    const query = {};
    if (startDate || endDate) {
        query.lastUpdated = {};
        if (startDate) query.lastUpdated.$gte = new Date(startDate);
        if (endDate) query.lastUpdated.$lte = new Date(endDate);
    }
    
    const history = await SystemSettings.find(query)
        .populate('updatedBy', 'firstName lastName email')
        .sort({ lastUpdated: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await SystemSettings.countDocuments(query);
    
    res.success({
        history: history.map(setting => ({
            _id: setting._id,
            version: setting.version,
            lastUpdated: setting.lastUpdated,
            updatedBy: setting.updatedBy,
            createdAt: setting.createdAt
        })),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Settings history retrieved successfully');
});

// Validate settings
exports.validateSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();
    const validationResults = [];
    
    // Validate business settings
    if (!settings.business.gstin || settings.business.gstin === 'GSTIN_TO_BE_UPDATED') {
        validationResults.push({
            section: 'business',
            field: 'gstin',
            message: 'GSTIN needs to be updated',
            severity: 'warning'
        });
    }
    
    if (!settings.business.pan || settings.business.pan === 'PAN_TO_BE_UPDATED') {
        validationResults.push({
            section: 'business',
            field: 'pan',
            message: 'PAN needs to be updated',
            severity: 'warning'
        });
    }
    
    // Validate tax settings
    if (settings.tax.enableGST && (!settings.tax.companyGSTIN || settings.tax.companyGSTIN === 'GSTIN_TO_BE_UPDATED')) {
        validationResults.push({
            section: 'tax',
            field: 'companyGSTIN',
            message: 'Company GSTIN is required when GST is enabled',
            severity: 'error'
        });
    }
    
    // Validate payment settings
    if (settings.payment.enableOnlinePayment && !settings.payment.paymentGateway) {
        validationResults.push({
            section: 'payment',
            field: 'paymentGateway',
            message: 'Payment gateway configuration is required',
            severity: 'error'
        });
    }
    
    // Validate shipping settings
    if (settings.shipping.enableShiprocket && !process.env.SHIPROCKET_API_KEY) {
        validationResults.push({
            section: 'shipping',
            field: 'shiprocket',
            message: 'Shiprocket API credentials are not configured',
            severity: 'warning'
        });
    }
    
    // Validate notification settings
    if (settings.notification.enableEmailNotifications && !process.env.EMAIL_HOST) {
        validationResults.push({
            section: 'notification',
            field: 'email',
            message: 'Email service is not configured',
            severity: 'warning'
        });
    }
    
    const hasErrors = validationResults.some(result => result.severity === 'error');
    const hasWarnings = validationResults.some(result => result.severity === 'warning');
    
    res.success({
        isValid: !hasErrors,
        hasWarnings,
        validationResults,
        summary: {
            totalIssues: validationResults.length,
            errors: validationResults.filter(r => r.severity === 'error').length,
            warnings: validationResults.filter(r => r.severity === 'warning').length
        }
    }, 'Settings validation completed');
});

// Get system status
exports.getSystemStatus = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();
    
    // Check various system components
    const status = {
        database: 'connected', // MongoDB connection status
        cache: 'not_configured', // Redis/cache status
        email: process.env.EMAIL_HOST ? 'configured' : 'not_configured',
        sms: process.env.SMS_API_KEY ? 'configured' : 'not_configured',
        payment: process.env.RAZORPAY_KEY_ID ? 'configured' : 'not_configured',
        shipping: process.env.SHIPROCKET_API_KEY ? 'configured' : 'not_configured',
        storage: 'local', // File storage status
        backup: settings.backup.enableAutoBackup ? 'enabled' : 'disabled',
        maintenance: settings.general.maintenanceMode ? 'enabled' : 'disabled'
    };
    
    const overallStatus = Object.values(status).every(s => s === 'connected' || s === 'configured' || s === 'enabled' || s === 'local' || s === 'disabled') ? 'healthy' : 'needs_attention';
    
    res.success({
        overallStatus,
        components: status,
        lastChecked: new Date(),
        version: settings.version
    }, 'System status retrieved successfully');
});

module.exports = exports;
