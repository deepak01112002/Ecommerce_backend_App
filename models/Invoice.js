const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
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
    invoiceDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    dueDate: {
        type: Date
    },
    // Company Details
    companyDetails: {
        name: { type: String, default: 'Ghanshyam Murti Bhandar' },
        address: { type: String, default: 'Shop Address, City, State' },
        gstin: { type: String, default: 'GST_NUMBER_HERE' },
        phone: { type: String, default: '+91-XXXXXXXXXX' },
        email: { type: String, default: 'info@ghanshyammurti.com' },
        website: { type: String, default: 'www.ghanshyammurti.com' }
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
    // Invoice Items
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
        roundOff: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true, min: 0 }
    },
    // Payment Details
    paymentDetails: {
        method: { type: String, required: true },
        status: { 
            type: String, 
            enum: ['pending', 'paid', 'partial', 'overdue', 'cancelled'],
            default: 'pending'
        },
        paidAmount: { type: Number, default: 0, min: 0 },
        balanceAmount: { type: Number, default: 0, min: 0 },
        paymentDate: Date,
        transactionId: String,
        paymentReference: String
    },
    // Invoice Status
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'cancelled', 'refunded'],
        default: 'draft',
        index: true
    },
    // Tax Details
    taxDetails: {
        placeOfSupply: String,
        isInterState: { type: Boolean, default: false },
        reverseCharge: { type: Boolean, default: false },
        taxType: { type: String, enum: ['GST', 'IGST'], default: 'GST' }
    },
    // QR Code & Barcode
    qrCode: String,
    barcode: String,
    qrCodeData: {
        upiId: String,
        amount: Number,
        invoiceNumber: String,
        merchantName: String
    },
    // Additional Details
    notes: String,
    termsAndConditions: {
        type: String,
        default: 'Thank you for your business. Payment is due within 30 days.'
    },
    // File URLs
    pdfUrl: String,
    thermalPrintUrl: String,
    // Tracking
    sentAt: Date,
    viewedAt: Date,
    downloadedAt: Date,
    printedAt: Date,
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
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ user: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1, invoiceDate: -1 });
invoiceSchema.index({ 'paymentDetails.status': 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ createdAt: -1 });

// Virtual for formatted invoice number
invoiceSchema.virtual('formattedInvoiceNumber').get(function() {
    return `INV-${this.invoiceNumber}`;
});

// Virtual for amount in words
invoiceSchema.virtual('amountInWords').get(function() {
    // Will implement number to words conversion
    return `Rupees ${this.pricing.grandTotal} Only`;
});

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
    if (this.isNew && !this.invoiceNumber) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        
        // Find last invoice number for current month
        const lastInvoice = await this.constructor.findOne({
            invoiceNumber: new RegExp(`^${year}${month}`)
        }).sort({ invoiceNumber: -1 });
        
        let sequence = 1;
        if (lastInvoice) {
            const lastSequence = parseInt(lastInvoice.invoiceNumber.slice(-4));
            sequence = lastSequence + 1;
        }
        
        this.invoiceNumber = `${year}${month}${String(sequence).padStart(4, '0')}`;
    }
    
    // Calculate balance amount
    this.paymentDetails.balanceAmount = this.pricing.grandTotal - this.paymentDetails.paidAmount;
    
    // Update payment status based on paid amount
    if (this.paymentDetails.paidAmount === 0) {
        this.paymentDetails.status = 'pending';
    } else if (this.paymentDetails.paidAmount >= this.pricing.grandTotal) {
        this.paymentDetails.status = 'paid';
    } else {
        this.paymentDetails.status = 'partial';
    }
    
    next();
});

