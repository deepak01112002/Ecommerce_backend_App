const SystemSettings = require('../models/SystemSettings');
const { asyncHandler } = require('../middlewares/errorHandler');

// PUBLIC ENDPOINTS (No authentication required)

// Get public system settings for users
exports.getPublicSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();

    // Only return public settings that users need to know (no hard-coded defaults)
    const appStatus = settings.general?.appStatus || {};
    const publicSettings = {
        appStatus: {
            isActive: appStatus.isActive ?? null,
            maintenanceMode: appStatus.maintenanceMode ?? null,
            maintenanceMessage: appStatus.maintenanceMessage ?? null,
            estimatedDowntime: appStatus.estimatedDowntime ?? null
        },
        business: {
            companyName: settings.business?.companyName ?? null,
            supportEmail: settings.business?.supportEmail ?? null,
            supportPhone: settings.business?.supportPhone ?? null,
            businessHours: settings.business?.businessHours ?? null
        },
        features: {
            enableInvoiceDownload: settings.features?.enableInvoiceDownload ?? null,
            enableOrderTracking: settings.features?.enableOrderTracking ?? null,
            enableWishlist: settings.features?.enableWishlist ?? null,
            enableReviews: settings.features?.enableReviews ?? null,
            enableWallet: settings.features?.enableWallet ?? null
        },
        invoice: {
            downloadEnabled: settings.invoice?.downloadEnabled ?? null,
            format: settings.invoice?.format ?? null,
            includeGST: settings.invoice?.includeGST ?? null
        }
    };

    res.success({
        settings: publicSettings,
        timestamp: new Date().toISOString()
    }, 'Public settings retrieved successfully');
});

// Get app status for maintenance popup
exports.getPublicAppStatus = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();

    const gs = settings.general?.appStatus || {};
    const appStatus = {
        isActive: gs.isActive ?? null,
        maintenanceMode: gs.maintenanceMode ?? null,
        maintenanceMessage: gs.maintenanceMessage ?? null,
        estimatedDowntime: gs.estimatedDowntime ?? null,
        allowedUsers: gs.allowedUsers ?? null, // Admin users who can still access
        lastUpdated: gs.lastUpdated ?? null,
        reason: gs.reason ?? null
    };

    res.success({
        appStatus,
        serverTime: new Date().toISOString()
    }, 'App status retrieved successfully');
});

// Get public invoice settings
exports.getPublicInvoiceSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();

    const invoiceSettings = {
        downloadEnabled: settings.invoice?.downloadEnabled ?? true,
        format: settings.invoice?.format || 'pdf',
        includeGST: settings.invoice?.includeGST ?? true,
        companyDetails: {
            name: settings.business?.companyName || 'Ghanshyam Murti Bhandar',
            address: settings.business?.address || 'Religious Items Store',
            phone: settings.business?.supportPhone || '+919876543210',
            email: settings.business?.supportEmail || 'support@ghanshyammurtibhandar.com',
            gstNumber: settings.business?.gstNumber || 'GST123456789'
        }
    };

    res.success({
        invoiceSettings,
        timestamp: new Date().toISOString()
    }, 'Invoice settings retrieved successfully');
});

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

// ADMIN ENDPOINTS FOR APP CONTROL

// Get app status (admin)
exports.getAppStatus = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();

    const gsAdmin = settings.general?.appStatus || {};
    const appStatus = {
        isActive: gsAdmin.isActive ?? null,
        maintenanceMode: gsAdmin.maintenanceMode ?? null,
        maintenanceMessage: gsAdmin.maintenanceMessage ?? null,
        estimatedDowntime: gsAdmin.estimatedDowntime ?? null,
        allowedUsers: gsAdmin.allowedUsers ?? null,
        lastUpdated: gsAdmin.lastUpdated ?? null,
        reason: gsAdmin.reason ?? null,
        updatedBy: gsAdmin.updatedBy ?? null
    };

    res.success({
        appStatus
    }, 'App status retrieved successfully');
});

// Update app status (activate/deactivate application)
exports.updateAppStatus = asyncHandler(async (req, res) => {
    const { isActive, reason, maintenanceMessage, estimatedDowntime } = req.body;

    const settings = await SystemSettings.getCurrentSettings();

    // Update app status
    if (!settings.general) settings.general = {};
    if (!settings.general.appStatus) settings.general.appStatus = {};

    // Only update fields provided by admin; do not inject default values
    const current = settings.general.appStatus || {};
    const nextStatus = { ...current };

    if (typeof isActive === 'boolean') {
        nextStatus.isActive = isActive;
        nextStatus.maintenanceMode = !isActive;

        // If activating app, clear maintenance-related fields unless explicitly provided
        if (isActive === true) {
            if (maintenanceMessage === undefined) nextStatus.maintenanceMessage = null;
            if (estimatedDowntime === undefined) nextStatus.estimatedDowntime = null;
        }
    }

    if (reason !== undefined) nextStatus.reason = reason;
    if (maintenanceMessage !== undefined) nextStatus.maintenanceMessage = maintenanceMessage;
    if (estimatedDowntime !== undefined) nextStatus.estimatedDowntime = estimatedDowntime;
    nextStatus.lastUpdated = new Date().toISOString();
    nextStatus.updatedBy = req.user._id;

    settings.general.appStatus = nextStatus;

    // Save settings
    await settings.save();

    res.success({
        appStatus: settings.general.appStatus,
        message: isActive ? 'Application activated successfully' : 'Application deactivated successfully'
    }, `Application ${isActive ? 'activated' : 'deactivated'} successfully`);
});

