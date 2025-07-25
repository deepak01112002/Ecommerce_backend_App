const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    // PO Basic Information
    poNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true,
        index: true
    },
    
    // PO Details
    poDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    expectedDeliveryDate: {
        type: Date,
        required: true
    },
    actualDeliveryDate: Date,
    
    // Items
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: { type: String, required: true },
        sku: String,
        description: String,
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        receivedQuantity: { type: Number, default: 0, min: 0 },
        pendingQuantity: { type: Number, default: 0, min: 0 },
        
        // Tax Information
        hsnCode: String,
        gstRate: { type: Number, default: 18, min: 0, max: 100 },
        cgst: { type: Number, default: 0, min: 0 },
        sgst: { type: Number, default: 0, min: 0 },
        igst: { type: Number, default: 0, min: 0 },
        totalTax: { type: Number, default: 0, min: 0 },
        
        // Item Status
        status: {
            type: String,
            enum: ['pending', 'partial', 'received', 'cancelled'],
            default: 'pending'
        },
        notes: String
    }],
    
    // Pricing Summary
    pricing: {
        subtotal: { type: Number, required: true, min: 0 },
        totalDiscount: { type: Number, default: 0, min: 0 },
        taxableAmount: { type: Number, required: true, min: 0 },
        totalCGST: { type: Number, default: 0, min: 0 },
        totalSGST: { type: Number, default: 0, min: 0 },
        totalIGST: { type: Number, default: 0, min: 0 },
        totalGST: { type: Number, default: 0, min: 0 },
        shippingCharges: { type: Number, default: 0, min: 0 },
        otherCharges: { type: Number, default: 0, min: 0 },
        grandTotal: { type: Number, required: true, min: 0 }
    },
    
    // Delivery Information
    deliveryAddress: {
        name: String,
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, default: 'India' },
        postalCode: { type: String, required: true },
        contactPerson: String,
        contactPhone: String
    },
    
    // PO Status
    status: {
        type: String,
        enum: ['draft', 'sent', 'acknowledged', 'partial', 'completed', 'cancelled', 'closed'],
        default: 'draft',
        index: true
    },
    
    // Payment Information
    paymentInfo: {
        paymentTerms: {
            type: String,
            enum: ['cash', 'credit', 'advance', 'cod'],
            default: 'credit'
        },
        creditDays: { type: Number, default: 30 },
        advanceAmount: { type: Number, default: 0, min: 0 },
        paidAmount: { type: Number, default: 0, min: 0 },
        balanceAmount: { type: Number, default: 0, min: 0 },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'paid'],
            default: 'pending'
        },
        dueDate: Date
    },
    
    // Tracking Information
    tracking: {
        sentAt: Date,
        acknowledgedAt: Date,
        acknowledgedBy: String,
        firstDeliveryAt: Date,
        completedAt: Date,
        cancelledAt: Date,
        cancellationReason: String
    },
    
    // Documents
    documents: [{
        type: {
            type: String,
            enum: ['po_document', 'quotation', 'invoice', 'delivery_note', 'other']
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    
    // Additional Information
    terms: String,
    notes: String,
    internalNotes: String,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Approval Workflow
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    
    // Audit Information
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ status: 1, poDate: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });
purchaseOrderSchema.index({ createdBy: 1 });
purchaseOrderSchema.index({ approvalStatus: 1 });

// Virtual for formatted PO number
purchaseOrderSchema.virtual('formattedPONumber').get(function() {
    return `PO-${this.poNumber}`;
});

// Virtual for overall completion percentage
purchaseOrderSchema.virtual('completionPercentage').get(function() {
    if (this.items.length === 0) return 0;
    
    const totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQuantity = this.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
    
    return Math.round((receivedQuantity / totalQuantity) * 100);
});

// Virtual for is overdue
purchaseOrderSchema.virtual('isOverdue').get(function() {
    return this.expectedDeliveryDate < new Date() && 
           !['completed', 'cancelled', 'closed'].includes(this.status);
});

// Virtual for days overdue
purchaseOrderSchema.virtual('daysOverdue').get(function() {
    if (!this.isOverdue) return 0;
    const diffTime = new Date() - this.expectedDeliveryDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate PO number and update item status
purchaseOrderSchema.pre('save', async function(next) {
    // Generate PO number if new
    if (this.isNew && !this.poNumber) {
        const year = new Date().getFullYear();
        const count = await this.constructor.countDocuments({
            poNumber: new RegExp(`^${year}`)
        });
        this.poNumber = `${year}${String(count + 1).padStart(4, '0')}`;
    }
    
    // Update item status and pending quantities
    this.items.forEach(item => {
        item.pendingQuantity = item.quantity - item.receivedQuantity;
        
        if (item.receivedQuantity === 0) {
            item.status = 'pending';
        } else if (item.receivedQuantity >= item.quantity) {
            item.status = 'received';
        } else {
            item.status = 'partial';
        }
    });
    
    // Update overall PO status based on items
    const allReceived = this.items.every(item => item.status === 'received');
    const anyReceived = this.items.some(item => item.receivedQuantity > 0);
    
    if (allReceived && this.status !== 'cancelled') {
        this.status = 'completed';
        this.tracking.completedAt = new Date();
    } else if (anyReceived && this.status === 'sent') {
        this.status = 'partial';
        if (!this.tracking.firstDeliveryAt) {
            this.tracking.firstDeliveryAt = new Date();
        }
    }
    
    // Update payment balance
    this.paymentInfo.balanceAmount = this.pricing.grandTotal - this.paymentInfo.paidAmount;
    
    // Update payment status
    if (this.paymentInfo.paidAmount === 0) {
        this.paymentInfo.paymentStatus = 'pending';
    } else if (this.paymentInfo.paidAmount >= this.pricing.grandTotal) {
        this.paymentInfo.paymentStatus = 'paid';
    } else {
        this.paymentInfo.paymentStatus = 'partial';
    }
    
    // Set due date
    if (this.paymentInfo.paymentTerms === 'credit' && !this.paymentInfo.dueDate) {
        this.paymentInfo.dueDate = new Date(this.poDate.getTime() + (this.paymentInfo.creditDays * 24 * 60 * 60 * 1000));
    }
    
    next();
});

// Static method to get overdue POs
purchaseOrderSchema.statics.getOverduePOs = function() {
    return this.find({
        expectedDeliveryDate: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled', 'closed'] }
    })
    .populate('supplier', 'name contactInfo')
    .sort({ expectedDeliveryDate: 1 });
};

// Static method to get POs needing approval
purchaseOrderSchema.statics.getPOsNeedingApproval = function() {
    return this.find({
        approvalStatus: 'pending',
        status: 'draft'
    })
    .populate('supplier', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: 1 });
};

// Static method to get PO summary
purchaseOrderSchema.statics.getPOSummary = async function(dateRange = {}) {
    const matchStage = {};
    if (dateRange.startDate || dateRange.endDate) {
        matchStage.poDate = {};
        if (dateRange.startDate) matchStage.poDate.$gte = new Date(dateRange.startDate);
        if (dateRange.endDate) matchStage.poDate.$lte = new Date(dateRange.endDate);
    }
    
    const summary = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalPOs: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                completedPOs: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                pendingPOs: {
                    $sum: { $cond: [{ $in: ['$status', ['draft', 'sent', 'acknowledged', 'partial']] }, 1, 0] }
                },
                overduePOs: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $lt: ['$expectedDeliveryDate', new Date()] },
                                    { $nin: ['$status', ['completed', 'cancelled', 'closed']] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    
    return summary[0] || {
        totalPOs: 0,
        totalAmount: 0,
        completedPOs: 0,
        pendingPOs: 0,
        overduePOs: 0
    };
};

// Instance method to approve PO
purchaseOrderSchema.methods.approve = function(approvedBy) {
    this.approvalStatus = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.status = 'sent';
    this.tracking.sentAt = new Date();
    
    return this.save();
};

// Instance method to reject PO
purchaseOrderSchema.methods.reject = function(reason, rejectedBy) {
    this.approvalStatus = 'rejected';
    this.rejectionReason = reason;
    this.lastUpdatedBy = rejectedBy;
    
    return this.save();
};

// Instance method to receive items
purchaseOrderSchema.methods.receiveItems = async function(receivedItems, receivedBy) {
    const Inventory = require('./Inventory');
    
    for (const receivedItem of receivedItems) {
        const poItem = this.items.id(receivedItem.itemId);
        if (!poItem) continue;
        
        const quantityToReceive = Math.min(
            receivedItem.quantity,
            poItem.quantity - poItem.receivedQuantity
        );
        
        if (quantityToReceive > 0) {
            poItem.receivedQuantity += quantityToReceive;
            
            // Update inventory
            let inventory = await Inventory.findOne({ product: poItem.product });
            if (!inventory) {
                inventory = new Inventory({
                    product: poItem.product,
                    currentStock: 0
                });
            }
            
            await inventory.updateStock(
                quantityToReceive,
                'in',
                this.formattedPONumber,
                {
                    cost: poItem.unitPrice,
                    updatedBy: receivedBy
                }
            );
        }
    }
    
    this.lastUpdatedBy = receivedBy;
    return this.save();
};

// Instance method to cancel PO
purchaseOrderSchema.methods.cancel = function(reason, cancelledBy) {
    this.status = 'cancelled';
    this.tracking.cancelledAt = new Date();
    this.tracking.cancellationReason = reason;
    this.lastUpdatedBy = cancelledBy;
    
    return this.save();
};

// Instance method to get formatted PO data
purchaseOrderSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        poNumber: this.formattedPONumber,
        supplier: this.supplier,
        poDate: this.poDate,
        expectedDeliveryDate: this.expectedDeliveryDate,
        actualDeliveryDate: this.actualDeliveryDate,
        items: this.items,
        pricing: this.pricing,
        status: this.status,
        completionPercentage: this.completionPercentage,
        isOverdue: this.isOverdue,
        daysOverdue: this.daysOverdue,
        paymentInfo: this.paymentInfo,
        approvalStatus: this.approvalStatus,
        priority: this.priority,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
