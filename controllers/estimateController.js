const { asyncHandler } = require('../middlewares/errorHandler');
const Estimate = require('../models/Estimate');
const Order = require('../models/Order');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');

// Conditional Canvas import with fallback
let Canvas;
try {
    Canvas = require('canvas').Canvas;
} catch (error) {
    console.warn('Canvas module not available, barcode generation will use fallback');
    Canvas = null;
}

// USER ESTIMATE METHODS

// Get user's estimates
exports.getUserEstimates = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status, search } = req.query;

    const query = { user: userId, isActive: true };
    
    if (status) {
        query.status = status;
    }
    
    if (search) {
        query.$or = [
            { estimateNumber: { $regex: search, $options: 'i' } },
            { 'customerDetails.name': { $regex: search, $options: 'i' } }
        ];
    }

    const estimates = await Estimate.find(query)
        .populate('order', 'orderNumber')
        .sort({ estimateDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Estimate.countDocuments(query);

    // Check and update expired estimates
    for (const estimate of estimates) {
        await estimate.checkAndUpdateExpiry();
    }

    res.success({
        estimates: estimates.map(estimate => ({
            _id: estimate._id,
            estimateNumber: estimate.formattedEstimateNumber,
            estimateDate: estimate.estimateDate,
            validUntil: estimate.validUntil,
            customerName: estimate.customerDetails.name,
            grandTotal: estimate.pricing.grandTotal,
            status: estimate.status,
            isExpired: estimate.isExpired,
            isValid: estimate.isValid,
            orderNumber: estimate.order?.orderNumber
        })),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
        }
    }, 'Estimates retrieved successfully');
});

// Get single estimate
exports.getEstimate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const estimate = await Estimate.findOne({ _id: id, user: userId, isActive: true })
        .populate('order', 'orderNumber')
        .populate('items.product', 'name description images');

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    // Check and update expiry
    await estimate.checkAndUpdateExpiry();

    // Update viewed timestamp
    estimate.viewedAt = new Date();
    await estimate.save();

    res.success({
        estimate: {
            ...estimate.toObject(),
            formattedEstimateNumber: estimate.formattedEstimateNumber,
            isExpired: estimate.isExpired,
            isValid: estimate.isValid
        }
    }, 'Estimate retrieved successfully');
});

// Generate estimate from cart
exports.generateEstimateFromCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { 
        cartItems, 
        billingAddress, 
        shippingAddress, 
        notes, 
        termsAndConditions,
        isGSTApplicable = true,
        taxType = 'GST',
        isInterState = false
    } = req.body;

    if (!cartItems || cartItems.length === 0) {
        return res.error('Cart items are required', [], 400);
    }

    try {
        const estimate = await Estimate.generateFromCart(userId, cartItems, {
            billingAddress,
            shippingAddress,
            notes,
            termsAndConditions,
            isGSTApplicable,
            taxType,
            isInterState,
            createdBy: userId
        });

        // Generate QR code
        await estimate.generateQRCode();

        res.success({
            estimate: {
                _id: estimate._id,
                estimateNumber: estimate.formattedEstimateNumber,
                estimateDate: estimate.estimateDate,
                validUntil: estimate.validUntil,
                grandTotal: estimate.pricing.grandTotal,
                status: estimate.status
            }
        }, 'Estimate generated successfully', 201);
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Download estimate PDF
exports.downloadEstimatePDF = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { format = 'standard' } = req.query; // standard, thermal, 4x6
    const userId = req.user._id;

    const estimate = await Estimate.findOne({ _id: id, user: userId, isActive: true })
        .populate('items.product', 'name description');

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    try {
        let pdfBuffer;

        if (format === 'thermal') {
            pdfBuffer = await generateThermalEstimatePDF(estimate);
        } else if (format === '4x6') {
            pdfBuffer = await generate4x6EstimatePDF(estimate);
        } else {
            pdfBuffer = await generateStandardEstimatePDF(estimate);
        }

        // Update download timestamp
        estimate.downloadedAt = new Date();
        await estimate.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Estimate-${estimate.formattedEstimateNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        return res.error('Failed to generate PDF', [error.message], 500);
    }
});

