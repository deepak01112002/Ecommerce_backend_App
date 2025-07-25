const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // General Settings
    general: {
        siteName: { type: String, default: 'Ghanshyam Murti Bhandar' },
        siteDescription: { type: String, default: 'Premium Religious Items & Spiritual Products' },
        siteUrl: { type: String, default: 'https://ghanshyammurti.com' },
        adminEmail: { type: String, default: 'admin@ghanshyammurti.com' },
        supportEmail: { type: String, default: 'support@ghanshyammurti.com' },
        contactPhone: { type: String, default: '+91-9999999999' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        currency: { type: String, default: 'INR' },
        language: { type: String, default: 'en' },
        maintenanceMode: { type: Boolean, default: false },
        maintenanceMessage: { type: String, default: 'Site is under maintenance. Please check back later.' }
    },
    
    // Business Settings
    business: {
        companyName: { type: String, default: 'Ghanshyam Murti Bhandar' },
        companyAddress: {
            street: { type: String, default: 'Shop Address' },
            city: { type: String, default: 'City' },
            state: { type: String, default: 'State' },
            postalCode: { type: String, default: '000000' },
            country: { type: String, default: 'India' }
        },
        gstin: { type: String, default: 'GSTIN_TO_BE_UPDATED' },
        pan: { type: String, default: 'PAN_TO_BE_UPDATED' },
        businessType: { type: String, default: 'retail' },
        establishedYear: { type: Number, default: 2020 }
    },
    
    // Order Settings
    order: {
        orderPrefix: { type: String, default: 'ORD' },
        orderNumberFormat: { type: String, default: 'YYYYMM####' },
        minOrderAmount: { type: Number, default: 0 },
        maxOrderAmount: { type: Number, default: 100000 },
        autoConfirmOrders: { type: Boolean, default: false },
        orderConfirmationTime: { type: Number, default: 24 }, // hours
        allowGuestCheckout: { type: Boolean, default: true },
        requirePhoneVerification: { type: Boolean, default: false },
        maxItemsPerOrder: { type: Number, default: 50 },
        orderCancellationWindow: { type: Number, default: 24 } // hours
    },
    
    // Payment Settings
    payment: {
        enableCOD: { type: Boolean, default: true },
        enableOnlinePayment: { type: Boolean, default: true },
        enableWalletPayment: { type: Boolean, default: true },
        codCharges: { type: Number, default: 0 },
        codMinAmount: { type: Number, default: 0 },
        codMaxAmount: { type: Number, default: 10000 },
        paymentGateway: { type: String, default: 'razorpay' },
        autoRefundDays: { type: Number, default: 7 },
        walletCashbackPercentage: { type: Number, default: 1 }
    },
    
    // Shipping Settings
    shipping: {
        enableFreeShipping: { type: Boolean, default: true },
        freeShippingMinAmount: { type: Number, default: 500 },
        defaultShippingCharge: { type: Number, default: 50 },
        expressShippingCharge: { type: Number, default: 100 },
        maxShippingWeight: { type: Number, default: 50 }, // kg
        shippingCalculationMethod: { type: String, default: 'weight', enum: ['weight', 'price', 'fixed'] },
        enableShiprocket: { type: Boolean, default: true },
        defaultCourierPartner: { type: String, default: 'auto' },
        packagingCharges: { type: Number, default: 0 },
        handlingCharges: { type: Number, default: 0 }
    },
    
    // Inventory Settings
    inventory: {
        enableStockManagement: { type: Boolean, default: true },
        allowBackorders: { type: Boolean, default: false },
        lowStockThreshold: { type: Number, default: 10 },
        outOfStockThreshold: { type: Number, default: 0 },
        enableStockAlerts: { type: Boolean, default: true },
        stockAlertEmail: { type: String, default: 'inventory@ghanshyammurti.com' },
        autoUpdateStock: { type: Boolean, default: true },
        reserveStockDuration: { type: Number, default: 30 } // minutes
    },
    
    // Tax Settings
    tax: {
        enableGST: { type: Boolean, default: true },
        defaultGSTRate: { type: Number, default: 18 },
        companyGSTIN: { type: String, default: 'GSTIN_TO_BE_UPDATED' },
        enableTaxInclusive: { type: Boolean, default: false },
        taxCalculationMethod: { type: String, default: 'exclusive', enum: ['inclusive', 'exclusive'] },
        enableReverseCharge: { type: Boolean, default: false },
        tdsApplicable: { type: Boolean, default: false },
        tdsRate: { type: Number, default: 0 }
    },
    
    // Notification Settings
    notification: {
        enableEmailNotifications: { type: Boolean, default: true },
        enableSMSNotifications: { type: Boolean, default: true },
        enablePushNotifications: { type: Boolean, default: true },
        emailProvider: { type: String, default: 'smtp' },
        smsProvider: { type: String, default: 'twilio' },
        notificationRetryAttempts: { type: Number, default: 3 },
        notificationRetryDelay: { type: Number, default: 5 }, // minutes
        adminNotificationEmail: { type: String, default: 'admin@ghanshyammurti.com' }
    },
    
    // Return/Refund Settings
    returnRefund: {
        enableReturns: { type: Boolean, default: true },
        returnWindow: { type: Number, default: 7 }, // days
        enableExchanges: { type: Boolean, default: true },
        exchangeWindow: { type: Number, default: 7 }, // days
        autoApproveReturns: { type: Boolean, default: false },
        returnShippingCharge: { type: Number, default: 0 },
        refundProcessingDays: { type: Number, default: 5 },
        enableStoreCredit: { type: Boolean, default: true },
        storeCreditExpiry: { type: Number, default: 365 } // days
    },
    
    // Security Settings
    security: {
        enableTwoFactorAuth: { type: Boolean, default: false },
        sessionTimeout: { type: Number, default: 30 }, // minutes
        maxLoginAttempts: { type: Number, default: 5 },
        lockoutDuration: { type: Number, default: 15 }, // minutes
        passwordMinLength: { type: Number, default: 8 },
        requirePasswordChange: { type: Boolean, default: false },
        passwordChangeInterval: { type: Number, default: 90 }, // days
        enableCaptcha: { type: Boolean, default: false }
    },
    
    // SEO Settings
    seo: {
        enableSEO: { type: Boolean, default: true },
        defaultMetaTitle: { type: String, default: 'Ghanshyam Murti Bhandar - Religious Items' },
        defaultMetaDescription: { type: String, default: 'Premium religious items and spiritual products' },
        defaultMetaKeywords: { type: String, default: 'religious items, spiritual products, murti, pooja items' },
        enableSitemap: { type: Boolean, default: true },
        enableRobotsTxt: { type: Boolean, default: true },
        googleAnalyticsId: { type: String, default: '' },
        googleTagManagerId: { type: String, default: '' },
        facebookPixelId: { type: String, default: '' }
    },
    
    // Social Media Settings
    socialMedia: {
        enableSocialLogin: { type: Boolean, default: false },
        facebookAppId: { type: String, default: '' },
        googleClientId: { type: String, default: '' },
        socialMediaLinks: {
            facebook: { type: String, default: '' },
            instagram: { type: String, default: '' },
            twitter: { type: String, default: '' },
            youtube: { type: String, default: '' },
            whatsapp: { type: String, default: '' }
        }
    },
    
    // API Settings
    api: {
        enableAPIAccess: { type: Boolean, default: true },
        apiRateLimit: { type: Number, default: 1000 }, // requests per hour
        enableAPILogging: { type: Boolean, default: true },
        apiVersion: { type: String, default: 'v1' },
        enableWebhooks: { type: Boolean, default: true },
        webhookRetryAttempts: { type: Number, default: 3 }
    },
    
    // Backup Settings
    backup: {
        enableAutoBackup: { type: Boolean, default: true },
        backupFrequency: { type: String, default: 'daily', enum: ['daily', 'weekly', 'monthly'] },
        backupRetentionDays: { type: Number, default: 30 },
        backupLocation: { type: String, default: 'local' },
        enableCloudBackup: { type: Boolean, default: false },
        cloudProvider: { type: String, default: 'aws' }
    },
    
    // Performance Settings
    performance: {
        enableCaching: { type: Boolean, default: true },
        cacheExpiry: { type: Number, default: 3600 }, // seconds
        enableCompression: { type: Boolean, default: true },
        enableCDN: { type: Boolean, default: false },
        cdnUrl: { type: String, default: '' },
        maxFileUploadSize: { type: Number, default: 10 }, // MB
        enableImageOptimization: { type: Boolean, default: true }
    },
    
    // Feature Flags
    features: {
        enableWishlist: { type: Boolean, default: true },
        enableReviews: { type: Boolean, default: true },
        enableCoupons: { type: Boolean, default: true },
        enableLoyaltyProgram: { type: Boolean, default: false },
        enableReferralProgram: { type: Boolean, default: false },
        enableMultiVendor: { type: Boolean, default: false },
        enableSubscriptions: { type: Boolean, default: false },
        enableAffiliateProgram: { type: Boolean, default: false }
    },
    
    // Metadata
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    version: { type: String, default: '1.0.0' }
}, {
    timestamps: true
});

