const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const businessSettingsController = require('../controllers/businessSettingsController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All business settings routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all business settings
router.get('/',
    businessSettingsController.getBusinessSettings
);

// Update company information
router.put('/company',
    [
        body('companyName').optional().isString().withMessage('Company name must be string'),
        body('companyAddress.street').optional().isString().withMessage('Street must be string'),
        body('companyAddress.city').optional().isString().withMessage('City must be string'),
        body('companyAddress.state').optional().isString().withMessage('State must be string'),
        body('companyAddress.postalCode').optional().isString().withMessage('Postal code must be string'),
        body('gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
        body('pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
        body('businessType').optional().isString().withMessage('Business type must be string'),
        body('establishedYear').optional().isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid established year'),
        body('contactPhone').optional().isString().withMessage('Contact phone must be string'),
        body('adminEmail').optional().isEmail().withMessage('Invalid admin email'),
        body('supportEmail').optional().isEmail().withMessage('Invalid support email')
    ],
    validateRequest,
    businessSettingsController.updateCompanyInfo
);

// Update GST settings
router.put('/gst',
    [
        body('enableGST').optional().isBoolean().withMessage('Enable GST must be boolean'),
        body('defaultGSTRate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
        body('companyGSTIN').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
        body('enableTaxInclusive').optional().isBoolean().withMessage('Enable tax inclusive must be boolean'),
        body('taxCalculationMethod').optional().isIn(['inclusive', 'exclusive']).withMessage('Invalid tax calculation method'),
        body('enableReverseCharge').optional().isBoolean().withMessage('Enable reverse charge must be boolean'),
        body('tdsApplicable').optional().isBoolean().withMessage('TDS applicable must be boolean'),
        body('tdsRate').optional().isFloat({ min: 0, max: 100 }).withMessage('TDS rate must be between 0 and 100')
    ],
    validateRequest,
    businessSettingsController.updateGSTSettings
);

// Update order settings
router.put('/orders',
    [
        body('orderPrefix').optional().isString().withMessage('Order prefix must be string'),
        body('orderNumberFormat').optional().isString().withMessage('Order number format must be string'),
        body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('Min order amount must be positive'),
        body('maxOrderAmount').optional().isFloat({ min: 0 }).withMessage('Max order amount must be positive'),
        body('autoConfirmOrders').optional().isBoolean().withMessage('Auto confirm orders must be boolean'),
        body('orderConfirmationTime').optional().isInt({ min: 1 }).withMessage('Order confirmation time must be positive'),
        body('allowGuestCheckout').optional().isBoolean().withMessage('Allow guest checkout must be boolean'),
        body('requirePhoneVerification').optional().isBoolean().withMessage('Require phone verification must be boolean'),
        body('maxItemsPerOrder').optional().isInt({ min: 1 }).withMessage('Max items per order must be positive'),
        body('orderCancellationWindow').optional().isInt({ min: 0 }).withMessage('Order cancellation window must be non-negative')
    ],
    validateRequest,
    businessSettingsController.updateOrderSettings
);

// Update payment settings
router.put('/payments',
    [
        body('enableCOD').optional().isBoolean().withMessage('Enable COD must be boolean'),
        body('enableOnlinePayment').optional().isBoolean().withMessage('Enable online payment must be boolean'),
        body('enableWalletPayment').optional().isBoolean().withMessage('Enable wallet payment must be boolean'),
        body('codCharges').optional().isFloat({ min: 0 }).withMessage('COD charges must be non-negative'),
        body('codMinAmount').optional().isFloat({ min: 0 }).withMessage('COD min amount must be non-negative'),
        body('codMaxAmount').optional().isFloat({ min: 0 }).withMessage('COD max amount must be non-negative'),
        body('paymentGateway').optional().isString().withMessage('Payment gateway must be string'),
        body('autoRefundDays').optional().isInt({ min: 1 }).withMessage('Auto refund days must be positive'),
        body('walletCashbackPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Wallet cashback percentage must be between 0 and 100')
    ],
    validateRequest,
    businessSettingsController.updatePaymentSettings
);

// Update shipping settings
router.put('/shipping',
    [
        body('enableFreeShipping').optional().isBoolean().withMessage('Enable free shipping must be boolean'),
        body('freeShippingMinAmount').optional().isFloat({ min: 0 }).withMessage('Free shipping min amount must be non-negative'),
        body('defaultShippingCharge').optional().isFloat({ min: 0 }).withMessage('Default shipping charge must be non-negative'),
        body('expressShippingCharge').optional().isFloat({ min: 0 }).withMessage('Express shipping charge must be non-negative'),
        body('maxShippingWeight').optional().isFloat({ min: 0 }).withMessage('Max shipping weight must be non-negative'),
        body('shippingCalculationMethod').optional().isIn(['weight', 'price', 'fixed']).withMessage('Invalid shipping calculation method'),
        body('enableShiprocket').optional().isBoolean().withMessage('Enable Shiprocket must be boolean'),
        body('defaultCourierPartner').optional().isString().withMessage('Default courier partner must be string'),
        body('packagingCharges').optional().isFloat({ min: 0 }).withMessage('Packaging charges must be non-negative'),
        body('handlingCharges').optional().isFloat({ min: 0 }).withMessage('Handling charges must be non-negative')
    ],
    validateRequest,
    businessSettingsController.updateShippingSettings
);

// Update inventory settings
router.put('/inventory',
    [
        body('enableStockManagement').optional().isBoolean().withMessage('Enable stock management must be boolean'),
        body('allowBackorders').optional().isBoolean().withMessage('Allow backorders must be boolean'),
        body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be non-negative'),
        body('outOfStockThreshold').optional().isInt({ min: 0 }).withMessage('Out of stock threshold must be non-negative'),
        body('enableStockAlerts').optional().isBoolean().withMessage('Enable stock alerts must be boolean'),
        body('stockAlertEmail').optional().isEmail().withMessage('Invalid stock alert email'),
        body('autoUpdateStock').optional().isBoolean().withMessage('Auto update stock must be boolean'),
        body('reserveStockDuration').optional().isInt({ min: 1 }).withMessage('Reserve stock duration must be positive')
    ],
    validateRequest,
    businessSettingsController.updateInventorySettings
);

// Update return/refund settings
router.put('/returns',
    [
        body('enableReturns').optional().isBoolean().withMessage('Enable returns must be boolean'),
        body('returnWindow').optional().isInt({ min: 1 }).withMessage('Return window must be positive'),
        body('enableExchanges').optional().isBoolean().withMessage('Enable exchanges must be boolean'),
        body('exchangeWindow').optional().isInt({ min: 1 }).withMessage('Exchange window must be positive'),
        body('autoApproveReturns').optional().isBoolean().withMessage('Auto approve returns must be boolean'),
        body('returnShippingCharge').optional().isFloat({ min: 0 }).withMessage('Return shipping charge must be non-negative'),
        body('refundProcessingDays').optional().isInt({ min: 1 }).withMessage('Refund processing days must be positive'),
        body('enableStoreCredit').optional().isBoolean().withMessage('Enable store credit must be boolean'),
        body('storeCreditExpiry').optional().isInt({ min: 1 }).withMessage('Store credit expiry must be positive')
    ],
    validateRequest,
    businessSettingsController.updateReturnRefundSettings
);

// Update notification settings
router.put('/notifications',
    [
        body('enableEmailNotifications').optional().isBoolean().withMessage('Enable email notifications must be boolean'),
        body('enableSMSNotifications').optional().isBoolean().withMessage('Enable SMS notifications must be boolean'),
        body('enablePushNotifications').optional().isBoolean().withMessage('Enable push notifications must be boolean'),
        body('emailProvider').optional().isString().withMessage('Email provider must be string'),
        body('smsProvider').optional().isString().withMessage('SMS provider must be string'),
        body('notificationRetryAttempts').optional().isInt({ min: 1 }).withMessage('Notification retry attempts must be positive'),
        body('notificationRetryDelay').optional().isInt({ min: 1 }).withMessage('Notification retry delay must be positive'),
        body('adminNotificationEmail').optional().isEmail().withMessage('Invalid admin notification email')
    ],
    validateRequest,
    businessSettingsController.updateNotificationSettings
);

// Update feature flags
router.put('/features',
    [
        body('enableWishlist').optional().isBoolean().withMessage('Enable wishlist must be boolean'),
        body('enableReviews').optional().isBoolean().withMessage('Enable reviews must be boolean'),
        body('enableCoupons').optional().isBoolean().withMessage('Enable coupons must be boolean'),
        body('enableLoyaltyProgram').optional().isBoolean().withMessage('Enable loyalty program must be boolean'),
        body('enableReferralProgram').optional().isBoolean().withMessage('Enable referral program must be boolean'),
        body('enableMultiVendor').optional().isBoolean().withMessage('Enable multi vendor must be boolean'),
        body('enableSubscriptions').optional().isBoolean().withMessage('Enable subscriptions must be boolean'),
        body('enableAffiliateProgram').optional().isBoolean().withMessage('Enable affiliate program must be boolean')
    ],
    validateRequest,
    businessSettingsController.updateFeatureFlags
);

module.exports = router;
