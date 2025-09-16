const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const SystemSettings = require('../models/SystemSettings');
const { asyncHandler } = require('../middlewares/errorHandler');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { Canvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// USER INVOICE METHODS

// Get user's invoices
exports.getUserInvoices = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        page = 1,
        limit = 20,
        status,
        paymentStatus
    } = req.query;

    const query = { user: userId, isActive: true };

    // Filters
    if (status) query.status = status;
    if (paymentStatus) query['paymentDetails.status'] = paymentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const invoices = await Invoice.find(query)
        .populate('order', 'orderNumber status')
        .sort({ invoiceDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('invoiceNumber invoiceDate status paymentDetails.status pricing.grandTotal');

    const total = await Invoice.countDocuments(query);

    const formattedInvoices = invoices.map(invoice => ({
        _id: invoice._id,
        invoiceNumber: invoice.formattedInvoiceNumber,
        invoiceDate: invoice.invoiceDate,
        orderNumber: invoice.order?.orderNumber,
        status: invoice.status,
        paymentStatus: invoice.paymentDetails.status,
        amount: invoice.pricing.grandTotal
    }));

    res.success({
        invoices: formattedInvoices,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: skip + parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'User invoices retrieved successfully');
});

// Get user's invoice by order ID
exports.getUserInvoiceByOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user._id;

    // First verify the order belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        return res.error('Order not found or access denied', [], 404);
    }

    const invoice = await Invoice.findOne({ order: orderId, user: userId })
        .populate('order', 'orderNumber status')
        .populate('items.product', 'name description');

    if (!invoice) {
        return res.error('Invoice not found for this order', [], 404);
    }

    res.success({
        invoice: {
            _id: invoice._id,
            invoiceNumber: invoice.formattedInvoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            status: invoice.status,
            paymentDetails: invoice.paymentDetails,
            customerDetails: invoice.customerDetails,
            companyDetails: invoice.companyDetails,
            items: invoice.items,
            pricing: invoice.pricing,
            taxDetails: invoice.taxDetails,
            notes: invoice.notes,
            termsAndConditions: invoice.termsAndConditions,
            qrCode: invoice.qrCode,
            order: invoice.order
        }
    }, 'Invoice retrieved successfully');
});

