const SystemSettings = require('../models/SystemSettings');
const GSTConfig = require('../models/GSTConfig');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all business settings
exports.getBusinessSettings = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();
    const gstConfig = await GSTConfig.getCurrentConfig();
    
    res.success({
        businessSettings: {
            general: settings.general,
            business: settings.business,
            tax: settings.tax,
            gst: gstConfig || null
        }
    }, 'Business settings retrieved successfully');
});

// Update company information
exports.updateCompanyInfo = asyncHandler(async (req, res) => {
    const {
        companyName,
        companyAddress,
        gstin,
        pan,
        businessType,
        establishedYear,
        contactPhone,
        adminEmail,
        supportEmail
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update business info
    if (companyName) settings.business.companyName = companyName;
    if (companyAddress) settings.business.companyAddress = { ...settings.business.companyAddress, ...companyAddress };
    if (gstin) settings.business.gstin = gstin;
    if (pan) settings.business.pan = pan;
    if (businessType) settings.business.businessType = businessType;
    if (establishedYear) settings.business.establishedYear = establishedYear;
    
    // Update general info
    if (contactPhone) settings.general.contactPhone = contactPhone;
    if (adminEmail) settings.general.adminEmail = adminEmail;
    if (supportEmail) settings.general.supportEmail = supportEmail;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        companyInfo: {
            general: settings.general,
            business: settings.business
        }
    }, 'Company information updated successfully');
});

// Update GST settings
exports.updateGSTSettings = asyncHandler(async (req, res) => {
    const {
        enableGST,
        defaultGSTRate,
        companyGSTIN,
        enableTaxInclusive,
        taxCalculationMethod,
        enableReverseCharge,
        tdsApplicable,
        tdsRate
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update tax settings
    if (enableGST !== undefined) settings.tax.enableGST = enableGST;
    if (defaultGSTRate !== undefined) settings.tax.defaultGSTRate = defaultGSTRate;
    if (companyGSTIN) settings.tax.companyGSTIN = companyGSTIN;
    if (enableTaxInclusive !== undefined) settings.tax.enableTaxInclusive = enableTaxInclusive;
    if (taxCalculationMethod) settings.tax.taxCalculationMethod = taxCalculationMethod;
    if (enableReverseCharge !== undefined) settings.tax.enableReverseCharge = enableReverseCharge;
    if (tdsApplicable !== undefined) settings.tax.tdsApplicable = tdsApplicable;
    if (tdsRate !== undefined) settings.tax.tdsRate = tdsRate;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    // Update GST Config if GSTIN is provided
    if (companyGSTIN) {
        let gstConfig = await GSTConfig.getCurrentConfig();
        if (!gstConfig) {
            gstConfig = new GSTConfig();
        }
        gstConfig.companyGSTDetails.gstin = companyGSTIN;
        gstConfig.lastUpdatedBy = req.user._id;
        await gstConfig.save();
    }
    
    res.success({
        gstSettings: settings.tax
    }, 'GST settings updated successfully');
});

// Update order settings
exports.updateOrderSettings = asyncHandler(async (req, res) => {
    const {
        orderPrefix,
        orderNumberFormat,
        minOrderAmount,
        maxOrderAmount,
        autoConfirmOrders,
        orderConfirmationTime,
        allowGuestCheckout,
        requirePhoneVerification,
        maxItemsPerOrder,
        orderCancellationWindow
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update order settings
    if (orderPrefix) settings.order.orderPrefix = orderPrefix;
    if (orderNumberFormat) settings.order.orderNumberFormat = orderNumberFormat;
    if (minOrderAmount !== undefined) settings.order.minOrderAmount = minOrderAmount;
    if (maxOrderAmount !== undefined) settings.order.maxOrderAmount = maxOrderAmount;
    if (autoConfirmOrders !== undefined) settings.order.autoConfirmOrders = autoConfirmOrders;
    if (orderConfirmationTime !== undefined) settings.order.orderConfirmationTime = orderConfirmationTime;
    if (allowGuestCheckout !== undefined) settings.order.allowGuestCheckout = allowGuestCheckout;
    if (requirePhoneVerification !== undefined) settings.order.requirePhoneVerification = requirePhoneVerification;
    if (maxItemsPerOrder !== undefined) settings.order.maxItemsPerOrder = maxItemsPerOrder;
    if (orderCancellationWindow !== undefined) settings.order.orderCancellationWindow = orderCancellationWindow;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        orderSettings: settings.order
    }, 'Order settings updated successfully');
});