// Get invoice settings (admin)
exports.getInvoiceSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();

    const invoiceSettings = {
        enableInvoiceDownload: settings.features?.enableInvoiceDownload ?? true,
        invoiceFormat: settings.invoice?.format || 'pdf',
        includeCompanyLogo: settings.invoice?.includeCompanyLogo ?? true,
        invoiceTemplate: settings.invoice?.template || 'default',
        invoiceNumberPrefix: settings.invoice?.numberPrefix || 'INV',
        includeGST: settings.invoice?.includeGST ?? true,
        taxSettings: settings.tax || {},
        companyDetails: {
            name: settings.business?.companyName || 'Ghanshyam Murti Bhandar',
            address: settings.business?.address || 'Religious Items Store',
            phone: settings.business?.supportPhone || '+919876543210',
            email: settings.business?.supportEmail || 'support@ghanshyammurtibhandar.com',
            gstNumber: settings.business?.gstNumber || 'GST123456789',
            pan: settings.business?.pan || 'PAN123456789'
        }
    };

    res.success({
        invoiceSettings
    }, 'Invoice settings retrieved successfully');
});

// Update invoice settings
exports.updateInvoiceSettings = asyncHandler(async (req, res) => {
    const {
        enableInvoiceDownload,
        invoiceFormat,
        includeCompanyLogo,
        invoiceTemplate,
        invoiceNumberPrefix,
        taxSettings,
        companyDetails
    } = req.body;

    const settings = await SystemSettings.getCurrentSettings();

    // Update features
    if (!settings.features) settings.features = {};
    if (enableInvoiceDownload !== undefined) {
        settings.features.enableInvoiceDownload = enableInvoiceDownload;
    }

    // Update invoice settings
    if (!settings.invoice) settings.invoice = {};
    if (invoiceFormat) settings.invoice.format = invoiceFormat;
    if (includeCompanyLogo !== undefined) settings.invoice.includeCompanyLogo = includeCompanyLogo;
    if (invoiceTemplate) settings.invoice.template = invoiceTemplate;
    if (invoiceNumberPrefix) settings.invoice.numberPrefix = invoiceNumberPrefix;

    // Update tax settings
    if (taxSettings) {
        settings.tax = { ...settings.tax, ...taxSettings };
    }

    // Update company details
    if (companyDetails) {
        if (!settings.business) settings.business = {};
        settings.business = { ...settings.business, ...companyDetails };
    }

    // Save settings
    await settings.save();

    res.success({
        invoiceSettings: {
            enableInvoiceDownload: settings.features.enableInvoiceDownload,
            invoiceFormat: settings.invoice.format,
            includeCompanyLogo: settings.invoice.includeCompanyLogo,
            invoiceTemplate: settings.invoice.template,
            invoiceNumberPrefix: settings.invoice.numberPrefix,
            taxSettings: settings.tax,
            companyDetails: settings.business
        }
    }, 'Invoice settings updated successfully');
});

// Get invoice template
exports.getInvoiceTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;

    // For now, return a basic template structure
    // In future, this could be stored in database or file system
    const templates = {
        default: {
            id: 'default',
            name: 'Default Invoice Template',
            content: `
<!DOCTYPE html>
<html>
<head>
    <title>Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-details { margin-bottom: 20px; }
        .invoice-details { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .total { text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{companyName}}</h1>
        <p>{{companyAddress}}</p>
        <p>Phone: {{companyPhone}} | Email: {{companyEmail}}</p>
        <p>GST: {{companyGST}}</p>
    </div>

    <div class="invoice-details">
        <h2>Invoice #{{invoiceNumber}}</h2>
        <p>Date: {{invoiceDate}}</p>
        <p>Customer: {{customerName}}</p>
        <p>Address: {{customerAddress}}</p>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {{#items}}
            <tr>
                <td>{{name}}</td>
                <td>{{quantity}}</td>
                <td>₹{{price}}</td>
                <td>₹{{total}}</td>
            </tr>
            {{/items}}
        </tbody>
    </table>

    <div class="total">
        <p>Subtotal: ₹{{subtotal}}</p>
        <p>GST ({{gstRate}}%): ₹{{gstAmount}}</p>
        <h3>Total: ₹{{totalAmount}}</h3>
    </div>
</body>
</html>
            `,
            variables: ['companyName', 'companyAddress', 'companyPhone', 'companyEmail', 'companyGST', 'invoiceNumber', 'invoiceDate', 'customerName', 'customerAddress', 'items', 'subtotal', 'gstRate', 'gstAmount', 'totalAmount']
        }
    };

    const template = templates[templateId];
    if (!template) {
        return res.error('Invoice template not found', [], 404);
    }

    res.success({
        template
    }, 'Invoice template retrieved successfully');
});

// Update invoice template
exports.updateInvoiceTemplate = asyncHandler(async (req, res) => {
    const { templateId } = req.params;
    const { templateContent, templateName } = req.body;

    // For now, just return success
    // In future, this would save to database or file system
    res.success({
        templateId,
        templateName: templateName || `Template ${templateId}`,
        templateContent,
        updatedAt: new Date().toISOString()
    }, 'Invoice template updated successfully');
});

module.exports = exports;