// Static method to generate invoice from order
invoiceSchema.statics.generateFromOrder = async function(orderId, additionalData = {}) {
    const Order = require('./Order');
    const User = require('./User');
    const Product = require('./Product');
    
    const order = await Order.findById(orderId)
        .populate('user')
        .populate('items.product');
    
    if (!order) {
        throw new Error('Order not found');
    }
    
    // Check if invoice already exists
    const existingInvoice = await this.findOne({ order: orderId });
    if (existingInvoice) {
        throw new Error('Invoice already exists for this order');
    }
    
    // Prepare invoice items with GST calculation
    const invoiceItems = order.items.map(item => {
        const gstRate = item.product.gstRate || 18; // Default 18% GST
        const taxableAmount = item.unitPrice * item.quantity - (item.discount || 0);
        const gstAmount = (taxableAmount * gstRate) / 100;
        
        // Determine if inter-state or intra-state
        const isInterState = order.billingAddress.state !== order.shippingAddress.state;
        
        return {
            product: item.product._id,
            name: item.product.name,
            description: item.product.description,
            hsnCode: item.product.hsnCode || '9999',
            quantity: item.quantity,
            unit: 'PCS',
            rate: item.unitPrice,
            discount: item.discount || 0,
            taxableAmount: taxableAmount,
            gstRate: gstRate,
            cgst: isInterState ? 0 : gstAmount / 2,
            sgst: isInterState ? 0 : gstAmount / 2,
            igst: isInterState ? gstAmount : 0,
            totalAmount: taxableAmount + gstAmount
        };
    });
    
    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const totalDiscount = invoiceItems.reduce((sum, item) => sum + item.discount, 0);
    const taxableAmount = subtotal - totalDiscount;
    const totalCGST = invoiceItems.reduce((sum, item) => sum + item.cgst, 0);
    const totalSGST = invoiceItems.reduce((sum, item) => sum + item.sgst, 0);
    const totalIGST = invoiceItems.reduce((sum, item) => sum + item.igst, 0);
    const totalGST = totalCGST + totalSGST + totalIGST;
    const grandTotal = taxableAmount + totalGST + (order.pricing.shipping || 0);
    
    // Create invoice
    const invoice = new this({
        order: orderId,
        user: order.user._id,
        customerDetails: {
            name: `${order.user.firstName} ${order.user.lastName}`,
            email: order.user.email,
            phone: order.user.phone,
            billingAddress: {
                street: order.billingAddress.addressLine1,
                city: order.billingAddress.city,
                state: order.billingAddress.state,
                postalCode: order.billingAddress.postalCode,
                country: order.billingAddress.country
            },
            shippingAddress: {
                street: order.shippingAddress.addressLine1,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                postalCode: order.shippingAddress.postalCode,
                country: order.shippingAddress.country
            }
        },
        items: invoiceItems,
        pricing: {
            subtotal,
            totalDiscount,
            taxableAmount,
            totalCGST,
            totalSGST,
            totalIGST,
            totalGST,
            shippingCharges: order.pricing.shipping || 0,
            grandTotal
        },
        paymentDetails: {
            method: order.paymentInfo.method,
            status: order.paymentInfo.status === 'completed' ? 'paid' : 'pending',
            paidAmount: order.paymentInfo.status === 'completed' ? grandTotal : 0
        },
        taxDetails: {
            placeOfSupply: order.shippingAddress.state,
            isInterState: order.billingAddress.state !== order.shippingAddress.state
        },
        ...additionalData
    });
    
    return invoice.save();
};

// Instance method to mark as paid
invoiceSchema.methods.markAsPaid = function(paymentData = {}) {
    this.paymentDetails.status = 'paid';
    this.paymentDetails.paidAmount = this.pricing.grandTotal;
    this.paymentDetails.balanceAmount = 0;
    this.paymentDetails.paymentDate = paymentData.paymentDate || new Date();
    this.paymentDetails.transactionId = paymentData.transactionId;
    this.paymentDetails.paymentReference = paymentData.paymentReference;
    this.status = 'paid';
    
    return this.save();
};

// Instance method to generate QR code data
invoiceSchema.methods.generateQRCode = function() {
    this.qrCodeData = {
        upiId: 'merchant@upi',
        amount: this.pricing.grandTotal,
        invoiceNumber: this.formattedInvoiceNumber,
        merchantName: this.companyDetails.name
    };
    
    // QR code string for UPI payment
    this.qrCode = `upi://pay?pa=${this.qrCodeData.upiId}&pn=${this.qrCodeData.merchantName}&am=${this.qrCodeData.amount}&tn=Invoice%20${this.qrCodeData.invoiceNumber}`;
    
    return this.save();
};

module.exports = mongoose.model('Invoice', invoiceSchema);
