const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    // Return Basic Information
    returnNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    
    // Related Order and User
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
    
    // Return Items
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: { type: String, required: true },
        sku: String,
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
        
        // Return specific details
        returnReason: {
            type: String,
            enum: [
                'defective', 'damaged', 'wrong_item', 'size_issue', 'color_issue',
                'not_as_described', 'quality_issue', 'changed_mind', 'duplicate_order',
                'late_delivery', 'other'
            ],
            required: true
        },
        returnCondition: {
            type: String,
            enum: ['new', 'used', 'damaged', 'defective'],
            required: true
        },
        images: [String], // Return item images
        description: String // Detailed description of issue
    }],
    
    // Return Type
    returnType: {
        type: String,
        enum: ['refund', 'exchange', 'store_credit'],
        required: true,
        index: true
    },
    
    // Return Status
    status: {
        type: String,
        enum: [
            'requested', 'approved', 'rejected', 'pickup_scheduled', 'picked_up',
            'received', 'inspected', 'processed', 'completed', 'cancelled'
        ],
        default: 'requested',
        index: true
    },
    
    // Return Amounts
    amounts: {
        itemsTotal: { type: Number, required: true, min: 0 },
        shippingRefund: { type: Number, default: 0, min: 0 },
        taxRefund: { type: Number, default: 0, min: 0 },
        totalRefund: { type: Number, required: true, min: 0 },
        processingFee: { type: Number, default: 0, min: 0 },
        finalRefund: { type: Number, required: true, min: 0 }
    },
    
    // Return Reason & Details
    returnReason: {
        type: String,
        enum: [
            'defective', 'damaged', 'wrong_item', 'size_issue', 'color_issue',
            'not_as_described', 'quality_issue', 'changed_mind', 'duplicate_order',
            'late_delivery', 'other'
        ],
        required: true
    },
    customerComments: {
        type: String,
        trim: true
    },
    
    // Pickup Information
    pickupDetails: {
        address: {
            name: String,
            phone: String,
            addressLine1: String,
            addressLine2: String,
            city: String,
            state: String,
            postalCode: String,
            country: { type: String, default: 'India' }
        },
        scheduledDate: Date,
        scheduledTimeSlot: String,
        actualPickupDate: Date,
        courierPartner: String,
        trackingNumber: String,
        pickupInstructions: String
    },
    
    // Inspection Details
    inspection: {
        inspectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        inspectedAt: Date,
        inspectionNotes: String,
        itemCondition: {
            type: String,
            enum: ['acceptable', 'damaged', 'defective', 'not_returnable']
        },
        images: [String],
        approved: { type: Boolean, default: false },
        rejectionReason: String
    },
    
    // Refund Details
    refund: {
        method: {
            type: String,
            enum: ['original_payment', 'wallet', 'bank_transfer', 'store_credit']
        },
        processedAt: Date,
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        transactionId: String,
        bankDetails: {
            accountNumber: String,
            ifscCode: String,
            accountHolderName: String
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending'
        },
        failureReason: String
    },
    
    // Exchange Details (if return type is exchange)
    exchange: {
        newProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        newProductName: String,
        newProductSku: String,
        priceDifference: { type: Number, default: 0 },
        newOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        }
    },
    
    // Timeline
    timeline: [{
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String,
        isSystemGenerated: { type: Boolean, default: false }
    }],
    
    // Return Policy
    returnPolicy: {
        returnWindow: { type: Number, default: 7 }, // days
        isEligible: { type: Boolean, default: true },
        eligibilityReason: String
    },
    
    // Admin Notes
    adminNotes: String,
    internalNotes: String,
    
    // Dates
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    completedAt: Date,
    
    // Metadata
    isActive: { type: Boolean, default: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
returnSchema.index({ returnNumber: 1 });
returnSchema.index({ order: 1, user: 1 });
returnSchema.index({ status: 1, returnType: 1 });
returnSchema.index({ requestedAt: -1 });
returnSchema.index({ 'pickupDetails.scheduledDate': 1 });

// Virtual for formatted return number
returnSchema.virtual('formattedReturnNumber').get(function() {
    return `RET-${this.returnNumber}`;
});

// Virtual for days since request
returnSchema.virtual('daysSinceRequest').get(function() {
    const now = new Date();
    const diff = now - this.requestedAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for return eligibility
returnSchema.virtual('isEligibleForReturn').get(function() {
    const returnWindow = this.returnPolicy.returnWindow || 7;
    return this.daysSinceRequest <= returnWindow;
});

// Pre-save middleware to generate return number
returnSchema.pre('save', async function(next) {
    if (this.isNew && !this.returnNumber) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments({
            returnNumber: new RegExp(`^${year}`)
        });
        this.returnNumber = `${year}${String(count + 1).padStart(6, '0')}`;
    }
    
    // Calculate final refund amount
    if (this.amounts) {
        this.amounts.finalRefund = this.amounts.totalRefund - this.amounts.processingFee;
    }
    
    next();
});

// Static method to create return request
returnSchema.statics.createReturnRequest = async function(returnData) {
    const returnRequest = new this(returnData);
    
    // Add initial timeline entry
    returnRequest.timeline.push({
        status: 'requested',
        timestamp: new Date(),
        updatedBy: returnData.user,
        notes: 'Return request created',
        isSystemGenerated: true
    });
    
    await returnRequest.save();
    return returnRequest;
};

// Static method to get return statistics
returnSchema.statics.getReturnStatistics = async function(dateRange = {}) {
    const matchStage = { isActive: true };
    if (dateRange.startDate || dateRange.endDate) {
        matchStage.requestedAt = {};
        if (dateRange.startDate) matchStage.requestedAt.$gte = new Date(dateRange.startDate);
        if (dateRange.endDate) matchStage.requestedAt.$lte = new Date(dateRange.endDate);
    }
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalReturns: { $sum: 1 },
                totalRefundAmount: { $sum: '$amounts.finalRefund' },
                avgRefundAmount: { $avg: '$amounts.finalRefund' },
                completedReturns: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                pendingReturns: {
                    $sum: { $cond: [{ $in: ['$status', ['requested', 'approved', 'pickup_scheduled']] }, 1, 0] }
                }
            }
        }
    ]);
    
    return stats[0] || {
        totalReturns: 0,
        totalRefundAmount: 0,
        avgRefundAmount: 0,
        completedReturns: 0,
        pendingReturns: 0
    };
};