// Accept estimate
exports.acceptEstimate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const estimate = await Estimate.findOne({ _id: id, user: userId, isActive: true });

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    if (estimate.isExpired) {
        return res.error('Cannot accept expired estimate', [], 400);
    }

    if (estimate.status !== 'sent' && estimate.status !== 'draft') {
        return res.error('Estimate cannot be accepted in current status', [], 400);
    }

    await estimate.markAsAccepted();

    res.success({
        estimate: {
            _id: estimate._id,
            estimateNumber: estimate.formattedEstimateNumber,
            status: estimate.status,
            acceptedAt: estimate.acceptedAt
        }
    }, 'Estimate accepted successfully');
});

// Convert estimate to order
exports.convertEstimateToOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const { paymentMethod = 'cod', shippingAddress, billingAddress } = req.body;

    const estimate = await Estimate.findOne({ _id: id, user: userId, isActive: true })
        .populate('items.product', 'name price stock');

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    if (estimate.status !== 'accepted') {
        return res.error('Only accepted estimates can be converted to orders', [], 400);
    }

    if (estimate.isExpired) {
        return res.error('Cannot convert expired estimate', [], 400);
    }

    try {
        // Create order from estimate
        const orderData = {
            user: userId,
            items: estimate.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.rate,
                totalPrice: item.totalAmount
            })),
            pricing: {
                subtotal: estimate.pricing.subtotal,
                tax: estimate.pricing.totalGST,
                taxRate: estimate.taxDetails.isGSTApplicable ? 0.18 : 0,
                shipping: estimate.pricing.shippingCharges,
                discount: estimate.pricing.totalDiscount,
                total: estimate.pricing.grandTotal
            },
            paymentMethod,
            billingAddress: billingAddress || estimate.customerDetails.billingAddress,
            shippingAddress: shippingAddress || estimate.customerDetails.shippingAddress,
            status: 'pending',
            estimateReference: estimate._id
        };

        const order = new Order(orderData);
        await order.save();

        // Update estimate status
        estimate.status = 'converted';
        estimate.convertedAt = new Date();
        await estimate.save();

        res.success({
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                total: order.pricing.total,
                status: order.status
            },
            estimate: {
                _id: estimate._id,
                status: estimate.status,
                convertedAt: estimate.convertedAt
            }
        }, 'Estimate converted to order successfully', 201);
    } catch (error) {
        return res.error('Failed to convert estimate to order', [error.message], 500);
    }
});

// ADMIN ESTIMATE METHODS

