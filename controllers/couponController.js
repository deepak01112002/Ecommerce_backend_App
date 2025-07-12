const Coupon = require('../models/Coupon');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');

// Get all coupons (admin)
exports.getCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, isActive } = req.query;

    const filter = {};
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }

    const coupons = await Coupon.find(filter)
        .populate('createdBy', 'name email')
        .populate('applicableCategories', 'name')
        .populate('applicableProducts', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const totalCoupons = await Coupon.countDocuments(filter);
    const totalPages = Math.ceil(totalCoupons / limit);

    // Format coupons for response
    const formattedCoupons = coupons.map(coupon => ({
        id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscountAmount: coupon.maximumDiscountAmount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        usageLimit: coupon.usageLimit,
        usedCount: coupon.usedCount,
        userUsageLimit: coupon.userUsageLimit,
        isActive: coupon.isActive,
        createdBy: coupon.createdBy ? {
            id: coupon.createdBy._id,
            name: coupon.createdBy.name,
            email: coupon.createdBy.email
        } : null,
        applicableCategories: coupon.applicableCategories || [],
        applicableProducts: coupon.applicableProducts || [],
        createdAt: coupon.createdAt,
        updatedAt: coupon.updatedAt
    }));

    const pagination = {
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        total: totalCoupons,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

    res.paginated(formattedCoupons, pagination, 'Coupons retrieved successfully');
});

// Create coupon (admin)
exports.createCoupon = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const couponData = {
            ...req.body,
            createdBy: req.user._id
        };

        const coupon = new Coupon(couponData);
        await coupon.save();
        await coupon.populate('createdBy', 'name email');

        res.status(201).json({
            message: 'Coupon created successfully',
            coupon
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update coupon (admin)
exports.updateCoupon = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { couponId } = req.params;
        
        const coupon = await Coupon.findByIdAndUpdate(
            couponId,
            req.body,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({
            message: 'Coupon updated successfully',
            coupon
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete coupon (admin)
exports.deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;
        
        const coupon = await Coupon.findByIdAndDelete(couponId);
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ message: 'Coupon deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Validate coupon
exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderAmount, userId, cartItems } = req.body;

        const coupon = await Coupon.findOne({ 
            code: code.toUpperCase(),
            isActive: true
        }).populate('applicableCategories applicableProducts');

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        // Check if coupon is expired
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit exceeded' });
        }

        // Check minimum order amount
        if (orderAmount < coupon.minimumOrderAmount) {
            return res.status(400).json({ 
                message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required` 
            });
        }

        // Check if coupon is applicable to cart items
        if (coupon.applicableCategories.length > 0 || coupon.applicableProducts.length > 0) {
            const applicableCategoryIds = coupon.applicableCategories.map(cat => cat._id.toString());
            const applicableProductIds = coupon.applicableProducts.map(prod => prod._id.toString());
            
            const isApplicable = cartItems.some(item => 
                applicableProductIds.includes(item.product._id.toString()) ||
                applicableCategoryIds.includes(item.product.category.toString())
            );

            if (!isApplicable) {
                return res.status(400).json({ 
                    message: 'Coupon is not applicable to items in your cart' 
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (orderAmount * coupon.discountValue) / 100;
            if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
                discountAmount = coupon.maximumDiscountAmount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed order amount
        discountAmount = Math.min(discountAmount, orderAmount);

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            },
            discountAmount,
            finalAmount: orderAmount - discountAmount
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Apply coupon (increment usage count)
exports.applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;

        const coupon = await Coupon.findOneAndUpdate(
            { code: code.toUpperCase(), isActive: true },
            { $inc: { usedCount: 1 } },
            { new: true }
        );

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({
            message: 'Coupon applied successfully',
            coupon
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
