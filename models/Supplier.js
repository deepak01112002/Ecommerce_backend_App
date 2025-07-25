const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    code: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'service_provider'],
        default: 'distributor'
    },
    
    // Contact Information
    contactInfo: {
        primaryContact: {
            name: String,
            designation: String,
            phone: String,
            email: String
        },
        alternateContact: {
            name: String,
            designation: String,
            phone: String,
            email: String
        },
        companyPhone: String,
        companyEmail: String,
        website: String
    },
    
    // Address Information
    addresses: [{
        type: {
            type: String,
            enum: ['billing', 'shipping', 'office'],
            required: true
        },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, default: 'India' },
        postalCode: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    
    // Business Information
    businessInfo: {
        gstin: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format']
        },
        pan: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format']
        },
        registrationNumber: String,
        businessType: {
            type: String,
            enum: ['proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp'],
            default: 'proprietorship'
        },
        establishedYear: Number
    },
    
    // Financial Information
    financialInfo: {
        creditLimit: {
            type: Number,
            default: 0,
            min: 0
        },
        creditDays: {
            type: Number,
            default: 30,
            min: 0
        },
        currentBalance: {
            type: Number,
            default: 0
        },
        totalPurchases: {
            type: Number,
            default: 0,
            min: 0
        },
        totalPayments: {
            type: Number,
            default: 0,
            min: 0
        },
        lastPaymentDate: Date,
        paymentTerms: {
            type: String,
            enum: ['cash', 'credit', 'advance', 'cod'],
            default: 'credit'
        }
    },
    
    // Performance Metrics
    performance: {
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        onTimeDeliveryRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        qualityRating: {
            type: Number,
            min: 1,
            max: 5,
            default: 3
        },
        totalOrders: {
            type: Number,
            default: 0,
            min: 0
        },
        completedOrders: {
            type: Number,
            default: 0,
            min: 0
        },
        cancelledOrders: {
            type: Number,
            default: 0,
            min: 0
        },
        averageLeadTime: {
            type: Number,
            default: 7, // days
            min: 0
        }
    },
    
    // Product Categories
    productCategories: [{
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        },
        categoryName: String,
        specialization: String,
        minOrderQuantity: Number,
        leadTime: Number // in days
    }],
    
    // Bank Details
    bankDetails: [{
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        accountType: {
            type: String,
            enum: ['savings', 'current', 'cc', 'od']
        },
        branchName: String,
        isDefault: { type: Boolean, default: false }
    }],
    
    // Documents
    documents: [{
        type: {
            type: String,
            enum: ['gst_certificate', 'pan_card', 'registration_certificate', 'bank_statement', 'other'],
            required: true
        },
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
        expiryDate: Date,
        isVerified: { type: Boolean, default: false }
    }],
    
    // Status and Settings
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked', 'pending_approval'],
        default: 'active',
        index: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    
    // Additional Information
    notes: String,
    tags: [String],
    
    // Audit Information
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
supplierSchema.index({ name: 1 });
supplierSchema.index({ code: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ 'businessInfo.gstin': 1 });
supplierSchema.index({ 'contactInfo.companyEmail': 1 });
supplierSchema.index({ createdAt: -1 });

// Virtual for default billing address
supplierSchema.virtual('defaultBillingAddress').get(function() {
    return this.addresses.find(addr => addr.type === 'billing' && addr.isDefault) ||
           this.addresses.find(addr => addr.type === 'billing') ||
           this.addresses[0];
});

// Virtual for default shipping address
supplierSchema.virtual('defaultShippingAddress').get(function() {
    return this.addresses.find(addr => addr.type === 'shipping' && addr.isDefault) ||
           this.addresses.find(addr => addr.type === 'shipping') ||
           this.defaultBillingAddress;
});

// Virtual for outstanding balance
supplierSchema.virtual('outstandingBalance').get(function() {
    return this.financialInfo.totalPurchases - this.financialInfo.totalPayments;
});

// Virtual for performance score
supplierSchema.virtual('performanceScore').get(function() {
    const { rating, onTimeDeliveryRate, qualityRating } = this.performance;
    return ((rating + qualityRating) / 2 * 0.6) + (onTimeDeliveryRate / 100 * 0.4);
});