// Static method to get current settings
systemSettingsSchema.statics.getCurrentSettings = async function() {
    let settings = await this.findOne().sort({ createdAt: -1 });
    
    if (!settings) {
        // Create default settings
        settings = await this.create({});
    }
    
    return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function(updates, updatedBy) {
    const settings = await this.getCurrentSettings();
    
    // Deep merge updates
    Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
            settings[key] = { ...settings[key], ...updates[key] };
        } else {
            settings[key] = updates[key];
        }
    });
    
    settings.lastUpdated = new Date();
    settings.updatedBy = updatedBy;
    
    await settings.save();
    return settings;
};

// Instance method to get setting value
systemSettingsSchema.methods.getSetting = function(path) {
    const keys = path.split('.');
    let value = this;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return null;
        }
    }
    
    return value;
};

// Instance method to set setting value
systemSettingsSchema.methods.setSetting = function(path, value) {
    const keys = path.split('.');
    let obj = this;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in obj) || typeof obj[key] !== 'object') {
            obj[key] = {};
        }
        obj = obj[key];
    }
    
    obj[keys[keys.length - 1]] = value;
    this.lastUpdated = new Date();
};

// Instance method to get formatted settings
systemSettingsSchema.methods.getFormattedSettings = function() {
    return {
        general: this.general,
        business: this.business,
        order: this.order,
        payment: this.payment,
        shipping: this.shipping,
        inventory: this.inventory,
        tax: this.tax,
        notification: this.notification,
        returnRefund: this.returnRefund,
        security: this.security,
        seo: this.seo,
        socialMedia: this.socialMedia,
        api: this.api,
        backup: this.backup,
        performance: this.performance,
        features: this.features,
        lastUpdated: this.lastUpdated,
        version: this.version
    };
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
