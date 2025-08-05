const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }
    next();
};

// Delivery Company validation
const validateDeliveryCompany = [
    body('name')
        .notEmpty()
        .withMessage('Company name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),
    
    body('code')
        .optional()
        .isLength({ min: 2, max: 10 })
        .withMessage('Company code must be between 2 and 10 characters')
        .isAlphanumeric()
        .withMessage('Company code must contain only letters and numbers'),
    
    body('type')
        .optional()
        .isIn(['local', 'regional', 'national', 'international'])
        .withMessage('Invalid company type'),
    
    body('contactInfo.companyPhone')
        .notEmpty()
        .withMessage('Company phone is required')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    
    body('contactInfo.companyEmail')
        .notEmpty()
        .withMessage('Company email is required')
        .isEmail()
        .withMessage('Invalid email format'),
    
    body('contactInfo.website')
        .optional()
        .isURL()
        .withMessage('Invalid website URL'),
    
    body('address.city')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('City name must be between 2 and 50 characters'),
    
    body('address.state')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('State name must be between 2 and 50 characters'),
    
    body('address.postalCode')
        .optional()
        .isPostalCode('any')
        .withMessage('Invalid postal code'),
    
    body('pricing.baseRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Base rate must be a positive number'),
    
    body('pricing.perKgRate')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Per kg rate must be a positive number'),
    
    body('pricing.codCharges')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('COD charges must be a positive number'),
    
    body('deliveryTime.estimatedDays')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Estimated delivery days must be between 1 and 30'),
    
    body('limits.maxWeight')
        .optional()
        .isFloat({ min: 0.1 })
        .withMessage('Maximum weight must be greater than 0.1 kg'),
    
    body('status')
        .optional()
        .isIn(['active', 'inactive', 'suspended', 'pending_approval'])
        .withMessage('Invalid status'),
    
    handleValidationErrors
];

// Product validation
const validateProduct = [
    body('name')
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ min: 2, max: 200 })
        .withMessage('Product name must be between 2 and 200 characters'),
    
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    
    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    
    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isMongoId()
        .withMessage('Invalid category ID'),
    
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    
    body('weight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Weight must be a positive number'),
    
    body('height')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Height must be a positive number'),
    
    handleValidationErrors
];

// Category validation
const validateCategory = [
    body('name')
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),
    
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    
    body('parent')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent category ID'),
    
    handleValidationErrors
];

// User validation
const validateUser = [
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format'),
    
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    handleValidationErrors
];

// Order validation
const validateOrder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    
    body('items.*.product')
        .isMongoId()
        .withMessage('Invalid product ID'),
    
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    
    body('shippingAddress.fullName')
        .notEmpty()
        .withMessage('Full name is required for shipping address'),
    
    body('shippingAddress.phone')
        .notEmpty()
        .withMessage('Phone number is required for shipping address')
        .isMobilePhone('any')
        .withMessage('Invalid phone number format'),
    
    body('shippingAddress.addressLine1')
        .notEmpty()
        .withMessage('Address line 1 is required'),
    
    body('shippingAddress.city')
        .notEmpty()
        .withMessage('City is required'),
    
    body('shippingAddress.state')
        .notEmpty()
        .withMessage('State is required'),
    
    body('shippingAddress.postalCode')
        .notEmpty()
        .withMessage('Postal code is required')
        .isPostalCode('any')
        .withMessage('Invalid postal code'),
    
    handleValidationErrors
];

// Coupon validation
const validateCoupon = [
    body('code')
        .notEmpty()
        .withMessage('Coupon code is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Coupon code must be between 3 and 20 characters')
        .isAlphanumeric()
        .withMessage('Coupon code must contain only letters and numbers'),
    
    body('discountType')
        .isIn(['percentage', 'fixed'])
        .withMessage('Discount type must be either percentage or fixed'),
    
    body('discountValue')
        .isFloat({ min: 0 })
        .withMessage('Discount value must be a positive number'),
    
    body('minimumOrderAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum order amount must be a positive number'),
    
    body('maxUsage')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Maximum usage must be at least 1'),
    
    body('validFrom')
        .isISO8601()
        .withMessage('Valid from date must be in ISO format'),
    
    body('validUntil')
        .isISO8601()
        .withMessage('Valid until date must be in ISO format'),
    
    handleValidationErrors
];

module.exports = {
    validateDeliveryCompany,
    validateProduct,
    validateCategory,
    validateUser,
    validateOrder,
    validateCoupon,
    handleValidationErrors
};
