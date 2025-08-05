const mongoose = require('mongoose');

const deliveryCompanySchema = new mongoose.Schema({
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
        required: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['local', 'regional', 'national', 'international'],
        default: 'local'
    },
    
    // Contact Information
    contactInfo: {
        primaryContact: {
            name: String,
            designation: String,
            phone: String,
            email: String
        },
        companyPhone: {
            type: String,
            required: true
        },
        companyEmail: {
            type: String,
            required: true
        },
        website: String,
        supportPhone: String,
        supportEmail: String
    },
    
    // Address Information
    address: {
        street: String,
        area: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        postalCode: String,
        landmark: String
    },
    
    // Service Areas
    serviceAreas: [{
        state: String,
        cities: [String],
        postalCodes: [String],
        isActive: { type: Boolean, default: true }
    }],
    
    // Pricing Structure
    pricing: {
        baseRate: { type: Number, default: 0 },
        perKgRate: { type: Number, default: 0 },
        perKmRate: { type: Number, default: 0 },
        codCharges: { type: Number, default: 0 },
        codChargeType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
        fuelSurcharge: { type: Number, default: 0 },
        handlingCharges: { type: Number, default: 0 },
        packagingCharges: { type: Number, default: 0 },
        insuranceRate: { type: Number, default: 0 },
        minimumCharges: { type: Number, default: 0 },
        freeDeliveryThreshold: { type: Number, default: 0 }
    },
    
    // Service Features
    services: {
        codAvailable: { type: Boolean, default: true },
        expressDelivery: { type: Boolean, default: false },
        sameDay: { type: Boolean, default: false },
        nextDay: { type: Boolean, default: false },
        scheduledDelivery: { type: Boolean, default: false },
        trackingAvailable: { type: Boolean, default: true },
        pickupService: { type: Boolean, default: true },
        returnService: { type: Boolean, default: true },
        bulkDiscount: { type: Boolean, default: false },
        insuranceAvailable: { type: Boolean, default: false }
    },
    
    // Delivery Time
    deliveryTime: {
        standard: { type: String, default: '3-5 days' },
        express: { type: String, default: '1-2 days' },
        sameDay: { type: String, default: 'Same day' },
        estimatedDays: { type: Number, default: 3 }
    },
    
    // Weight and Size Limits
    limits: {
        maxWeight: { type: Number, default: 50 }, // kg
        maxLength: { type: Number, default: 100 }, // cm
        maxWidth: { type: Number, default: 100 }, // cm
        maxHeight: { type: Number, default: 100 }, // cm
        maxValue: { type: Number, default: 100000 } // INR
    },
    
    // API Integration (if available)
    apiConfig: {
        hasApi: { type: Boolean, default: false },
        apiUrl: String,
        apiKey: String,
        apiSecret: String,
        trackingUrl: String,
        webhookUrl: String,
        isActive: { type: Boolean, default: false }
    },
    
    // Performance Metrics
    performance: {
        rating: { type: Number, default: 0, min: 0, max: 5 },
        totalOrders: { type: Number, default: 0 },
        successfulDeliveries: { type: Number, default: 0 },
        failedDeliveries: { type: Number, default: 0 },
        averageDeliveryTime: { type: Number, default: 0 }, // in days
        customerRating: { type: Number, default: 0, min: 0, max: 5 },
        onTimeDeliveryRate: { type: Number, default: 0 }, // percentage
        lastPerformanceUpdate: { type: Date, default: Date.now }
    },
    
    // Business Details
    businessInfo: {
        gstNumber: String,
        panNumber: String,
        licenseNumber: String,
        registrationNumber: String,
        establishedYear: Number,
        employeeCount: Number,
        vehicleCount: Number
    },
    
    // Bank Details
    bankDetails: {
        bankName: String,
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
        branchName: String
    },
    
    // Documents
    documents: [{
        type: {
            type: String,
            enum: ['license', 'gst_certificate', 'pan_card', 'registration', 'insurance', 'other'],
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
        enum: ['active', 'inactive', 'suspended', 'pending_approval'],
        default: 'pending_approval',
        index: true
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isPreferred: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    
    // Operational Hours
    operationalHours: {
        monday: { start: String, end: String, isActive: Boolean },
        tuesday: { start: String, end: String, isActive: Boolean },
        wednesday: { start: String, end: String, isActive: Boolean },
        thursday: { start: String, end: String, isActive: Boolean },
        friday: { start: String, end: String, isActive: Boolean },
        saturday: { start: String, end: String, isActive: Boolean },
        sunday: { start: String, end: String, isActive: Boolean }
    },
    
    // Notes and Comments
    notes: {
        internal: String,
        public: String,
        specialInstructions: String
    },
    
    // Audit Fields
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastContactDate: Date,
    nextReviewDate: Date,
    
    // Metadata
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
deliveryCompanySchema.index({ name: 1, status: 1 });
deliveryCompanySchema.index({ code: 1 });
deliveryCompanySchema.index({ 'serviceAreas.state': 1, 'serviceAreas.cities': 1 });
deliveryCompanySchema.index({ status: 1, isActive: 1 });
deliveryCompanySchema.index({ isPreferred: -1, priority: -1 });
deliveryCompanySchema.index({ 'performance.rating': -1 });

// Virtual for success rate
deliveryCompanySchema.virtual('successRate').get(function() {
    if (this.performance.totalOrders === 0) return 0;
    return ((this.performance.successfulDeliveries / this.performance.totalOrders) * 100).toFixed(2);
});

// Virtual for full address
deliveryCompanySchema.virtual('fullAddress').get(function() {
    const addr = this.address;
    return [addr.street, addr.area, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ');
});

// Pre-save middleware to generate code if not provided
deliveryCompanySchema.pre('save', function(next) {
    if (!this.code && this.name) {
        this.code = this.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    }
    next();
});

// Static method to find companies serving a location
deliveryCompanySchema.statics.findByLocation = function(state, city, postalCode) {
    return this.find({
        status: 'active',
        isActive: true,
        $or: [
            { 'serviceAreas.state': state, 'serviceAreas.cities': city },
            { 'serviceAreas.postalCodes': postalCode }
        ]
    }).sort({ isPreferred: -1, priority: -1, 'performance.rating': -1 });
};

// Instance method to check if company serves a location
deliveryCompanySchema.methods.servesLocation = function(state, city, postalCode) {
    return this.serviceAreas.some(area => 
        area.isActive && (
            (area.state === state && area.cities.includes(city)) ||
            area.postalCodes.includes(postalCode)
        )
    );
};

// Instance method to calculate delivery charges
deliveryCompanySchema.methods.calculateCharges = function(weight, distance, codAmount = 0, orderValue = 0) {
    let charges = this.pricing.baseRate;
    
    // Weight-based charges
    if (weight > 1) {
        charges += (weight - 1) * this.pricing.perKgRate;
    }
    
    // Distance-based charges
    if (distance && this.pricing.perKmRate > 0) {
        charges += distance * this.pricing.perKmRate;
    }
    
    // COD charges
    if (codAmount > 0) {
        if (this.pricing.codChargeType === 'percentage') {
            charges += (codAmount * this.pricing.codCharges) / 100;
        } else {
            charges += this.pricing.codCharges;
        }
    }
    
    // Additional charges
    charges += this.pricing.fuelSurcharge;
    charges += this.pricing.handlingCharges;
    charges += this.pricing.packagingCharges;
    
    // Insurance
    if (this.services.insuranceAvailable && orderValue > 0) {
        charges += (orderValue * this.pricing.insuranceRate) / 100;
    }
    
    // Apply minimum charges
    charges = Math.max(charges, this.pricing.minimumCharges);
    
    // Free delivery threshold
    if (orderValue >= this.pricing.freeDeliveryThreshold && this.pricing.freeDeliveryThreshold > 0) {
        charges = 0;
    }
    
    return Math.round(charges * 100) / 100; // Round to 2 decimal places
};

// Instance method to update performance metrics
deliveryCompanySchema.methods.updatePerformance = function(deliveryData) {
    this.performance.totalOrders += 1;
    
    if (deliveryData.isSuccessful) {
        this.performance.successfulDeliveries += 1;
    } else {
        this.performance.failedDeliveries += 1;
    }
    
    if (deliveryData.deliveryTime) {
        const currentAvg = this.performance.averageDeliveryTime;
        const totalOrders = this.performance.totalOrders;
        this.performance.averageDeliveryTime = ((currentAvg * (totalOrders - 1)) + deliveryData.deliveryTime) / totalOrders;
    }
    
    if (deliveryData.customerRating) {
        const currentRating = this.performance.customerRating;
        const totalOrders = this.performance.totalOrders;
        this.performance.customerRating = ((currentRating * (totalOrders - 1)) + deliveryData.customerRating) / totalOrders;
    }
    
    this.performance.lastPerformanceUpdate = new Date();
    
    return this.save();
};

module.exports = mongoose.model('DeliveryCompany', deliveryCompanySchema);
