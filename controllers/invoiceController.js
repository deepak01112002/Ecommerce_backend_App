const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { asyncHandler } = require('../middlewares/errorHandler');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { Canvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Generate invoice from order
exports.generateInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { companyDetails, notes, termsAndConditions } = req.body;

    try {
        const invoice = await Invoice.generateFromOrder(orderId, {
            companyDetails,
            notes,
            termsAndConditions,
            createdBy: req.user._id
        });

        // Generate QR code
        await invoice.generateQRCode();

        res.success({
            invoice: {
                _id: invoice._id,
                invoiceNumber: invoice.formattedInvoiceNumber,
                invoiceDate: invoice.invoiceDate,
                customerName: invoice.customerDetails.name,
                grandTotal: invoice.pricing.grandTotal,
                status: invoice.status,
                paymentStatus: invoice.paymentDetails.status
            }
        }, 'Invoice generated successfully', 201);
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Get all invoices (Admin)
exports.getAllInvoices = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        status,
        paymentStatus,
        startDate,
        endDate,
        search
    } = req.query;

    const query = { isActive: true };

    // Filters
    if (status) query.status = status;
    if (paymentStatus) query['paymentDetails.status'] = paymentStatus;
    
    if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    if (search) {
        query.$or = [
            { invoiceNumber: new RegExp(search, 'i') },
            { 'customerDetails.name': new RegExp(search, 'i') },
            { 'customerDetails.email': new RegExp(search, 'i') }
        ];
    }

    const invoices = await Invoice.find(query)
        .populate('order', 'orderNumber')
        .populate('user', 'firstName lastName email')
        .sort({ invoiceDate: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Invoice.countDocuments(query);

    const formattedInvoices = invoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.formattedInvoiceNumber,
        invoiceDate: invoice.invoiceDate,
        orderNumber: invoice.order?.orderNumber,
        customerName: invoice.customerDetails.name,
        customerEmail: invoice.customerDetails.email,
        grandTotal: invoice.pricing.grandTotal,
        paidAmount: invoice.paymentDetails.paidAmount,
        balanceAmount: invoice.paymentDetails.balanceAmount,
        status: invoice.status,
        paymentStatus: invoice.paymentDetails.status,
        paymentMethod: invoice.paymentDetails.method,
        createdAt: invoice.createdAt
    }));

    res.success({
        invoices: formattedInvoices,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        },
        summary: {
            totalInvoices: total,
            totalAmount: invoices.reduce((sum, inv) => sum + inv.pricing.grandTotal, 0),
            paidAmount: invoices.reduce((sum, inv) => sum + inv.paymentDetails.paidAmount, 0),
            pendingAmount: invoices.reduce((sum, inv) => sum + inv.paymentDetails.balanceAmount, 0)
        }
    }, 'Invoices retrieved successfully');
});

// Get single invoice
exports.getInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
        .populate('order', 'orderNumber status')
        .populate('user', 'firstName lastName email phone')
        .populate('items.product', 'name description images');

    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    // Update viewed timestamp
    invoice.viewedAt = new Date();
    await invoice.save();

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.formattedInvoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            companyDetails: invoice.companyDetails,
            customerDetails: invoice.customerDetails,
            items: invoice.items.map(item => ({
                _id: item._id,
                productName: item.name,
                description: item.description,
                hsnCode: item.hsnCode,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                discount: item.discount,
                taxableAmount: item.taxableAmount,
                gstRate: item.gstRate,
                cgst: item.cgst,
                sgst: item.sgst,
                igst: item.igst,
                totalAmount: item.totalAmount
            })),
            pricing: invoice.pricing,
            paymentDetails: invoice.paymentDetails,
            taxDetails: invoice.taxDetails,
            qrCode: invoice.qrCode,
            barcode: invoice.barcode,
            notes: invoice.notes,
            termsAndConditions: invoice.termsAndConditions,
            status: invoice.status,
            amountInWords: invoice.amountInWords,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt
        }
    }, 'Invoice retrieved successfully');
});