// Update payment settings
exports.updatePaymentSettings = asyncHandler(async (req, res) => {
    const {
        enableCOD,
        enableOnlinePayment,
        enableWalletPayment,
        codCharges,
        codMinAmount,
        codMaxAmount,
        paymentGateway,
        autoRefundDays,
        walletCashbackPercentage
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update payment settings
    if (enableCOD !== undefined) settings.payment.enableCOD = enableCOD;
    if (enableOnlinePayment !== undefined) settings.payment.enableOnlinePayment = enableOnlinePayment;
    if (enableWalletPayment !== undefined) settings.payment.enableWalletPayment = enableWalletPayment;
    if (codCharges !== undefined) settings.payment.codCharges = codCharges;
    if (codMinAmount !== undefined) settings.payment.codMinAmount = codMinAmount;
    if (codMaxAmount !== undefined) settings.payment.codMaxAmount = codMaxAmount;
    if (paymentGateway) settings.payment.paymentGateway = paymentGateway;
    if (autoRefundDays !== undefined) settings.payment.autoRefundDays = autoRefundDays;
    if (walletCashbackPercentage !== undefined) settings.payment.walletCashbackPercentage = walletCashbackPercentage;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        paymentSettings: settings.payment
    }, 'Payment settings updated successfully');
});

// Update shipping settings
exports.updateShippingSettings = asyncHandler(async (req, res) => {
    const {
        enableFreeShipping,
        freeShippingMinAmount,
        defaultShippingCharge,
        expressShippingCharge,
        maxShippingWeight,
        shippingCalculationMethod,
        enableShiprocket,
        defaultCourierPartner,
        packagingCharges,
        handlingCharges
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update shipping settings
    if (enableFreeShipping !== undefined) settings.shipping.enableFreeShipping = enableFreeShipping;
    if (freeShippingMinAmount !== undefined) settings.shipping.freeShippingMinAmount = freeShippingMinAmount;
    if (defaultShippingCharge !== undefined) settings.shipping.defaultShippingCharge = defaultShippingCharge;
    if (expressShippingCharge !== undefined) settings.shipping.expressShippingCharge = expressShippingCharge;
    if (maxShippingWeight !== undefined) settings.shipping.maxShippingWeight = maxShippingWeight;
    if (shippingCalculationMethod) settings.shipping.shippingCalculationMethod = shippingCalculationMethod;
    if (enableShiprocket !== undefined) settings.shipping.enableShiprocket = enableShiprocket;
    if (defaultCourierPartner) settings.shipping.defaultCourierPartner = defaultCourierPartner;
    if (packagingCharges !== undefined) settings.shipping.packagingCharges = packagingCharges;
    if (handlingCharges !== undefined) settings.shipping.handlingCharges = handlingCharges;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        shippingSettings: settings.shipping
    }, 'Shipping settings updated successfully');
});

// Update inventory settings
exports.updateInventorySettings = asyncHandler(async (req, res) => {
    const {
        enableStockManagement,
        allowBackorders,
        lowStockThreshold,
        outOfStockThreshold,
        enableStockAlerts,
        stockAlertEmail,
        autoUpdateStock,
        reserveStockDuration
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update inventory settings
    if (enableStockManagement !== undefined) settings.inventory.enableStockManagement = enableStockManagement;
    if (allowBackorders !== undefined) settings.inventory.allowBackorders = allowBackorders;
    if (lowStockThreshold !== undefined) settings.inventory.lowStockThreshold = lowStockThreshold;
    if (outOfStockThreshold !== undefined) settings.inventory.outOfStockThreshold = outOfStockThreshold;
    if (enableStockAlerts !== undefined) settings.inventory.enableStockAlerts = enableStockAlerts;
    if (stockAlertEmail) settings.inventory.stockAlertEmail = stockAlertEmail;
    if (autoUpdateStock !== undefined) settings.inventory.autoUpdateStock = autoUpdateStock;
    if (reserveStockDuration !== undefined) settings.inventory.reserveStockDuration = reserveStockDuration;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        inventorySettings: settings.inventory
    }, 'Inventory settings updated successfully');
});

