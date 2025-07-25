const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Validate coupon (public - for checkout)
router.post('/validate',
    [
        body('code').notEmpty().withMessage('Coupon code is required'),
        body('orderAmount').isNumeric().withMessage('Order amount must be a number'),
        body('cartItems').isArray().withMessage('Cart items must be an array')
    ],
    couponController.validateCoupon
);

// Apply coupon (increment usage count)
router.post('/apply',
    [
        body('code').notEmpty().withMessage('Coupon code is required')
    ],
    couponController.applyCoupon
);

// Get active coupons (public)
router.get('/', couponController.getActiveCoupons);

// Admin routes
// Get all coupons (admin only)
router.get('/admin', adminMiddleware, couponController.getCoupons);

// Create coupon (admin only)
router.post('/',
    adminMiddleware,
    [
        body('code').notEmpty().withMessage('Coupon code is required'),
        body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
        body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
        body('discountValue').isNumeric({ min: 0 }).withMessage('Discount value must be a positive number'),
        body('minimumOrderAmount').optional().isNumeric({ min: 0 }).withMessage('Minimum order amount must be a positive number'),
        body('maximumDiscountAmount').optional().isNumeric({ min: 0 }).withMessage('Maximum discount amount must be a positive number'),
        body('validFrom').isISO8601().withMessage('Valid from date is required'),
        body('validUntil').isISO8601().withMessage('Valid until date is required'),
        body('usageLimit').optional().isInt({ min: 1 }).withMessage('Usage limit must be a positive integer'),
        body('userUsageLimit').optional().isInt({ min: 1 }).withMessage('User usage limit must be a positive integer'),
        body('applicableCategories').optional().isArray().withMessage('Applicable categories must be an array'),
        body('applicableProducts').optional().isArray().withMessage('Applicable products must be an array')
    ],
    couponController.createCoupon
);

// Update coupon (admin only)
router.put('/:couponId',
    adminMiddleware,
    [
        body('code').optional().notEmpty().withMessage('Coupon code cannot be empty'),
        body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
        body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
        body('discountValue').optional().isNumeric({ min: 0 }).withMessage('Discount value must be a positive number'),
        body('minimumOrderAmount').optional().isNumeric({ min: 0 }).withMessage('Minimum order amount must be a positive number'),
        body('maximumDiscountAmount').optional().isNumeric({ min: 0 }).withMessage('Maximum discount amount must be a positive number'),
        body('validFrom').optional().isISO8601().withMessage('Valid from date must be a valid date'),
        body('validUntil').optional().isISO8601().withMessage('Valid until date must be a valid date'),
        body('usageLimit').optional().isInt({ min: 1 }).withMessage('Usage limit must be a positive integer'),
        body('userUsageLimit').optional().isInt({ min: 1 }).withMessage('User usage limit must be a positive integer'),
        body('applicableCategories').optional().isArray().withMessage('Applicable categories must be an array'),
        body('applicableProducts').optional().isArray().withMessage('Applicable products must be an array')
    ],
    couponController.updateCoupon
);

// Delete coupon (admin only)
router.delete('/:couponId', adminMiddleware, couponController.deleteCoupon);

module.exports = router;