// Update invoice
exports.updateInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    // Only allow updates if invoice is in draft status
    if (invoice.status !== 'draft') {
        return res.error('Only draft invoices can be updated', [], 400);
    }

    // Update allowed fields
    const allowedFields = [
        'customerDetails', 'items', 'pricing', 'paymentDetails',
        'notes', 'termsAndConditions', 'companyDetails'
    ];

    allowedFields.forEach(field => {
        if (updateData[field]) {
            invoice[field] = updateData[field];
        }
    });

    invoice.updatedBy = req.user._id;
    await invoice.save();

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.formattedInvoiceNumber,
            status: invoice.status,
            grandTotal: invoice.pricing.grandTotal,
            updatedAt: invoice.updatedAt
        }
    }, 'Invoice updated successfully');
});

// Mark invoice as paid
exports.markAsPaid = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentDate, transactionId, paymentReference, paidAmount } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    const paymentData = {
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        transactionId,
        paymentReference,
        paidAmount: paidAmount || invoice.pricing.grandTotal
    };

    if (paidAmount) {
        invoice.paymentDetails.paidAmount += paidAmount;
        invoice.paymentDetails.balanceAmount = invoice.pricing.grandTotal - invoice.paymentDetails.paidAmount;
        
        if (invoice.paymentDetails.paidAmount >= invoice.pricing.grandTotal) {
            invoice.paymentDetails.status = 'paid';
            invoice.status = 'paid';
        } else {
            invoice.paymentDetails.status = 'partial';
        }
        
        invoice.paymentDetails.paymentDate = paymentData.paymentDate;
        invoice.paymentDetails.transactionId = paymentData.transactionId;
        invoice.paymentDetails.paymentReference = paymentData.paymentReference;
        
        await invoice.save();
    } else {
        await invoice.markAsPaid(paymentData);
    }

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.formattedInvoiceNumber,
            paymentStatus: invoice.paymentDetails.status,
            paidAmount: invoice.paymentDetails.paidAmount,
            balanceAmount: invoice.paymentDetails.balanceAmount,
            status: invoice.status
        }
    }, 'Payment recorded successfully');
});

// Cancel invoice
exports.cancelInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    if (invoice.paymentDetails.status === 'paid') {
        return res.error('Cannot cancel paid invoice', [], 400);
    }

    invoice.status = 'cancelled';
    invoice.notes = invoice.notes ? `${invoice.notes}\n\nCancellation Reason: ${reason}` : `Cancellation Reason: ${reason}`;
    invoice.updatedBy = req.user._id;
    
    await invoice.save();

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.formattedInvoiceNumber,
            status: invoice.status
        }
    }, 'Invoice cancelled successfully');
});

// Generate PDF invoice
exports.generatePDF = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { format = 'A4' } = req.query; // A4 or thermal

    const invoice = await Invoice.findById(id)
        .populate('items.product', 'name description');

    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    try {
        let pdfBuffer;
        
        if (format === 'thermal') {
            pdfBuffer = await generateThermalPDF(invoice);
        } else {
            pdfBuffer = await generateStandardPDF(invoice);
        }

        // Update download timestamp
        invoice.downloadedAt = new Date();
        await invoice.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.formattedInvoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        return res.error('Failed to generate PDF', [error.message], 500);
    }
});

// Get invoice analytics
exports.getInvoiceAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, period = 'month' } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate || endDate) {
        matchStage.invoiceDate = {};
        if (startDate) matchStage.invoiceDate.$gte = new Date(startDate);
        if (endDate) matchStage.invoiceDate.$lte = new Date(endDate);
    }

    const analytics = await Invoice.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalInvoices: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                totalPaid: { $sum: '$paymentDetails.paidAmount' },
                totalPending: { $sum: '$paymentDetails.balanceAmount' },
                avgInvoiceAmount: { $avg: '$pricing.grandTotal' }
            }
        }
    ]);

    // Status breakdown
    const statusBreakdown = await Invoice.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$pricing.grandTotal' } } }
    ]);

    // Payment status breakdown
    const paymentBreakdown = await Invoice.aggregate([
        { $match: matchStage },
        { $group: { _id: '$paymentDetails.status', count: { $sum: 1 }, amount: { $sum: '$pricing.grandTotal' } } }
    ]);

    res.success({
        summary: analytics[0] || {
            totalInvoices: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalPending: 0,
            avgInvoiceAmount: 0
        },
        statusBreakdown,
        paymentBreakdown
    }, 'Invoice analytics retrieved successfully');
});

