const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
        index: true
    },
    
    // Stock Information
    currentStock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    availableStock: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Stock Levels
    minStockLevel: {
        type: Number,
        default: 10,
        min: 0
    },
    maxStockLevel: {
        type: Number,
        default: 1000,
        min: 0
    },
    reorderLevel: {
        type: Number,
        default: 20,
        min: 0
    },
    reorderQuantity: {
        type: Number,
        default: 50,
        min: 0
    },
    
    // Cost Information
    averageCost: {
        type: Number,
        default: 0,
        min: 0
    },
    lastPurchaseCost: {
        type: Number,
        default: 0,
        min: 0
    },
    totalStockValue: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Location Information
    location: {
        warehouse: {
            type: String,
            default: 'Main Warehouse'
        },
        section: String,
        shelf: String,
        bin: String
    },
    
    // Stock Status
    stockStatus: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
        default: 'in_stock',
        index: true
    },
    
    // Last Stock Movement
    lastStockIn: {
        date: Date,
        quantity: Number,
        reference: String,
        cost: Number
    },
    lastStockOut: {
        date: Date,
        quantity: Number,
        reference: String,
        reason: String
    },
    
    // Supplier Information
    primarySupplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    alternateSuppliers: [{
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Supplier'
        },
        leadTime: Number, // in days
        minOrderQuantity: Number,
        cost: Number
    }],
    
    // Stock Alerts
    alerts: {
        lowStockAlert: {
            type: Boolean,
            default: true
        },
        outOfStockAlert: {
            type: Boolean,
            default: true
        },
        reorderAlert: {
            type: Boolean,
            default: true
        },
        lastAlertSent: Date
    },
    
    // Tracking Information
    trackingEnabled: {
        type: Boolean,
        default: true
    },
    batchTracking: {
        type: Boolean,
        default: false
    },
    serialTracking: {
        type: Boolean,
        default: false
    },
    expiryTracking: {
        type: Boolean,
        default: false
    },
    
    // Additional Information
    notes: String,
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Audit Information
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastStockCount: {
        date: Date,
        countedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        countedStock: Number,
        variance: Number
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
inventorySchema.index({ product: 1 });
inventorySchema.index({ stockStatus: 1 });
inventorySchema.index({ currentStock: 1 });
inventorySchema.index({ 'location.warehouse': 1 });
inventorySchema.index({ primarySupplier: 1 });
inventorySchema.index({ isActive: 1 });

// Virtual for stock status calculation
inventorySchema.virtual('calculatedStockStatus').get(function() {
    if (this.currentStock <= 0) {
        return 'out_of_stock';
    } else if (this.currentStock <= this.minStockLevel) {
        return 'low_stock';
    } else {
        return 'in_stock';
    }
});

// Virtual for stock health
inventorySchema.virtual('stockHealth').get(function() {
    const stockPercentage = (this.currentStock / this.maxStockLevel) * 100;
    if (stockPercentage >= 70) return 'excellent';
    if (stockPercentage >= 40) return 'good';
    if (stockPercentage >= 20) return 'warning';
    return 'critical';
});

// Virtual for needs reorder
inventorySchema.virtual('needsReorder').get(function() {
    return this.currentStock <= this.reorderLevel;
});

// Pre-save middleware to calculate available stock and status
inventorySchema.pre('save', function(next) {
    // Calculate available stock
    this.availableStock = Math.max(0, this.currentStock - this.reservedStock);
    
    // Update stock status
    this.stockStatus = this.calculatedStockStatus;
    
    // Calculate total stock value
    this.totalStockValue = this.currentStock * this.averageCost;
    
    next();
});

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function(limit = 50) {
    return this.find({
        $or: [
            { stockStatus: 'low_stock' },
            { stockStatus: 'out_of_stock' }
        ],
        isActive: true
    })
    .populate('product', 'name sku images')
    .populate('primarySupplier', 'name contactInfo')
    .sort({ currentStock: 1 })
    .limit(limit);
};

// Static method to get items needing reorder
inventorySchema.statics.getReorderItems = function() {
    return this.find({
        $expr: { $lte: ['$currentStock', '$reorderLevel'] },
        isActive: true
    })
    .populate('product', 'name sku')
    .populate('primarySupplier', 'name contactInfo')
    .sort({ currentStock: 1 });
};

// Static method to get inventory summary
inventorySchema.statics.getInventorySummary = async function() {
    const summary = await this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$currentStock' },
                totalValue: { $sum: '$totalStockValue' },
                lowStockCount: {
                    $sum: {
                        $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0]
                    }
                },
                outOfStockCount: {
                    $sum: {
                        $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0]
                    }
                },
                reorderCount: {
                    $sum: {
                        $cond: [{ $lte: ['$currentStock', '$reorderLevel'] }, 1, 0]
                    }
                }
            }
        }
    ]);
    
    return summary[0] || {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        reorderCount: 0
    };
};

// Instance method to update stock
inventorySchema.methods.updateStock = function(quantity, type, reference, additionalData = {}) {
    const oldStock = this.currentStock;
    
    if (type === 'in') {
        this.currentStock += quantity;
        this.lastStockIn = {
            date: new Date(),
            quantity,
            reference,
            cost: additionalData.cost || this.lastPurchaseCost
        };
        
        // Update average cost if cost is provided
        if (additionalData.cost) {
            const totalValue = (oldStock * this.averageCost) + (quantity * additionalData.cost);
            this.averageCost = totalValue / this.currentStock;
            this.lastPurchaseCost = additionalData.cost;
        }
    } else if (type === 'out') {
        if (quantity > this.currentStock) {
            throw new Error('Insufficient stock');
        }
        this.currentStock -= quantity;
        this.lastStockOut = {
            date: new Date(),
            quantity,
            reference,
            reason: additionalData.reason || 'Sale'
        };
    }
    
    this.lastUpdatedBy = additionalData.updatedBy;
    return this.save();
};

// Instance method to reserve stock
inventorySchema.methods.reserveStock = function(quantity) {
    if (quantity > this.availableStock) {
        throw new Error('Insufficient available stock');
    }
    this.reservedStock += quantity;
    return this.save();
};

// Instance method to release reserved stock
inventorySchema.methods.releaseReservedStock = function(quantity) {
    this.reservedStock = Math.max(0, this.reservedStock - quantity);
    return this.save();
};

// Instance method to perform stock count
inventorySchema.methods.performStockCount = function(countedStock, countedBy) {
    const variance = countedStock - this.currentStock;
    
    this.lastStockCount = {
        date: new Date(),
        countedBy,
        countedStock,
        variance
    };
    
    // Update current stock to counted stock
    this.currentStock = countedStock;
    
    return this.save();
};

// Instance method to check if reorder is needed
inventorySchema.methods.checkReorderNeeded = function() {
    return this.currentStock <= this.reorderLevel;
};

// Instance method to get formatted inventory data
inventorySchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        product: this.product,
        currentStock: this.currentStock,
        reservedStock: this.reservedStock,
        availableStock: this.availableStock,
        stockStatus: this.stockStatus,
        stockHealth: this.stockHealth,
        needsReorder: this.needsReorder,
        minStockLevel: this.minStockLevel,
        maxStockLevel: this.maxStockLevel,
        reorderLevel: this.reorderLevel,
        reorderQuantity: this.reorderQuantity,
        averageCost: this.averageCost,
        totalStockValue: this.totalStockValue,
        location: this.location,
        primarySupplier: this.primarySupplier,
        lastStockIn: this.lastStockIn,
        lastStockOut: this.lastStockOut,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('Inventory', inventorySchema);
