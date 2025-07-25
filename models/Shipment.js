const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    shiprocketOrderId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    shiprocketShipmentId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    awbCode: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    courierCompanyId: {
        type: Number
    },
    courierName: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: [
            'pending',           // Order created but not shipped
            'processing',        // Being processed by shiprocket
            'shipped',          // Shipped from warehouse
            'in_transit',       // In transit
            'out_for_delivery', // Out for delivery
            'delivered',        // Successfully delivered
            'returned',         // Returned to sender
            'cancelled',        // Cancelled
            'lost',            // Lost in transit
            'damaged',         // Damaged
            'rto_initiated',   // Return to origin initiated
            'rto_delivered'    // Return to origin delivered
        ],
        default: 'pending',
        index: true
    },
    trackingUrl: {
        type: String,
        trim: true
    },
    estimatedDeliveryDate: {
        type: Date
    },
    actualDeliveryDate: {
        type: Date
    },
    shippingAddress: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
        address: { type: String, required: true },
        address2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true, default: 'India' },
        pincode: { type: String, required: true }
    },
    pickupAddress: {
        name: String,
        phone: String,
        email: String,
        address: String,
        address2: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        pincode: String
    },
    items: [{
        name: { type: String, required: true },
        sku: String,
        units: { type: Number, required: true, min: 1 },
        sellingPrice: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        tax: { type: Number, default: 0, min: 0 },
        hsn: String,
        category: String
    }],
    dimensions: {
        length: { type: Number, min: 0 },
        breadth: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        weight: { type: Number, min: 0 }
    },
    charges: {
        codCharges: { type: Number, default: 0 },
        advanceAmount: { type: Number, default: 0 },
        collectableAmount: { type: Number, default: 0 },
        shippingCharges: { type: Number, default: 0 },
        totalCharges: { type: Number, default: 0 }
    },
    paymentMode: {
        type: String,
        enum: ['prepaid', 'cod'],
        required: true
    },
    subTotal: {
        type: Number,
        required: true,
        min: 0
    },
    totalDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    totalTax: {
        type: Number,
        default: 0,
        min: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    shiprocketResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    lastStatusUpdate: {
        type: Date,
        default: Date.now
    },
    deliveryAttempts: {
        type: Number,
        default: 0,
        min: 0
    },
    rtoReason: {
        type: String,
        trim: true
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
shipmentSchema.index({ order: 1, status: 1 });
shipmentSchema.index({ user: 1, status: 1 });
shipmentSchema.index({ awbCode: 1, status: 1 });
shipmentSchema.index({ courierName: 1, status: 1 });
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({ estimatedDeliveryDate: 1 });
shipmentSchema.index({ actualDeliveryDate: 1 });

// Virtual for formatted status
shipmentSchema.virtual('formattedStatus').get(function() {
    const statusMap = {
        'pending': 'Pending',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'returned': 'Returned',
        'cancelled': 'Cancelled',
        'lost': 'Lost',
        'damaged': 'Damaged',
        'rto_initiated': 'Return Initiated',
        'rto_delivered': 'Return Delivered'
    };
    return statusMap[this.status] || this.status;
});

// Virtual for delivery status
shipmentSchema.virtual('isDelivered').get(function() {
    return this.status === 'delivered';
});

// Virtual for tracking info
shipmentSchema.virtual('trackingInfo').get(function() {
    return {
        awbCode: this.awbCode,
        courierName: this.courierName,
        trackingUrl: this.trackingUrl,
        status: this.formattedStatus,
        estimatedDelivery: this.estimatedDeliveryDate,
        actualDelivery: this.actualDeliveryDate
    };
});

// Pre-save middleware
shipmentSchema.pre('save', function(next) {
    // Update lastStatusUpdate when status changes
    if (this.isModified('status')) {
        this.lastStatusUpdate = new Date();
        
        // Set actual delivery date when delivered
        if (this.status === 'delivered' && !this.actualDeliveryDate) {
            this.actualDeliveryDate = new Date();
        }
    }
    
    next();
});

// Static method to get shipments by status
shipmentSchema.statics.getByStatus = function(status, options = {}) {
    const query = { status, isActive: true };
    
    if (options.userId) {
        query.user = options.userId;
    }
    
    if (options.courierName) {
        query.courierName = options.courierName;
    }
    
    return this.find(query)
        .populate('order', 'orderNumber totalAmount')
        .populate('user', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .limit(options.limit || 50);
};

// Static method to get pending shipments
shipmentSchema.statics.getPendingShipments = function() {
    return this.find({ 
        status: { $in: ['pending', 'processing'] }, 
        isActive: true 
    })
    .populate('order', 'orderNumber')
    .sort({ createdAt: 1 });
};

// Instance method to update status
shipmentSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
    this.status = newStatus;
    this.lastStatusUpdate = new Date();
    
    // Handle specific status updates
    if (newStatus === 'delivered') {
        this.actualDeliveryDate = additionalData.deliveryDate || new Date();
    }
    
    if (newStatus === 'returned' && additionalData.rtoReason) {
        this.rtoReason = additionalData.rtoReason;
    }
    
    if (newStatus === 'cancelled' && additionalData.cancellationReason) {
        this.cancellationReason = additionalData.cancellationReason;
    }
    
    if (additionalData.deliveryAttempts) {
        this.deliveryAttempts = additionalData.deliveryAttempts;
    }
    
    return this.save();
};

// Instance method to get formatted shipment data
shipmentSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        orderId: this.order,
        shiprocketOrderId: this.shiprocketOrderId,
        shiprocketShipmentId: this.shiprocketShipmentId,
        awbCode: this.awbCode,
        courierName: this.courierName,
        status: this.status,
        formattedStatus: this.formattedStatus,
        trackingUrl: this.trackingUrl,
        trackingInfo: this.trackingInfo,
        estimatedDeliveryDate: this.estimatedDeliveryDate,
        actualDeliveryDate: this.actualDeliveryDate,
        shippingAddress: this.shippingAddress,
        totalAmount: this.totalAmount,
        paymentMode: this.paymentMode,
        deliveryAttempts: this.deliveryAttempts,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('Shipment', shipmentSchema);