// Helper function to generate standard PDF
async function generateStandardPDF(invoice) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fontSize(20).text(invoice.companyDetails.name, 50, 50);
            doc.fontSize(10).text(invoice.companyDetails.address, 50, 80);
            doc.text(`GSTIN: ${invoice.companyDetails.gstin}`, 50, 95);
            doc.text(`Phone: ${invoice.companyDetails.phone}`, 50, 110);

            // Invoice details
            doc.fontSize(16).text('TAX INVOICE', 400, 50);
            doc.fontSize(10).text(`Invoice No: ${invoice.formattedInvoiceNumber}`, 400, 80);
            doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`, 400, 95);

            // Customer details
            doc.text('Bill To:', 50, 150);
            doc.text(invoice.customerDetails.name, 50, 165);
            doc.text(invoice.customerDetails.billingAddress.street, 50, 180);
            doc.text(`${invoice.customerDetails.billingAddress.city}, ${invoice.customerDetails.billingAddress.state}`, 50, 195);
            doc.text(invoice.customerDetails.billingAddress.postalCode, 50, 210);

            // Items table
            let yPosition = 250;
            doc.text('S.No', 50, yPosition);
            doc.text('Description', 100, yPosition);
            doc.text('HSN', 250, yPosition);
            doc.text('Qty', 300, yPosition);
            doc.text('Rate', 350, yPosition);
            doc.text('Amount', 450, yPosition);
            doc.text('GST', 500, yPosition);
            doc.text('Total', 550, yPosition);

            yPosition += 20;
            invoice.items.forEach((item, index) => {
                doc.text((index + 1).toString(), 50, yPosition);
                doc.text(item.name, 100, yPosition);
                doc.text(item.hsnCode, 250, yPosition);
                doc.text(item.quantity.toString(), 300, yPosition);
                doc.text(`₹${item.rate}`, 350, yPosition);
                doc.text(`₹${item.taxableAmount}`, 450, yPosition);
                doc.text(`₹${item.cgst + item.sgst + item.igst}`, 500, yPosition);
                doc.text(`₹${item.totalAmount}`, 550, yPosition);
                yPosition += 20;
            });

            // Totals
            yPosition += 20;
            doc.text(`Subtotal: ₹${invoice.pricing.subtotal}`, 400, yPosition);
            yPosition += 15;
            doc.text(`Total GST: ₹${invoice.pricing.totalGST}`, 400, yPosition);
            yPosition += 15;
            doc.fontSize(12).text(`Grand Total: ₹${invoice.pricing.grandTotal}`, 400, yPosition);

            // Terms
            if (invoice.termsAndConditions) {
                yPosition += 40;
                doc.fontSize(10).text('Terms & Conditions:', 50, yPosition);
                doc.text(invoice.termsAndConditions, 50, yPosition + 15);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate thermal PDF (58mm width)
async function generateThermalPDF(invoice) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: [164, 'auto'], // 58mm width
                margin: 10 
            });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fontSize(12).text(invoice.companyDetails.name, { align: 'center' });
            doc.fontSize(8).text(invoice.companyDetails.address, { align: 'center' });
            doc.text(`GSTIN: ${invoice.companyDetails.gstin}`, { align: 'center' });
            doc.text('--------------------------------');
            
            // Invoice details
            doc.text(`Invoice: ${invoice.formattedInvoiceNumber}`);
            doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`);
            doc.text(`Customer: ${invoice.customerDetails.name}`);
            doc.text('--------------------------------');

            // Items
            invoice.items.forEach(item => {
                doc.text(`${item.name}`);
                doc.text(`${item.quantity} x ₹${item.rate} = ₹${item.totalAmount}`);
            });

            doc.text('--------------------------------');
            doc.text(`Subtotal: ₹${invoice.pricing.subtotal}`);
            doc.text(`GST: ₹${invoice.pricing.totalGST}`);
            doc.fontSize(10).text(`TOTAL: ₹${invoice.pricing.grandTotal}`, { align: 'center' });
            doc.text('--------------------------------');
            doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = exports;
