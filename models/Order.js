const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    productSnapshot: {
        name: String,
        description: String,
        images: [String],
        category: String,
        gstRate: Number,
        hsnCode: String
    },
    variant: { type: String },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 18,
        min: 0,
        max: 100
    }
});

// Address schema for order snapshot (keeping address data even if original address is deleted)
const orderAddressSchema = new mongoose.Schema({
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address'
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: String,
    phone: { type: String, required: true },
    alternatePhone: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    landmark: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    postalCode: { type: String, required: true },
    completeAddress: String,
    deliveryInstructions: String,
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    gstNumber: String,
    panNumber: String
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    guestInfo: {
        email: String,
        phone: String,
        firstName: String,
        lastName: String
    },
    items: [orderItemSchema],
    pricing: {
        subtotal: { type: Number, required: true, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        taxRate: { type: Number, default: 0, min: 0 },
        shipping: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        total: { type: Number, required: true, min: 0 }
    },
    shippingAddress: orderAddressSchema,
    billingAddress: orderAddressSchema,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
        default: 'pending',
        index: true
    },
    statusHistory: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    paymentInfo: {
        method: {
            type: String,
            enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cod', 'razorpay'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending',
            index: true
        },
        transactionId: String,
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: { type: Number, default: 0 },
        walletTransactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction'
        },
        walletAmountUsed: { type: Number, default: 0 }
    },
    shipping: {
        method: String,
        trackingNumber: String,
        carrier: String,
        estimatedDelivery: Date,
        actualDelivery: Date,
        shippingCost: { type: Number, default: 0 },
        shiprocketOrderId: String,
        shiprocketShipmentId: String,
        awbCode: String,
        courierCompanyId: Number,
        pickupLocation: String,

        // Admin delivery method selection
        deliveryMethod: {
            type: String,
            enum: ['manual', 'delivery_company', 'delhivery', 'shiprocket'],
            default: 'manual'
        },
        deliveryCompanyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeliveryCompany',
            sparse: true
        },
        deliveryCompanyName: String,
        adminNotes: String,
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        assignedAt: Date,
        manifestUrl: String,
        labelUrl: String,
        invoiceUrl: String
    },
    coupon: {
        code: String,
        discountAmount: { type: Number, default: 0 },
        discountType: String
    },
    notes: {
        customer: String,
        internal: String
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true
    },
    source: {
        type: String,
        enum: ['web', 'mobile', 'admin', 'api'],
        default: 'web',
        index: true
    },
    isGift: {
        type: Boolean,
        default: false
    },
    giftMessage: String,
    returnRequested: {
        type: Boolean,
        default: false,
        index: true
    },
    returnReason: String,
    returnStatus: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
        default: 'none'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for current status info
orderSchema.virtual('currentStatus').get(function() {
    return this.statusHistory[this.statusHistory.length - 1] || {
        status: this.status,
        timestamp: this.createdAt
    };
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        // Find the last order of the day
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const lastOrder = await mongoose.model('Order')
            .findOne({
                createdAt: { $gte: startOfDay, $lt: endOfDay }
            })
            .sort({ createdAt: -1 });

        let sequence = 1;
        if (lastOrder && lastOrder.orderNumber) {
            const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        this.orderNumber = `ORD${year}${month}${day}${sequence.toString().padStart(4, '0')}`;
    }

    // Add status to history if status changed
    if (this.isModified('status') && !this.isNew) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status changed to ${this.status}`
        });
    }

    next();
});

// Pre-save middleware to ensure totalPrice is calculated for each item
orderSchema.pre('save', function(next) {
    if (this.isModified('items') || this.isNew) {
        this.items.forEach(item => {
            if (item.unitPrice && item.quantity) {
                item.totalPrice = item.unitPrice * item.quantity;
            }
        });
    }
    next();
});

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note, updatedBy) {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note: note || `Status updated to ${newStatus}`,
        updatedBy
    });
    return this.save();
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
    const subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = this.coupon ? this.coupon.discountAmount : 0;
    const tax = (subtotal - discount) * (this.pricing.taxRate || 0);
    const total = subtotal - discount + tax + (this.pricing.shipping || 0);

    this.pricing = {
        subtotal,
        tax,
        taxRate: this.pricing.taxRate || 0,
        shipping: this.pricing.shipping || 0,
        discount,
        total
    };

    return this;
};

// Method to add item
orderSchema.methods.addItem = function(productId, quantity, unitPrice, variant) {
    const existingItem = this.items.find(item =>
        item.product.toString() === productId.toString() &&
        item.variant === variant
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
        this.items.push({
            product: productId,
            variant,
            quantity,
            unitPrice,
            totalPrice: quantity * unitPrice
        });
    }

    this.calculateTotals();
    return this;
};

// Method to remove item
orderSchema.methods.removeItem = function(itemId) {
    this.items.id(itemId).remove();
    this.calculateTotals();
    return this;
};

// Static method for analytics
orderSchema.statics.getOrderStats = async function(startDate, endDate) {
    const pipeline = [
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                status: { $ne: 'cancelled' }
            }
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.total' },
                averageOrderValue: { $avg: '$pricing.total' },
                totalItems: { $sum: { $sum: '$items.quantity' } }
            }
        }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalItems: 0
    };
};

// Instance method to check if order can be shipped
orderSchema.methods.canBeShipped = function() {
    return this.status === 'confirmed' &&
           this.paymentInfo.status === 'completed' &&
           !this.shipping?.shiprocketOrderId;
};

// Instance method to update shipping info
orderSchema.methods.updateShippingInfo = function(shippingData) {
    this.shipping = {
        ...this.shipping,
        ...shippingData
    };

    if (shippingData.trackingNumber) {
        this.status = 'shipped';
    }

    return this.save();
};

// Instance method to get shipping status
orderSchema.methods.getShippingStatus = function() {
    if (!this.shipping?.trackingNumber) {
        return 'not_shipped';
    }

    if (this.shipping.actualDelivery) {
        return 'delivered';
    }

    if (this.status === 'shipped') {
        return 'in_transit';
    }

    return 'processing';
};

// Static method to get orders ready for shipping
orderSchema.statics.getOrdersReadyForShipping = function() {
    return this.find({
        status: 'confirmed',
        'paymentInfo.status': 'completed',
        'shipping.shiprocketOrderId': { $exists: false }
    }).populate('user', 'firstName lastName email phone');
};

// Comprehensive indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ 'paymentInfo.method': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'pricing.total': -1 });
orderSchema.index({ priority: 1, status: 1 });
orderSchema.index({ source: 1, createdAt: -1 });
orderSchema.index({ returnRequested: 1, status: 1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'shipping.trackingNumber': 1 });
orderSchema.index({ 'shipping.shiprocketOrderId': 1 });
orderSchema.index({ 'shipping.awbCode': 1 });

module.exports = mongoose.model('Order', orderSchema);