// Generate estimate from order (Admin)
exports.generateEstimate = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { 
        companyDetails, 
        notes, 
        termsAndConditions, 
        isGSTApplicable = true,
        taxType = 'GST',
        isInterState = false,
        validityDays = 30
    } = req.body;

    try {
        const estimate = await Estimate.generateFromOrder(orderId, {
            companyDetails,
            notes,
            termsAndConditions,
            isGSTApplicable,
            taxType,
            isInterState,
            createdBy: req.user._id
        });

        // Set custom validity if provided
        if (validityDays) {
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + validityDays);
            estimate.validUntil = validUntil;
            await estimate.save();
        }

        // Generate QR code
        await estimate.generateQRCode();

        res.success({
            estimate: {
                _id: estimate._id,
                estimateNumber: estimate.formattedEstimateNumber,
                estimateDate: estimate.estimateDate,
                validUntil: estimate.validUntil,
                customerName: estimate.customerDetails.name,
                grandTotal: estimate.pricing.grandTotal,
                status: estimate.status
            }
        }, 'Estimate generated successfully', 201);
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Get all estimates (Admin)
exports.getAllEstimates = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        status, 
        search, 
        startDate, 
        endDate,
        sortBy = 'estimateDate',
        sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    if (status) {
        query.status = status;
    }
    
    if (search) {
        query.$or = [
            { estimateNumber: { $regex: search, $options: 'i' } },
            { 'customerDetails.name': { $regex: search, $options: 'i' } },
            { 'customerDetails.email': { $regex: search, $options: 'i' } }
        ];
    }

    if (startDate || endDate) {
        query.estimateDate = {};
        if (startDate) query.estimateDate.$gte = new Date(startDate);
        if (endDate) query.estimateDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const estimates = await Estimate.find(query)
        .populate('user', 'firstName lastName email')
        .populate('order', 'orderNumber')
        .populate('convertedToInvoice', 'invoiceNumber')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Estimate.countDocuments(query);

    res.success({
        estimates: estimates.map(estimate => ({
            _id: estimate._id,
            estimateNumber: estimate.formattedEstimateNumber,
            estimateDate: estimate.estimateDate,
            validUntil: estimate.validUntil,
            customerName: estimate.customerDetails.name,
            customerEmail: estimate.customerDetails.email,
            grandTotal: estimate.pricing.grandTotal,
            status: estimate.status,
            isExpired: estimate.isExpired,
            isValid: estimate.isValid,
            userName: `${estimate.user?.firstName || ''} ${estimate.user?.lastName || ''}`.trim(),
            orderNumber: estimate.order?.orderNumber,
            convertedInvoice: estimate.convertedToInvoice?.invoiceNumber,
            createdAt: estimate.createdAt
        })),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
        }
    }, 'Estimates retrieved successfully');
});

// Convert estimate to invoice (Admin)
exports.convertToInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const estimate = await Estimate.findById(id);

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    try {
        const invoice = await estimate.convertToInvoice({
            createdBy: req.user._id
        });

        res.success({
            invoice: {
                _id: invoice._id,
                invoiceNumber: invoice.formattedInvoiceNumber,
                invoiceDate: invoice.invoiceDate,
                grandTotal: invoice.pricing.grandTotal,
                status: invoice.status
            },
            estimate: {
                _id: estimate._id,
                status: estimate.status,
                convertedAt: estimate.convertedAt
            }
        }, 'Estimate converted to invoice successfully', 201);
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Update estimate status (Admin)
exports.updateEstimateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const estimate = await Estimate.findById(id);

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
    if (!validStatuses.includes(status)) {
        return res.error('Invalid status', [], 400);
    }

    estimate.status = status;
    estimate.updatedBy = req.user._id;

    if (status === 'accepted') {
        estimate.acceptedAt = new Date();
    } else if (status === 'rejected') {
        estimate.rejectedAt = new Date();
    } else if (status === 'sent') {
        estimate.sentAt = new Date();
    }

    await estimate.save();

    res.success({
        estimate: {
            _id: estimate._id,
            estimateNumber: estimate.formattedEstimateNumber,
            status: estimate.status
        }
    }, 'Estimate status updated successfully');
});

// Delete estimate (Admin)
exports.deleteEstimate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const estimate = await Estimate.findById(id);

    if (!estimate) {
        return res.error('Estimate not found', [], 404);
    }

    if (estimate.status === 'converted') {
        return res.error('Cannot delete converted estimate', [], 400);
    }

    estimate.isActive = false;
    estimate.updatedBy = req.user._id;
    await estimate.save();

    res.success({
        estimate: {
            _id: estimate._id,
            estimateNumber: estimate.formattedEstimateNumber
        }
    }, 'Estimate deleted successfully');
});