// Instance method to approve return
returnSchema.methods.approve = async function(approvedBy, notes = '') {
    this.status = 'approved';
    this.approvedAt = new Date();
    this.lastUpdatedBy = approvedBy;
    
    this.timeline.push({
        status: 'approved',
        timestamp: new Date(),
        updatedBy: approvedBy,
        notes: notes || 'Return request approved',
        isSystemGenerated: false
    });
    
    return this.save();
};

// Instance method to reject return
returnSchema.methods.reject = async function(rejectedBy, reason) {
    this.status = 'rejected';
    this.inspection.rejectionReason = reason;
    this.lastUpdatedBy = rejectedBy;
    
    this.timeline.push({
        status: 'rejected',
        timestamp: new Date(),
        updatedBy: rejectedBy,
        notes: `Return rejected: ${reason}`,
        isSystemGenerated: false
    });
    
    return this.save();
};

// Instance method to schedule pickup
returnSchema.methods.schedulePickup = async function(pickupData, scheduledBy) {
    this.status = 'pickup_scheduled';
    this.pickupDetails = { ...this.pickupDetails, ...pickupData };
    this.lastUpdatedBy = scheduledBy;
    
    this.timeline.push({
        status: 'pickup_scheduled',
        timestamp: new Date(),
        updatedBy: scheduledBy,
        notes: `Pickup scheduled for ${pickupData.scheduledDate}`,
        isSystemGenerated: false
    });
    
    return this.save();
};

// Instance method to complete return
returnSchema.methods.complete = async function(completedBy, refundData) {
    this.status = 'completed';
    this.completedAt = new Date();
    this.refund = { ...this.refund, ...refundData };
    this.lastUpdatedBy = completedBy;
    
    this.timeline.push({
        status: 'completed',
        timestamp: new Date(),
        updatedBy: completedBy,
        notes: 'Return completed and refund processed',
        isSystemGenerated: false
    });
    
    return this.save();
};

// Instance method to get formatted data
returnSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        returnNumber: this.formattedReturnNumber,
        order: this.order,
        user: this.user,
        items: this.items,
        returnType: this.returnType,
        status: this.status,
        amounts: this.amounts,
        returnReason: this.returnReason,
        customerComments: this.customerComments,
        pickupDetails: this.pickupDetails,
        inspection: this.inspection,
        refund: this.refund,
        exchange: this.exchange,
        timeline: this.timeline,
        daysSinceRequest: this.daysSinceRequest,
        isEligibleForReturn: this.isEligibleForReturn,
        requestedAt: this.requestedAt,
        completedAt: this.completedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('Return', returnSchema);