// Update return/refund settings
exports.updateReturnRefundSettings = asyncHandler(async (req, res) => {
    const {
        enableReturns,
        returnWindow,
        enableExchanges,
        exchangeWindow,
        autoApproveReturns,
        returnShippingCharge,
        refundProcessingDays,
        enableStoreCredit,
        storeCreditExpiry
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update return/refund settings
    if (enableReturns !== undefined) settings.returnRefund.enableReturns = enableReturns;
    if (returnWindow !== undefined) settings.returnRefund.returnWindow = returnWindow;
    if (enableExchanges !== undefined) settings.returnRefund.enableExchanges = enableExchanges;
    if (exchangeWindow !== undefined) settings.returnRefund.exchangeWindow = exchangeWindow;
    if (autoApproveReturns !== undefined) settings.returnRefund.autoApproveReturns = autoApproveReturns;
    if (returnShippingCharge !== undefined) settings.returnRefund.returnShippingCharge = returnShippingCharge;
    if (refundProcessingDays !== undefined) settings.returnRefund.refundProcessingDays = refundProcessingDays;
    if (enableStoreCredit !== undefined) settings.returnRefund.enableStoreCredit = enableStoreCredit;
    if (storeCreditExpiry !== undefined) settings.returnRefund.storeCreditExpiry = storeCreditExpiry;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        returnRefundSettings: settings.returnRefund
    }, 'Return/Refund settings updated successfully');
});

// Update notification settings
exports.updateNotificationSettings = asyncHandler(async (req, res) => {
    const {
        enableEmailNotifications,
        enableSMSNotifications,
        enablePushNotifications,
        emailProvider,
        smsProvider,
        notificationRetryAttempts,
        notificationRetryDelay,
        adminNotificationEmail
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update notification settings
    if (enableEmailNotifications !== undefined) settings.notification.enableEmailNotifications = enableEmailNotifications;
    if (enableSMSNotifications !== undefined) settings.notification.enableSMSNotifications = enableSMSNotifications;
    if (enablePushNotifications !== undefined) settings.notification.enablePushNotifications = enablePushNotifications;
    if (emailProvider) settings.notification.emailProvider = emailProvider;
    if (smsProvider) settings.notification.smsProvider = smsProvider;
    if (notificationRetryAttempts !== undefined) settings.notification.notificationRetryAttempts = notificationRetryAttempts;
    if (notificationRetryDelay !== undefined) settings.notification.notificationRetryDelay = notificationRetryDelay;
    if (adminNotificationEmail) settings.notification.adminNotificationEmail = adminNotificationEmail;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        notificationSettings: settings.notification
    }, 'Notification settings updated successfully');
});

// Update feature flags
exports.updateFeatureFlags = asyncHandler(async (req, res) => {
    const {
        enableWishlist,
        enableReviews,
        enableCoupons,
        enableLoyaltyProgram,
        enableReferralProgram,
        enableMultiVendor,
        enableSubscriptions,
        enableAffiliateProgram
    } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    
    // Update feature flags
    if (enableWishlist !== undefined) settings.features.enableWishlist = enableWishlist;
    if (enableReviews !== undefined) settings.features.enableReviews = enableReviews;
    if (enableCoupons !== undefined) settings.features.enableCoupons = enableCoupons;
    if (enableLoyaltyProgram !== undefined) settings.features.enableLoyaltyProgram = enableLoyaltyProgram;
    if (enableReferralProgram !== undefined) settings.features.enableReferralProgram = enableReferralProgram;
    if (enableMultiVendor !== undefined) settings.features.enableMultiVendor = enableMultiVendor;
    if (enableSubscriptions !== undefined) settings.features.enableSubscriptions = enableSubscriptions;
    if (enableAffiliateProgram !== undefined) settings.features.enableAffiliateProgram = enableAffiliateProgram;
    
    settings.updatedBy = req.user._id;
    await settings.save();
    
    res.success({
        features: settings.features
    }, 'Feature flags updated successfully');
});

module.exports = exports;