// Get estimate analytics (Admin)
exports.getEstimateAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const matchStage = { isActive: true };
    if (startDate || endDate) {
        matchStage.estimateDate = {};
        if (startDate) matchStage.estimateDate.$gte = new Date(startDate);
        if (endDate) matchStage.estimateDate.$lte = new Date(endDate);
    }

    const analytics = await Estimate.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalEstimates: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                avgEstimateAmount: { $avg: '$pricing.grandTotal' },
                acceptedEstimates: {
                    $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
                },
                convertedEstimates: {
                    $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] }
                },
                rejectedEstimates: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                },
                expiredEstimates: {
                    $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
                }
            }
        }
    ]);

    // Status breakdown
    const statusBreakdown = await Estimate.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$pricing.grandTotal' } } }
    ]);

    const result = analytics[0] || {
        totalEstimates: 0,
        totalAmount: 0,
        avgEstimateAmount: 0,
        acceptedEstimates: 0,
        convertedEstimates: 0,
        rejectedEstimates: 0,
        expiredEstimates: 0
    };

    // Calculate conversion rate
    result.conversionRate = result.totalEstimates > 0
        ? ((result.convertedEstimates / result.totalEstimates) * 100).toFixed(2)
        : 0;

    // Calculate acceptance rate
    result.acceptanceRate = result.totalEstimates > 0
        ? (((result.acceptedEstimates + result.convertedEstimates) / result.totalEstimates) * 100).toFixed(2)
        : 0;

    res.success({
        summary: result,
        statusBreakdown
    }, 'Estimate analytics retrieved successfully');
});

// PDF Generation Helper Functions

