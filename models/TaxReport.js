const mongoose = require('mongoose');

const taxReportSchema = new mongoose.Schema({
    reportType: {
        type: String,
        enum: ['GSTR1', 'GSTR3B', 'monthly_summary', 'quarterly_summary', 'annual_summary'],
        required: true,
        index: true
    },
    reportPeriod: {
        month: {
            type: Number,
            min: 1,
            max: 12
        },
        year: {
            type: Number,
            required: true
        },
        quarter: {
            type: Number,
            min: 1,
            max: 4
        },
        financialYear: String // e.g., "2024-25"
    },
    
    // Sales Summary
    salesSummary: {
        totalSales: { type: Number, default: 0 },
        taxableSales: { type: Number, default: 0 },
        exemptSales: { type: Number, default: 0 },
        nilRatedSales: { type: Number, default: 0 },
        totalTaxCollected: { type: Number, default: 0 },
        totalCGST: { type: Number, default: 0 },
        totalSGST: { type: Number, default: 0 },
        totalIGST: { type: Number, default: 0 }
    },
    
    // Purchase Summary (for GSTR3B)
    purchaseSummary: {
        totalPurchases: { type: Number, default: 0 },
        taxablePurchases: { type: Number, default: 0 },
        exemptPurchases: { type: Number, default: 0 },
        totalInputTaxCredit: { type: Number, default: 0 },
        totalCGSTCredit: { type: Number, default: 0 },
        totalSGSTCredit: { type: Number, default: 0 },
        totalIGSTCredit: { type: Number, default: 0 }
    },
    
    // GST Rate-wise Breakdown
    gstRateWiseBreakdown: [{
        gstRate: { type: Number, required: true },
        taxableAmount: { type: Number, default: 0 },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 },
        invoiceCount: { type: Number, default: 0 }
    }],
    
    // HSN-wise Summary (for GSTR1)
    hsnWiseSummary: [{
        hsnCode: { type: String, required: true },
        description: String,
        uom: { type: String, default: 'PCS' },
        totalQuantity: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        taxableValue: { type: Number, default: 0 },
        gstRate: { type: Number, required: true },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 }
    }],
    
    // Customer-wise Summary (B2B)
    b2bSummary: [{
        customerGSTIN: String,
        customerName: { type: String, required: true },
        customerState: String,
        invoiceCount: { type: Number, default: 0 },
        totalInvoiceValue: { type: Number, default: 0 },
        totalTaxableValue: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 }
    }],
    
    // B2C Summary (Non-GST customers)
    b2cSummary: {
        totalInvoices: { type: Number, default: 0 },
        totalInvoiceValue: { type: Number, default: 0 },
        totalTaxableValue: { type: Number, default: 0 },
        totalTax: { type: Number, default: 0 }
    },
    
    // Tax Liability Summary
    taxLiability: {
        totalOutputTax: { type: Number, default: 0 },
        totalInputTaxCredit: { type: Number, default: 0 },
        netTaxLiability: { type: Number, default: 0 },
        interestOnDelayedPayment: { type: Number, default: 0 },
        penalty: { type: Number, default: 0 },
        totalTaxPayable: { type: Number, default: 0 }
    },
    
    // Filing Details
    filingDetails: {
        filingStatus: {
            type: String,
            enum: ['draft', 'filed', 'revised', 'cancelled'],
            default: 'draft'
        },
        filingDate: Date,
        acknowledgmentNumber: String,
        filedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        dueDate: Date,
        isLate: { type: Boolean, default: false },
        lateFee: { type: Number, default: 0 }
    },
    
    // Report Generation Details
    generationDetails: {
        generatedAt: { type: Date, default: Date.now },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        dataSource: {
            fromDate: { type: Date, required: true },
            toDate: { type: Date, required: true },
            totalInvoicesProcessed: { type: Number, default: 0 },
            totalOrdersProcessed: { type: Number, default: 0 }
        },
        reportVersion: { type: String, default: '1.0' }
    },
    
    // Export Details
    exportDetails: {
        excelExported: { type: Boolean, default: false },
        excelExportedAt: Date,
        pdfExported: { type: Boolean, default: false },
        pdfExportedAt: Date,
        jsonExported: { type: Boolean, default: false },
        jsonExportedAt: Date
    },
    
    // Validation & Errors
    validationResults: {
        isValid: { type: Boolean, default: true },
        errors: [String],
        warnings: [String],
        validatedAt: Date
    },
    
    // Additional Metadata
    notes: String,
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Indexes for better performance
taxReportSchema.index({ reportType: 1, 'reportPeriod.year': 1, 'reportPeriod.month': 1 });
taxReportSchema.index({ 'reportPeriod.financialYear': 1 });
taxReportSchema.index({ 'filingDetails.filingStatus': 1 });
taxReportSchema.index({ 'generationDetails.generatedAt': -1 });

