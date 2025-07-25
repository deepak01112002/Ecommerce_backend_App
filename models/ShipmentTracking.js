const mongoose = require('mongoose');

const shipmentTrackingSchema = new mongoose.Schema({
    shipment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shipment',
        required: true,
        index: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    awbCode: {
        type: String,
        required: true,
        index: true
    },
    courierName: {
        type: String,
        required: true,
        trim: true
    },
    currentStatus: {
        type: String,
        required: true,
        trim: true
    },
    statusCode: {
        type: String,
        trim: true
    },
    statusDate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true
    },
    activity: {
        type: String,
        trim: true
    },
    trackingData: [{
        date: { type: Date, required: true },
        status: { type: String, required: true },
        activity: String,
        location: String,
        remarks: String,
        statusCode: String
    }],
    deliveryBoy: {
        name: String,
        phone: String
    },
    expectedDeliveryDate: {
        type: Date
    },
    actualDeliveryDate: {
        type: Date
    },
    deliveryAttempts: {
        type: Number,
        default: 0,
        min: 0
    },
    lastAttemptDate: {
        type: Date
    },
    nextAttemptDate: {
        type: Date
    },
    rtoInitiatedDate: {
        type: Date
    },
    rtoDeliveredDate: {
        type: Date
    },
    rtoReason: {
        type: String,
        trim: true
    },
    weight: {
        type: Number,
        min: 0
    },
    dimensions: {
        length: Number,
        breadth: Number,
        height: Number
    },
    charges: {
        codAmount: { type: Number, default: 0 },
        shippingCharges: { type: Number, default: 0 },
        totalCharges: { type: Number, default: 0 }
    },
    shiprocketResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    webhookData: {
        type: mongoose.Schema.Types.Mixed
    },
    isLatest: {
        type: Boolean,
        default: true,
        index: true
    },
    source: {
        type: String,
        enum: ['webhook', 'api', 'manual'],
        default: 'webhook'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
shipmentTrackingSchema.index({ shipment: 1, statusDate: -1 });
shipmentTrackingSchema.index({ awbCode: 1, statusDate: -1 });
shipmentTrackingSchema.index({ courierName: 1, currentStatus: 1 });
shipmentTrackingSchema.index({ statusDate: -1 });
shipmentTrackingSchema.index({ isLatest: 1, currentStatus: 1 });

// Virtual for formatted status
shipmentTrackingSchema.virtual('formattedStatus').get(function() {
    return this.currentStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Virtual for delivery status
shipmentTrackingSchema.virtual('isDelivered').get(function() {
    const deliveredStatuses = ['delivered', 'delivered successfully'];
    return deliveredStatuses.some(status => 
        this.currentStatus.toLowerCase().includes(status)
    );
});

// Virtual for return status
shipmentTrackingSchema.virtual('isReturned').get(function() {
    const returnStatuses = ['returned', 'rto', 'return to origin'];
    return returnStatuses.some(status => 
        this.currentStatus.toLowerCase().includes(status)
    );
});

// Pre-save middleware
shipmentTrackingSchema.pre('save', function(next) {
    // Set delivery date if delivered
    if (this.isDelivered && !this.actualDeliveryDate) {
        this.actualDeliveryDate = this.statusDate;
    }
    
    // Set RTO dates
    if (this.isReturned) {
        if (this.currentStatus.toLowerCase().includes('initiated') && !this.rtoInitiatedDate) {
            this.rtoInitiatedDate = this.statusDate;
        }
        if (this.currentStatus.toLowerCase().includes('delivered') && !this.rtoDeliveredDate) {
            this.rtoDeliveredDate = this.statusDate;
        }
    }
    
    next();
});

// Post-save middleware to update shipment status
shipmentTrackingSchema.post('save', async function(doc) {
    try {
        const Shipment = require('./Shipment');
        const shipment = await Shipment.findById(doc.shipment);
        
        if (shipment) {
            // Map tracking status to shipment status
            const statusMapping = {
                'shipped': 'shipped',
                'in transit': 'in_transit',
                'out for delivery': 'out_for_delivery',
                'delivered': 'delivered',
                'delivered successfully': 'delivered',
                'returned': 'returned',
                'rto initiated': 'rto_initiated',
                'rto delivered': 'rto_delivered',
                'cancelled': 'cancelled',
                'lost': 'lost',
                'damaged': 'damaged'
            };
            
            const newStatus = statusMapping[doc.currentStatus.toLowerCase()] || shipment.status;
            
            if (newStatus !== shipment.status) {
                await shipment.updateStatus(newStatus, {
                    deliveryDate: doc.actualDeliveryDate,
                    rtoReason: doc.rtoReason,
                    deliveryAttempts: doc.deliveryAttempts
                });
            }
        }
    } catch (error) {
        console.error('Error updating shipment status:', error);
    }
});

// Static method to get latest tracking for shipment
shipmentTrackingSchema.statics.getLatestTracking = function(shipmentId) {
    return this.findOne({ 
        shipment: shipmentId, 
        isLatest: true 
    }).sort({ statusDate: -1 });
};

// Static method to get tracking history
shipmentTrackingSchema.statics.getTrackingHistory = function(awbCode, options = {}) {
    const query = { awbCode };
    
    return this.find(query)
        .sort({ statusDate: -1 })
        .limit(options.limit || 50)
        .populate('shipment', 'order courierName')
        .populate('order', 'orderNumber');
};

// Static method to get deliveries by date range
shipmentTrackingSchema.statics.getDeliveriesByDateRange = function(startDate, endDate) {
    return this.find({
        actualDeliveryDate: {
            $gte: startDate,
            $lte: endDate
        },
        isLatest: true
    })
    .populate('shipment', 'order totalAmount')
    .populate('order', 'orderNumber user')
    .sort({ actualDeliveryDate: -1 });
};

// Instance method to add tracking update
shipmentTrackingSchema.methods.addTrackingUpdate = function(updateData) {
    this.trackingData.push({
        date: updateData.date || new Date(),
        status: updateData.status,
        activity: updateData.activity,
        location: updateData.location,
        remarks: updateData.remarks,
        statusCode: updateData.statusCode
    });
    
    // Update current status
    this.currentStatus = updateData.status;
    this.statusDate = updateData.date || new Date();
    this.location = updateData.location;
    this.remarks = updateData.remarks;
    this.activity = updateData.activity;
    
    return this.save();
};

// Instance method to mark as not latest
shipmentTrackingSchema.methods.markAsNotLatest = function() {
    this.isLatest = false;
    return this.save();
};

// Instance method to get formatted tracking data
shipmentTrackingSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        awbCode: this.awbCode,
        courierName: this.courierName,
        currentStatus: this.currentStatus,
        formattedStatus: this.formattedStatus,
        statusDate: this.statusDate,
        location: this.location,
        remarks: this.remarks,
        activity: this.activity,
        deliveryBoy: this.deliveryBoy,
        expectedDeliveryDate: this.expectedDeliveryDate,
        actualDeliveryDate: this.actualDeliveryDate,
        deliveryAttempts: this.deliveryAttempts,
        isDelivered: this.isDelivered,
        isReturned: this.isReturned,
        trackingData: this.trackingData.map(track => ({
            date: track.date,
            status: track.status,
            activity: track.activity,
            location: track.location,
            remarks: track.remarks
        })),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// Static method to create or update tracking
shipmentTrackingSchema.statics.createOrUpdateTracking = async function(trackingData) {
    const { awbCode, status, statusDate } = trackingData;
    
    // Mark previous tracking as not latest
    await this.updateMany(
        { awbCode, isLatest: true },
        { $set: { isLatest: false } }
    );
    
    // Create new tracking record
    const tracking = new this({
        ...trackingData,
        currentStatus: status,
        statusDate: statusDate || new Date(),
        isLatest: true
    });
    
    return tracking.save();
};

module.exports = mongoose.model('ShipmentTracking', shipmentTrackingSchema);