// Helper function to generate standard estimate PDF
async function generateStandardEstimatePDF(estimate) {
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
            doc.fontSize(20).text(estimate.companyDetails.name, 50, 50);
            doc.fontSize(10).text(estimate.companyDetails.address, 50, 80);
            if (estimate.taxDetails.isGSTApplicable) {
                doc.text(`GSTIN: ${estimate.companyDetails.gstin}`, 50, 95);
            }
            doc.text(`Phone: ${estimate.companyDetails.phone}`, 50, 110);

            // Estimate details
            doc.fontSize(16).text('ESTIMATE', 400, 50);
            doc.fontSize(10).text(`Estimate No: ${estimate.formattedEstimateNumber}`, 400, 80);
            doc.text(`Date: ${estimate.estimateDate.toLocaleDateString()}`, 400, 95);
            doc.text(`Valid Until: ${estimate.validUntil.toLocaleDateString()}`, 400, 110);

            // Customer details
            doc.text('Estimate For:', 50, 150);
            doc.text(estimate.customerDetails.name, 50, 165);
            if (estimate.customerDetails.billingAddress) {
                doc.text(estimate.customerDetails.billingAddress.street, 50, 180);
                doc.text(`${estimate.customerDetails.billingAddress.city}, ${estimate.customerDetails.billingAddress.state}`, 50, 195);
                doc.text(estimate.customerDetails.billingAddress.postalCode, 50, 210);
            }

            // Items table
            let yPosition = 250;
            doc.text('S.No', 50, yPosition);
            doc.text('Description', 100, yPosition);
            doc.text('HSN', 250, yPosition);
            doc.text('Qty', 300, yPosition);
            doc.text('Rate', 350, yPosition);
            doc.text('Amount', 450, yPosition);
            if (estimate.taxDetails.isGSTApplicable) {
                doc.text('GST', 500, yPosition);
            }
            doc.text('Total', 550, yPosition);

            yPosition += 20;
            estimate.items.forEach((item, index) => {
                doc.text((index + 1).toString(), 50, yPosition);
                doc.text(item.name, 100, yPosition);
                doc.text(item.hsnCode, 250, yPosition);
                doc.text(item.quantity.toString(), 300, yPosition);
                doc.text(`₹${item.rate}`, 350, yPosition);
                doc.text(`₹${item.taxableAmount}`, 450, yPosition);
                if (estimate.taxDetails.isGSTApplicable) {
                    doc.text(`₹${item.cgst + item.sgst + item.igst}`, 500, yPosition);
                }
                doc.text(`₹${item.totalAmount}`, 550, yPosition);
                yPosition += 20;
            });

            // Totals
            yPosition += 20;
            doc.text(`Subtotal: ₹${estimate.pricing.subtotal}`, 400, yPosition);
            yPosition += 15;
            if (estimate.taxDetails.isGSTApplicable) {
                doc.text(`Total GST: ₹${estimate.pricing.totalGST}`, 400, yPosition);
                yPosition += 15;
            }
            doc.fontSize(12).text(`Grand Total: ₹${estimate.pricing.grandTotal}`, 400, yPosition);

            // Terms
            if (estimate.termsAndConditions) {
                yPosition += 40;
                doc.fontSize(10).text('Terms & Conditions:', 50, yPosition);
                doc.text(estimate.termsAndConditions, 50, yPosition + 15);
            }

            // Footer
            yPosition += 60;
            doc.fontSize(8).text('This is an estimate and not a tax invoice.', 50, yPosition);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate thermal estimate PDF (58mm width)
async function generateThermalEstimatePDF(estimate) {
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
            doc.fontSize(12).text(estimate.companyDetails.name, { align: 'center' });
            doc.fontSize(8).text(estimate.companyDetails.address, { align: 'center' });
            if (estimate.taxDetails.isGSTApplicable) {
                doc.text(`GSTIN: ${estimate.companyDetails.gstin}`, { align: 'center' });
            }
            doc.text('--------------------------------');

            // Estimate details
            doc.text(`Estimate: ${estimate.formattedEstimateNumber}`);
            doc.text(`Date: ${estimate.estimateDate.toLocaleDateString()}`);
            doc.text(`Valid Until: ${estimate.validUntil.toLocaleDateString()}`);
            doc.text(`Customer: ${estimate.customerDetails.name}`);
            doc.text('--------------------------------');

            // Items
            estimate.items.forEach(item => {
                doc.text(`${item.name}`);
                doc.text(`${item.quantity} x ₹${item.rate} = ₹${item.totalAmount}`);
            });

            doc.text('--------------------------------');
            doc.text(`Subtotal: ₹${estimate.pricing.subtotal}`);
            if (estimate.taxDetails.isGSTApplicable) {
                doc.text(`GST: ₹${estimate.pricing.totalGST}`);
            }
            doc.fontSize(10).text(`TOTAL: ₹${estimate.pricing.grandTotal}`, { align: 'center' });
            doc.text('--------------------------------');
            doc.fontSize(8).text('This is an estimate only', { align: 'center' });
            doc.text(`Valid until: ${estimate.validUntil.toLocaleDateString()}`, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate 4x6 format PDF (similar to shipping label)
async function generate4x6EstimatePDF(estimate) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: [288, 432], // 4x6 inches in points (72 points per inch)
                margin: 10
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Left side - Customer Address
            doc.fontSize(8).text('Customer Address', 10, 15, { width: 130 });
            doc.fontSize(10).text(estimate.customerDetails.name, 10, 30, { width: 130 });

            if (estimate.customerDetails.billingAddress) {
                const address = estimate.customerDetails.billingAddress;
                doc.fontSize(8).text(address.street || '', 10, 45, { width: 130 });
                doc.text(`${address.city || ''}, ${address.state || ''}`, 10, 60, { width: 130 });
                doc.text(`${address.postalCode || ''}, ${address.country || 'India'}`, 10, 75, { width: 130 });
            }

            // Right side - QR Code and Barcode area
            doc.fontSize(8).text('COD: Check the payable amount on the app', 150, 15, {
                width: 130,
                align: 'center',
                fillColor: 'white'
            });

            // Add delivery section
            doc.fontSize(12).text('Delivery', 150, 40, { width: 130 });
            doc.fontSize(8).text('Pickup', 150, 55, { width: 130 });
            doc.text('Destination Code', 150, 70, { width: 130 });
            doc.text('Return Code', 150, 90, { width: 130 });
            doc.text(`${estimate.customerDetails.billingAddress?.postalCode || '000000'}.2*55544`, 150, 105, { width: 130 });

            // Generate QR Code
            try {
                const qrCodeData = estimate.qrCode || `EST:${estimate.formattedEstimateNumber}|AMT:${estimate.pricing.grandTotal}`;
                const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
                    width: 80,
                    margin: 1
                });

                // Convert data URL to buffer
                const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
                doc.image(qrBuffer, 200, 120, { width: 60, height: 60 });
            } catch (qrError) {
                console.error('QR Code generation error:', qrError);
                // Fallback: draw a placeholder rectangle
                doc.rect(200, 120, 60, 60).stroke();
                doc.fontSize(6).text('QR Code', 215, 145);
            }

            // Generate Barcode
            try {
                const barcodeNumber = `${Date.now()}${estimate.estimateNumber}`.slice(-12);

                if (Canvas) {
                    // Create canvas for barcode
                    const canvas = new Canvas(200, 50);
                    JsBarcode(canvas, barcodeNumber, {
                        format: "CODE128",
                        width: 1,
                        height: 40,
                        displayValue: true,
                        fontSize: 8
                    });

                    const barcodeBuffer = canvas.toBuffer('image/png');
                    doc.image(barcodeBuffer, 50, 190, { width: 180, height: 40 });
                } else {
                    // Fallback: draw barcode number
                    doc.fontSize(10).text(barcodeNumber, 50, 200, { width: 180, align: 'center' });
                }
            } catch (barcodeError) {
                console.error('Barcode generation error:', barcodeError);
                // Fallback: draw barcode number
                const barcodeNumber = `${Date.now()}${estimate.estimateNumber}`.slice(-12);
                doc.fontSize(10).text(barcodeNumber, 50, 200, { width: 180, align: 'center' });
            }

            // Return address section
            doc.fontSize(8).text('If undelivered, return to:', 10, 120, { width: 130 });
            doc.fontSize(9).text(estimate.companyDetails.name.toUpperCase(), 10, 135, { width: 130 });
            doc.fontSize(8).text(estimate.companyDetails.address, 10, 150, { width: 130 });

            // Product Details section
            doc.fontSize(10).text('Product Details', 10, 240, { width: 270 });

            // Table headers
            doc.fontSize(8);
            doc.text('SKU', 10, 260, { width: 50 });
            doc.text('Size', 70, 260, { width: 50 });
            doc.text('Qty', 130, 260, { width: 30 });
            doc.text('Color', 170, 260, { width: 50 });
            doc.text('Order No.', 230, 260, { width: 50 });

            // Product data (first item only for space constraints)
            if (estimate.items && estimate.items.length > 0) {
                const item = estimate.items[0];
                doc.text(item.hsnCode || 'N/A', 10, 275, { width: 50 });
                doc.text('Free Size', 70, 275, { width: 50 });
                doc.text(item.quantity.toString(), 130, 275, { width: 30 });
                doc.text('Gold', 170, 275, { width: 50 });
                doc.text(`${estimate.formattedEstimateNumber}_1`, 230, 275, { width: 50 });
            }

            // Footer
            doc.fontSize(10).text('ESTIMATE', 10, 300, { width: 270, align: 'center' });
            doc.fontSize(8).text('Original for Recipient', 200, 320, { width: 80, align: 'right' });

            // Estimate details at bottom
            doc.fontSize(8);
            doc.text(`Estimate No: ${estimate.formattedEstimateNumber}`, 10, 340);
            doc.text(`Date: ${estimate.estimateDate.toLocaleDateString()}`, 10, 355);
            doc.text(`Valid Until: ${estimate.validUntil.toLocaleDateString()}`, 10, 370);
            doc.text(`Amount: ₹${estimate.pricing.grandTotal}`, 10, 385);

            if (!estimate.taxDetails.isGSTApplicable) {
                doc.text('NON-GST ESTIMATE', 150, 385, { width: 130, align: 'center' });
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = exports;
