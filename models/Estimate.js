const mongoose = require('mongoose');

const estimateSchema = new mongoose.Schema({
    estimateNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    estimateDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    validUntil: {
        type: Date,
        required: true,
        default: function() {
            // Default validity: 30 days from estimate date
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    },
    
    // Company Details
    companyDetails: {
        name: { type: String, required: true, default: 'Ghanshyam Murti Bhandar' },
        address: { type: String, required: true, default: 'Shree Vashunadhara Soc. Block No 153, Cancal Road, Jilla Garden, Rajkot, Gujarat, 360002' },
        phone: { type: String, required: true, default: '+91 9999999999' },
        email: { type: String, required: true, default: 'info@ghanshyammurtibhandar.com' },
        gstin: { type: String, default: '24XXXXX1234X1ZX' },
        website: { type: String, default: 'www.ghanshyammurtibhandar.com' }
    },

    // Customer Details
    customerDetails: {
        name: { type: String, required: true },
        email: String,
        phone: String,
        gstin: String,
        billingAddress: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: { type: String, default: 'India' }
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: { type: String, default: 'India' }
        }
    },

    // Estimate Items
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: { type: String, required: true },
        description: String,
        hsnCode: { type: String, default: '9999' },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: 'PCS' },
        rate: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        taxableAmount: { type: Number, required: true },
        gstRate: { type: Number, required: true, min: 0, max: 100 },
        cgst: { type: Number, default: 0 },
        sgst: { type: Number, default: 0 },
        igst: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true }
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

    // Estimate Status
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'],
        default: 'draft',
        index: true
    },

    // Tax Details
    taxDetails: {
        placeOfSupply: String,
        isInterState: { type: Boolean, default: false },
        reverseCharge: { type: Boolean, default: false },
        taxType: { type: String, enum: ['GST', 'IGST', 'NON_GST'], default: 'GST' },
        isGSTApplicable: { type: Boolean, default: true }
    },

    // QR Code & Barcode
    qrCode: String,
    barcode: String,
    qrCodeData: {
        estimateNumber: String,
        amount: Number,
        validUntil: Date,
        companyName: String
    },

    // Additional Details
    notes: String,
    termsAndConditions: {
        type: String,
        default: 'This estimate is valid for 30 days. Prices are subject to change without notice.'
    },

    // File URLs
    pdfUrl: String,
    thermalPrintUrl: String,
    format4x6Url: String,

    // Tracking
    sentAt: Date,
    viewedAt: Date,
    downloadedAt: Date,
    printedAt: Date,
    acceptedAt: Date,
    rejectedAt: Date,

    // Conversion tracking
    convertedToInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    convertedAt: Date,

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
estimateSchema.index({ estimateNumber: 1 });
estimateSchema.index({ user: 1, estimateDate: -1 });
estimateSchema.index({ status: 1, estimateDate: -1 });
estimateSchema.index({ 'customerDetails.email': 1 });
estimateSchema.index({ validUntil: 1 });

// Virtual for formatted estimate number
estimateSchema.virtual('formattedEstimateNumber').get(function() {
    return `EST-${this.estimateNumber}`;
});

// Virtual to check if estimate is expired
estimateSchema.virtual('isExpired').get(function() {
    return new Date() > this.validUntil;
});

// Virtual to check if estimate is valid
estimateSchema.virtual('isValid').get(function() {
    return !this.isExpired && this.status !== 'expired' && this.status !== 'converted';
});