// Pre-save middleware to generate supplier code
supplierSchema.pre('save', async function(next) {
    if (this.isNew && !this.code) {
        const count = await this.constructor.countDocuments();
        this.code = `SUP${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Static method to get active suppliers
supplierSchema.statics.getActiveSuppliers = function(options = {}) {
    const query = { status: 'active', isApproved: true };
    
    if (options.category) {
        query['productCategories.category'] = options.category;
    }
    
    return this.find(query)
        .populate('productCategories.category', 'name')
        .sort({ name: 1 })
        .limit(options.limit || 50);
};

// Static method to get supplier performance report
supplierSchema.statics.getPerformanceReport = async function() {
    return this.aggregate([
        { $match: { status: 'active', isApproved: true } },
        {
            $project: {
                name: 1,
                code: 1,
                'performance.rating': 1,
                'performance.onTimeDeliveryRate': 1,
                'performance.qualityRating': 1,
                'performance.totalOrders': 1,
                'performance.completedOrders': 1,
                performanceScore: {
                    $add: [
                        { $multiply: [
                            { $divide: [
                                { $add: ['$performance.rating', '$performance.qualityRating'] },
                                2
                            ]},
                            0.6
                        ]},
                        { $multiply: [
                            { $divide: ['$performance.onTimeDeliveryRate', 100] },
                            0.4
                        ]}
                    ]
                }
            }
        },
        { $sort: { performanceScore: -1 } }
    ]);
};

// Instance method to update performance metrics
supplierSchema.methods.updatePerformance = function(orderData) {
    const { isCompleted, isCancelled, isOnTime, deliveryDays, qualityRating } = orderData;
    
    this.performance.totalOrders += 1;
    
    if (isCompleted) {
        this.performance.completedOrders += 1;
        
        // Update on-time delivery rate
        const totalCompleted = this.performance.completedOrders;
        const currentOnTimeCount = Math.floor((this.performance.onTimeDeliveryRate / 100) * (totalCompleted - 1));
        const newOnTimeCount = currentOnTimeCount + (isOnTime ? 1 : 0);
        this.performance.onTimeDeliveryRate = (newOnTimeCount / totalCompleted) * 100;
        
        // Update average lead time
        const currentAvgLeadTime = this.performance.averageLeadTime;
        this.performance.averageLeadTime = ((currentAvgLeadTime * (totalCompleted - 1)) + deliveryDays) / totalCompleted;
        
        // Update quality rating if provided
        if (qualityRating) {
            const currentQualityRating = this.performance.qualityRating;
            this.performance.qualityRating = ((currentQualityRating * (totalCompleted - 1)) + qualityRating) / totalCompleted;
        }
    }
    
    if (isCancelled) {
        this.performance.cancelledOrders += 1;
    }
    
    return this.save();
};

// Instance method to update financial info
supplierSchema.methods.updateFinancials = function(amount, type) {
    if (type === 'purchase') {
        this.financialInfo.totalPurchases += amount;
        this.financialInfo.currentBalance += amount;
    } else if (type === 'payment') {
        this.financialInfo.totalPayments += amount;
        this.financialInfo.currentBalance -= amount;
        this.financialInfo.lastPaymentDate = new Date();
    }
    
    return this.save();
};

// Instance method to approve supplier
supplierSchema.methods.approve = function(approvedBy) {
    this.isApproved = true;
    this.status = 'active';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    
    return this.save();
};

// Instance method to get formatted supplier data
supplierSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        name: this.name,
        code: this.code,
        type: this.type,
        contactInfo: this.contactInfo,
        defaultBillingAddress: this.defaultBillingAddress,
        defaultShippingAddress: this.defaultShippingAddress,
        businessInfo: this.businessInfo,
        financialInfo: this.financialInfo,
        outstandingBalance: this.outstandingBalance,
        performance: this.performance,
        performanceScore: this.performanceScore,
        status: this.status,
        isApproved: this.isApproved,
        productCategories: this.productCategories,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('Supplier', supplierSchema);