// Static method to generate monthly tax report
taxReportSchema.statics.generateMonthlyReport = async function(month, year, generatedBy) {
    const Invoice = require('./Invoice');
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Get all invoices for the period
    const invoices = await Invoice.find({
        invoiceDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['sent', 'paid'] },
        isActive: true
    }).populate('items.product');
    
    // Calculate summaries
    const salesSummary = {
        totalSales: 0,
        taxableSales: 0,
        exemptSales: 0,
        nilRatedSales: 0,
        totalTaxCollected: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalIGST: 0
    };
    
    const gstRateWiseBreakdown = new Map();
    const hsnWiseSummary = new Map();
    const b2bSummary = new Map();
    let b2cSummary = {
        totalInvoices: 0,
        totalInvoiceValue: 0,
        totalTaxableValue: 0,
        totalTax: 0
    };
    
    invoices.forEach(invoice => {
        salesSummary.totalSales += invoice.pricing.grandTotal;
        salesSummary.taxableSales += invoice.pricing.taxableAmount;
        salesSummary.totalTaxCollected += invoice.pricing.totalGST;
        salesSummary.totalCGST += invoice.pricing.totalCGST;
        salesSummary.totalSGST += invoice.pricing.totalSGST;
        salesSummary.totalIGST += invoice.pricing.totalIGST;
        
        // Process each item
        invoice.items.forEach(item => {
            // GST Rate-wise breakdown
            const gstKey = item.gstRate;
            if (!gstRateWiseBreakdown.has(gstKey)) {
                gstRateWiseBreakdown.set(gstKey, {
                    gstRate: item.gstRate,
                    taxableAmount: 0,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 0,
                    totalTax: 0,
                    invoiceCount: 0
                });
            }
            const gstData = gstRateWiseBreakdown.get(gstKey);
            gstData.taxableAmount += item.taxableAmount;
            gstData.cgstAmount += item.cgst;
            gstData.sgstAmount += item.sgst;
            gstData.igstAmount += item.igst;
            gstData.totalTax += (item.cgst + item.sgst + item.igst);
            
            // HSN-wise summary
            const hsnKey = item.hsnCode;
            if (!hsnWiseSummary.has(hsnKey)) {
                hsnWiseSummary.set(hsnKey, {
                    hsnCode: item.hsnCode,
                    description: item.description || item.name,
                    uom: item.unit || 'PCS',
                    totalQuantity: 0,
                    totalValue: 0,
                    taxableValue: 0,
                    gstRate: item.gstRate,
                    cgstAmount: 0,
                    sgstAmount: 0,
                    igstAmount: 0,
                    totalTax: 0
                });
            }
            const hsnData = hsnWiseSummary.get(hsnKey);
            hsnData.totalQuantity += item.quantity;
            hsnData.totalValue += item.totalAmount;
            hsnData.taxableValue += item.taxableAmount;
            hsnData.cgstAmount += item.cgst;
            hsnData.sgstAmount += item.sgst;
            hsnData.igstAmount += item.igst;
            hsnData.totalTax += (item.cgst + item.sgst + item.igst);
        });
        
        // B2B vs B2C classification
        if (invoice.customerDetails.gstin) {
            // B2B Customer
            const b2bKey = invoice.customerDetails.gstin;
            if (!b2bSummary.has(b2bKey)) {
                b2bSummary.set(b2bKey, {
                    customerGSTIN: invoice.customerDetails.gstin,
                    customerName: invoice.customerDetails.name,
                    customerState: invoice.customerDetails.billingAddress.state,
                    invoiceCount: 0,
                    totalInvoiceValue: 0,
                    totalTaxableValue: 0,
                    totalTax: 0
                });
            }
            const b2bData = b2bSummary.get(b2bKey);
            b2bData.invoiceCount += 1;
            b2bData.totalInvoiceValue += invoice.pricing.grandTotal;
            b2bData.totalTaxableValue += invoice.pricing.taxableAmount;
            b2bData.totalTax += invoice.pricing.totalGST;
        } else {
            // B2C Customer
            b2cSummary.totalInvoices += 1;
            b2cSummary.totalInvoiceValue += invoice.pricing.grandTotal;
            b2cSummary.totalTaxableValue += invoice.pricing.taxableAmount;
            b2cSummary.totalTax += invoice.pricing.totalGST;
        }
    });
    
    // Create report
    const report = new this({
        reportType: 'monthly_summary',
        reportPeriod: {
            month,
            year,
            financialYear: month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`
        },
        salesSummary,
        gstRateWiseBreakdown: Array.from(gstRateWiseBreakdown.values()),
        hsnWiseSummary: Array.from(hsnWiseSummary.values()),
        b2bSummary: Array.from(b2bSummary.values()),
        b2cSummary,
        generationDetails: {
            generatedBy,
            dataSource: {
                fromDate: startDate,
                toDate: endDate,
                totalInvoicesProcessed: invoices.length
            }
        }
    });
    
    return report.save();
};

// Instance method to validate report data
taxReportSchema.methods.validateReport = function() {
    const errors = [];
    const warnings = [];
    
    // Basic validations
    if (this.salesSummary.totalSales <= 0) {
        warnings.push('No sales data found for the period');
    }
    
    if (this.salesSummary.totalTaxCollected < 0) {
        errors.push('Total tax collected cannot be negative');
    }
    
    // GST calculation validation
    const calculatedGST = this.salesSummary.totalCGST + this.salesSummary.totalSGST + this.salesSummary.totalIGST;
    if (Math.abs(calculatedGST - this.salesSummary.totalTaxCollected) > 1) {
        errors.push('GST calculation mismatch');
    }
    
    this.validationResults = {
        isValid: errors.length === 0,
        errors,
        warnings,
        validatedAt: new Date()
    };
    
    return this.save();
};

// Instance method to mark as filed
taxReportSchema.methods.markAsFiled = function(acknowledgmentNumber, filedBy) {
    this.filingDetails.filingStatus = 'filed';
    this.filingDetails.filingDate = new Date();
    this.filingDetails.acknowledgmentNumber = acknowledgmentNumber;
    this.filingDetails.filedBy = filedBy;
    
    return this.save();
};

module.exports = mongoose.model('TaxReport', taxReportSchema);