// Pre-save middleware to generate estimate number
estimateSchema.pre('save', async function(next) {
    if (this.isNew && !this.estimateNumber) {
        try {
            const lastEstimate = await this.constructor.findOne(
                {}, 
                {}, 
                { sort: { 'createdAt': -1 } }
            );
            
            let nextNumber = 1;
            if (lastEstimate && lastEstimate.estimateNumber) {
                const lastNumber = parseInt(lastEstimate.estimateNumber);
                nextNumber = lastNumber + 1;
            }
            
            this.estimateNumber = nextNumber.toString().padStart(6, '0');
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Pre-save middleware to update pricing calculations
estimateSchema.pre('save', function(next) {
    if (this.isModified('items') || this.isNew) {
        this.calculatePricing();
    }
    next();
});

// Instance method to calculate pricing
estimateSchema.methods.calculatePricing = function() {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    this.items.forEach(item => {
        const itemSubtotal = item.quantity * item.rate;
        const itemDiscount = item.discount || 0;
        const taxableAmount = itemSubtotal - itemDiscount;
        
        item.taxableAmount = taxableAmount;
        
        if (this.taxDetails.isGSTApplicable && this.taxDetails.taxType !== 'NON_GST') {
            const gstAmount = (taxableAmount * item.gstRate) / 100;
            
            if (this.taxDetails.isInterState) {
                item.igst = gstAmount;
                item.cgst = 0;
                item.sgst = 0;
                totalIGST += gstAmount;
            } else {
                item.cgst = gstAmount / 2;
                item.sgst = gstAmount / 2;
                item.igst = 0;
                totalCGST += gstAmount / 2;
                totalSGST += gstAmount / 2;
            }
        } else {
            item.cgst = 0;
            item.sgst = 0;
            item.igst = 0;
        }
        
        item.totalAmount = taxableAmount + item.cgst + item.sgst + item.igst;
        
        subtotal += itemSubtotal;
        totalDiscount += itemDiscount;
    });

    const taxableAmount = subtotal - totalDiscount;
    const totalGST = totalCGST + totalSGST + totalIGST;
    const grandTotal = taxableAmount + totalGST + (this.pricing.shippingCharges || 0) + (this.pricing.otherCharges || 0);

    this.pricing = {
        subtotal: Math.round(subtotal * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        taxableAmount: Math.round(taxableAmount * 100) / 100,
        totalCGST: Math.round(totalCGST * 100) / 100,
        totalSGST: Math.round(totalSGST * 100) / 100,
        totalIGST: Math.round(totalIGST * 100) / 100,
        totalGST: Math.round(totalGST * 100) / 100,
        shippingCharges: this.pricing.shippingCharges || 0,
        otherCharges: this.pricing.otherCharges || 0,
        grandTotal: Math.round(grandTotal * 100) / 100
    };

    return this;
};

// Static method to generate estimate from order
estimateSchema.statics.generateFromOrder = async function(orderId, options = {}) {
    const Order = require('./Order');
    const order = await Order.findById(orderId)
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name description hsnCode');

    if (!order) {
        throw new Error('Order not found');
    }

    const estimateData = {
        order: orderId,
        user: order.user._id,
        customerDetails: {
            name: `${order.user.firstName} ${order.user.lastName}`.trim(),
            email: order.user.email,
            phone: order.user.phone,
            billingAddress: order.billingAddress,
            shippingAddress: order.shippingAddress
        },
        items: order.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            description: item.product.description,
            hsnCode: item.product.hsnCode || '9999',
            quantity: item.quantity,
            rate: item.price,
            gstRate: item.gstRate || 18,
            taxableAmount: item.quantity * item.price
        })),
        taxDetails: {
            isGSTApplicable: options.isGSTApplicable !== false,
            taxType: options.taxType || 'GST',
            isInterState: options.isInterState || false
        },
        companyDetails: options.companyDetails || {},
        notes: options.notes,
        termsAndConditions: options.termsAndConditions,
        createdBy: options.createdBy
    };

    const estimate = new this(estimateData);
    await estimate.save();
    return estimate;
};

// Static method to generate estimate from cart items
estimateSchema.statics.generateFromCart = async function(userId, cartItems, options = {}) {
    const User = require('./User');
    const Product = require('./Product');

    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    const populatedItems = [];
    for (const cartItem of cartItems) {
        const product = await Product.findById(cartItem.productId);
        if (product) {
            populatedItems.push({
                product: product._id,
                name: product.name,
                description: product.description,
                hsnCode: product.hsnCode || '9999',
                quantity: cartItem.quantity,
                rate: cartItem.price || product.price,
                gstRate: product.gstRate || 18,
                taxableAmount: cartItem.quantity * (cartItem.price || product.price)
            });
        }
    }

    const estimateData = {
        user: userId,
        customerDetails: {
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            phone: user.phone,
            billingAddress: options.billingAddress,
            shippingAddress: options.shippingAddress
        },
        items: populatedItems,
        taxDetails: {
            isGSTApplicable: options.isGSTApplicable !== false,
            taxType: options.taxType || 'GST',
            isInterState: options.isInterState || false
        },
        companyDetails: options.companyDetails || {},
        notes: options.notes,
        termsAndConditions: options.termsAndConditions,
        createdBy: options.createdBy
    };

    const estimate = new this(estimateData);
    await estimate.save();
    return estimate;
};

// Instance method to generate QR code data
estimateSchema.methods.generateQRCode = function() {
    this.qrCodeData = {
        estimateNumber: this.formattedEstimateNumber,
        amount: this.pricing.grandTotal,
        validUntil: this.validUntil,
        companyName: this.companyDetails.name
    };

    // QR code string for estimate details
    this.qrCode = `EST:${this.formattedEstimateNumber}|AMT:${this.pricing.grandTotal}|VALID:${this.validUntil.toISOString().split('T')[0]}|COMPANY:${this.companyDetails.name}`;

    return this.save();
};

// Instance method to convert estimate to invoice
estimateSchema.methods.convertToInvoice = async function(options = {}) {
    if (this.status === 'converted') {
        throw new Error('Estimate already converted to invoice');
    }

    if (this.isExpired) {
        throw new Error('Cannot convert expired estimate to invoice');
    }

    const Invoice = require('./Invoice');

    const invoiceData = {
        order: this.order,
        user: this.user,
        customerDetails: this.customerDetails,
        items: this.items,
        pricing: this.pricing,
        taxDetails: this.taxDetails,
        companyDetails: this.companyDetails,
        notes: this.notes,
        termsAndConditions: this.termsAndConditions,
        createdBy: options.createdBy || this.createdBy
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    // Update estimate status
    this.status = 'converted';
    this.convertedToInvoice = invoice._id;
    this.convertedAt = new Date();
    await this.save();

    return invoice;
};

// Instance method to mark as accepted
estimateSchema.methods.markAsAccepted = function() {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    return this.save();
};

// Instance method to mark as rejected
estimateSchema.methods.markAsRejected = function() {
    this.status = 'rejected';
    this.rejectedAt = new Date();
    return this.save();
};

// Instance method to check and update expired status
estimateSchema.methods.checkAndUpdateExpiry = function() {
    if (this.isExpired && this.status !== 'expired' && this.status !== 'converted') {
        this.status = 'expired';
        return this.save();
    }
    return Promise.resolve(this);
};

module.exports = mongoose.model('Estimate', estimateSchema);