// Download user's invoice PDF by order ID
exports.downloadUserInvoiceByOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { format = 'A4' } = req.query;
    const userId = req.user._id;

    // First verify the order belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        return res.error('Order not found or access denied', [], 404);
    }

    // Check if invoice download is enabled in system settings
    const settings = await SystemSettings.getCurrentSettings();
    if (!settings.features?.enableInvoiceDownload) {
        return res.error('Invoice download is currently disabled', [], 403);
    }

    // Find the invoice for this order, or create one if it doesn't exist
    let invoice = await Invoice.findOne({ order: orderId, user: userId })
        .populate('items.product', 'name description');

    if (!invoice) {
        // Auto-generate invoice from order (like admin panel does)
        try {
            invoice = await Invoice.generateFromOrder(orderId, {
                createdBy: userId // User generating their own invoice
            });

            // Generate QR code for the invoice
            if (invoice.generateQRCode) {
                await invoice.generateQRCode();
            }

            // Populate the product details for PDF generation
            invoice = await Invoice.findById(invoice._id)
                .populate('items.product', 'name description');

        } catch (generateError) {
            console.error('Auto-invoice generation error:', generateError);
            return res.error('Unable to generate invoice for this order', [generateError.message], 500);
        }
    }

    try {
        let pdfBuffer;

        if (format === 'thermal') {
            pdfBuffer = await generateThermalPDF(invoice);

        } else if (format === '4x6') {
            pdfBuffer = await generate4x6InvoicePDF(invoice);

        } else {
            pdfBuffer = await generateStandardPDF(invoice);
        }

        // Update download timestamp
        invoice.downloadedAt = new Date();
        await invoice.save();


        const filename = format === '4x6' ? `Invoice-4x6-${invoice.formattedInvoiceNumber}.pdf` : `Invoice-${invoice.formattedInvoiceNumber}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(pdfBuffer);
    } catch (error) {
        return res.error('Failed to generate PDF', [error.message], 500);
    }
});

// ADMIN INVOICE METHODS

// Generate invoice from order
exports.generateInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const {
        companyDetails,
        notes,
        termsAndConditions,
        isGSTApplicable = true,
        taxType = 'GST'
    } = req.body;

    try {
        const invoice = await Invoice.generateFromOrder(orderId, {
            companyDetails,
            notes,
            termsAndConditions,
            isGSTApplicable,
            taxType,
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
                paymentStatus: invoice.paymentDetails.status,
                isGSTApplicable: invoice.taxDetails.isGSTApplicable,
                taxType: invoice.taxDetails.taxType
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
    const { format = 'A4' } = req.query; // A4, thermal, or 4x6

    const invoice = await Invoice.findById(id)
        .populate('items.product', 'name description');

    if (!invoice) {
        return res.error('Invoice not found', [], 404);
    }

    try {
        let pdfBuffer;

        if (format === 'thermal') {
            pdfBuffer = await generateThermalPDF(invoice);
        } else if (format === '4x6') {
            pdfBuffer = await generate4x6InvoicePDF(invoice);
        } else {
            pdfBuffer = await generateStandardPDF(invoice);
        }

        // Update download timestamp
        invoice.downloadedAt = new Date();
        await invoice.save();

        const filename = format === '4x6' ? `Invoice-4x6-${invoice.formattedInvoiceNumber}.pdf` : `Invoice-${invoice.formattedInvoiceNumber}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
            if (invoice.taxDetails.isGSTApplicable) {
                doc.text(`GSTIN: ${invoice.companyDetails.gstin}`, 50, 95);
            }
            doc.text(`Phone: ${invoice.companyDetails.phone}`, 50, 110);

            // Invoice details
            const invoiceTitle = invoice.taxDetails.isGSTApplicable ? 'TAX INVOICE' : 'INVOICE';
            doc.fontSize(16).text(invoiceTitle, 400, 50);
            doc.fontSize(10).text(`Invoice No: ${invoice.formattedInvoiceNumber}`, 400, 80);
            doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`, 400, 95);
            if (!invoice.taxDetails.isGSTApplicable) {
                doc.text('NON-GST INVOICE', 400, 110);
            }

            // Customer details
            doc.text('Bill To:', 50, 150);
            doc.text(invoice.customerDetails.name, 50, 165);
            doc.text(invoice.customerDetails.billingAddress.street, 50, 180);
            doc.text(`${invoice.customerDetails.billingAddress.city}, ${invoice.customerDetails.billingAddress.state}`, 50, 195);
            doc.text(invoice.customerDetails.billingAddress.postalCode, 50, 210);

            // Add GST and PAN numbers if available
            let yPos = 225;
            if (invoice.customerDetails.billingAddress.gstNumber) {
                doc.text(`GST No: ${invoice.customerDetails.billingAddress.gstNumber}`, 50, yPos);
                yPos += 15;
            }
            if (invoice.customerDetails.billingAddress.panNumber) {
                doc.text(`PAN No: ${invoice.customerDetails.billingAddress.panNumber}`, 50, yPos);
                yPos += 15;
            }

            // Items table - adjust position based on GST/PAN info
            let yPosition = yPos + 25; // Start items table after GST/PAN info
            doc.text('S.No', 50, yPosition);
            doc.text('Description', 100, yPosition);
            if (invoice.taxDetails.isGSTApplicable) {
                doc.text('HSN', 250, yPosition);
            }
            doc.text('Qty', 300, yPosition);
            doc.text('Rate', 350, yPosition);
            doc.text('Amount', 450, yPosition);
            if (invoice.taxDetails.isGSTApplicable) {
                doc.text('GST', 500, yPosition);
            }
            doc.text('Total', 550, yPosition);

            yPosition += 20;
            invoice.items.forEach((item, index) => {
                doc.text((index + 1).toString(), 50, yPosition);
                doc.text(item.name, 100, yPosition);
                if (invoice.taxDetails.isGSTApplicable) {
                    doc.text(item.hsnCode, 250, yPosition);
                }
                doc.text(item.quantity.toString(), 300, yPosition);
                doc.text(`₹${item.rate}`, 350, yPosition);
                doc.text(`₹${item.taxableAmount}`, 450, yPosition);
                if (invoice.taxDetails.isGSTApplicable) {
                    doc.text(`₹${item.cgst + item.sgst + item.igst}`, 500, yPosition);
                }
                doc.text(`₹${item.totalAmount}`, 550, yPosition);
                yPosition += 20;
            });

            // Totals
            yPosition += 20;
            doc.text(`Subtotal: ₹${invoice.pricing.subtotal}`, 400, yPosition);
            yPosition += 15;
            if (invoice.taxDetails.isGSTApplicable) {
                doc.text(`Total GST: ₹${invoice.pricing.totalGST}`, 400, yPosition);
                yPosition += 15;
            }
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
            
            // Add GST and PAN numbers if available
            if (invoice.customerDetails.billingAddress.gstNumber) {
                doc.text(`GST: ${invoice.customerDetails.billingAddress.gstNumber}`);
            }
            if (invoice.customerDetails.billingAddress.panNumber) {
                doc.text(`PAN: ${invoice.customerDetails.billingAddress.panNumber}`);
            }
            
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
            doc.fontSize(5).text('Thank you for your business!', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate 4x6 format invoice PDF (Delhivery-style label)
async function generate4x6InvoicePDF(invoice) {
    return new Promise(async (resolve, reject) => {
        try {
            const QRCode = require('qrcode');
            const JsBarcode = require('jsbarcode');

            let Canvas;
            try {
                Canvas = require('canvas').Canvas;
            } catch (error) {
                console.warn('Canvas module not available, barcode generation will use fallback');
                Canvas = null;
            }

            // 4x6 inches = 288x432 points. Use zero margins and manual boxes to ensure fit.
            const doc = new PDFDocument({ size: [288, 432], margin: 0 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Full-width COD banner at top
            doc.rect(0, 0, 288, 18).fillAndStroke('#000', '#000');
            doc.fill('#fff').fontSize(8).text('COD: Check the payable amount on the app', 0, 5, { width: 288, align: 'center' });
            doc.fill('#000');

            // Coordinates for first row under banner
            const rowTop = 20;
            const leftX = 6, leftW = 182; // larger left area
            const rightX = leftX + leftW + 6, rightW = 288 - rightX - 6;
            const addr = invoice.customerDetails?.billingAddress || {};

            // Left: Customer Address box
            doc.rect(leftX, rowTop, leftW, 118).stroke();
            doc.fontSize(8).text('Customer Address', leftX + 4, rowTop + 4, { width: leftW - 8 });
            doc.fontSize(10).text((invoice.customerDetails?.name || 'customer').toLowerCase(), leftX + 4, rowTop + 18, { width: leftW - 8 });
            const lines = [addr.street, addr.area, addr.city, addr.state, addr.postalCode].filter(Boolean);
            
            // Add GST and PAN numbers if available
            if (addr.gstNumber) {
                lines.push(`GST: ${addr.gstNumber}`);
            }
            if (addr.panNumber) {
                lines.push(`PAN: ${addr.panNumber}`);
            }
            
            doc.fontSize(8).text(lines.join('\n'), leftX + 4, rowTop + 34, { width: leftW - 8 });

            // Right: Delhivery block with QR
            doc.rect(rightX, rowTop, rightW, 118).stroke();
            doc.fontSize(12).text('Delhivery', rightX + 6, rowTop + 12);
            doc.fontSize(8).text('Pickup', rightX + 6, rowTop + 28, { width: 40, align: 'left' });
            doc.text('Destination Code', rightX + 6, rowTop + 44);
            doc.text('Return Code', rightX + 6, rowTop + 60);
            doc.font('Helvetica-Bold').text(`${addr.postalCode || '000000'}.2155544`, rightX + 6, rowTop + 74);
            doc.font('Helvetica');

            // QR Code in right box
            try {
                const qrData = invoice.qrCode || `INV:${invoice.formattedInvoiceNumber}|AMT:${invoice.pricing.grandTotal}`;
                const qrUrl = await QRCode.toDataURL(qrData, { width: 86, margin: 0 });
                const qrBuf = Buffer.from(qrUrl.split(',')[1], 'base64');
                doc.image(qrBuf, rightX + rightW - 90, rowTop + 26, { width: 86, height: 86 });
            } catch (qrErr) {
                doc.rect(rightX + rightW - 90, rowTop + 26, 86, 86).stroke();
                doc.fontSize(6).text('QR', rightX + rightW - 47, rowTop + 66);
            }

            // Second row: Return address (left) and barcode (right)
            const retTop = rowTop + 118;
            doc.rect(leftX, retTop, leftW, 64).stroke();
            doc.fontSize(8).text('If undelivered, return to:', leftX + 4, retTop + 4, { width: leftW - 8 });
            doc.fontSize(9).text((invoice.companyDetails?.name || '').toUpperCase(), leftX + 4, retTop + 18, { width: leftW - 8 });
            doc.fontSize(8).text(invoice.companyDetails?.address || '', leftX + 4, retTop + 32, { width: leftW - 8 });

            // Barcode on right side box
            doc.rect(rightX, retTop, rightW, 64).stroke();
            const barcodeTop = retTop + 6;
            try {
                const displayNumber = `${invoice.formattedInvoiceNumber}`;
                const valueNumber = `${Date.now()}${invoice.invoiceNumber}`.slice(-12);
                if (Canvas) {
                    const canvas = new Canvas(rightW - 10, 40);
                    JsBarcode(canvas, valueNumber, { format: 'CODE128', width: 1, height: 40, displayValue: false });
                    doc.image(canvas.toBuffer('image/png'), rightX + 5, barcodeTop, { width: rightW - 10, height: 40 });
                    doc.fontSize(12).text(displayNumber, rightX, barcodeTop + 42, { width: rightW, align: 'center' });
                } else {
                    doc.fontSize(12).text(displayNumber, rightX, barcodeTop + 20, { width: rightW, align: 'center' });
                }
            } catch (be) {
                doc.fontSize(12).text(invoice.formattedInvoiceNumber, rightX, barcodeTop + 20, { width: rightW, align: 'center' });
            }

            // Product details full width row (ensure we stay on single page)
            const detailsTop = retTop + 68;
            doc.rect(6, detailsTop, 276, 60).stroke();
            doc.fontSize(10).text('Product Details', 10, detailsTop + 6);
            doc.fontSize(8);
            const gridY = detailsTop + 22;
            doc.text('SKU', 10, gridY);
            doc.text('Size', 70, gridY);
            doc.text('Qty', 118, gridY);
            doc.text('Color', 148, gridY);
            doc.text('Order No.', 200, gridY);
            const item = invoice.items?.[0] || {};
            doc.text(item.hsnCode || 'N/A', 10, gridY + 14);
            doc.text('Free Size', 70, gridY + 14);
            doc.text((item.quantity || 1).toString(), 118, gridY + 14);
            doc.text('Gold', 148, gridY + 14);
            doc.text(`${invoice.formattedInvoiceNumber}_1`, 200, gridY + 14);

            // Footer row
            const footerY = detailsTop + 64;
            const title = invoice.taxDetails?.isGSTApplicable ? 'TAX INVOICE' : 'INVOICE';
            doc.fontSize(10).text(title, 6, footerY, { width: 180, align: 'center' });
            doc.fontSize(8).text('Original for Recipient', 186, footerY + 2, { width: 94, align: 'right' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = exports;
