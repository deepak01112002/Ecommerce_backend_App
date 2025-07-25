const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const { asyncHandler } = require('../middlewares/errorHandler');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get all purchase orders
exports.getAllPurchaseOrders = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        status,
        supplier,
        startDate,
        endDate,
        sortBy = 'poDate',
        sortOrder = 'desc',
        approvalStatus
    } = req.query;
    
    const query = {};
    
    // Filters
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    if (approvalStatus) query.approvalStatus = approvalStatus;
    
    if (startDate || endDate) {
        query.poDate = {};
        if (startDate) query.poDate.$gte = new Date(startDate);
        if (endDate) query.poDate.$lte = new Date(endDate);
    }
    
    if (search) {
        query.$or = [
            { poNumber: new RegExp(search, 'i') }
        ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const purchaseOrders = await PurchaseOrder.find(query)
        .populate('supplier', 'name code contactInfo')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await PurchaseOrder.countDocuments(query);
    
    const formattedPOs = purchaseOrders.map(po => po.getFormattedData());
    
    res.success({
        purchaseOrders: formattedPOs,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Purchase orders retrieved successfully');
});

// Get single purchase order
exports.getPurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id)
        .populate('supplier', 'name code contactInfo addresses businessInfo')
        .populate('items.product', 'name sku images')
        .populate('createdBy', 'firstName lastName')
        .populate('approvedBy', 'firstName lastName')
        .populate('lastUpdatedBy', 'firstName lastName');
    
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    res.success({
        purchaseOrder: purchaseOrder.getFormattedData()
    }, 'Purchase order retrieved successfully');
});

// Create new purchase order
exports.createPurchaseOrder = asyncHandler(async (req, res) => {
    const {
        supplier,
        expectedDeliveryDate,
        items,
        deliveryAddress,
        paymentInfo,
        terms,
        notes,
        priority
    } = req.body;
    
    // Calculate pricing
    let subtotal = 0;
    let totalGST = 0;
    
    const processedItems = items.map(item => {
        const itemTotal = item.quantity * item.unitPrice;
        const gstAmount = (itemTotal * item.gstRate) / 100;
        
        subtotal += itemTotal;
        totalGST += gstAmount;
        
        return {
            ...item,
            totalPrice: itemTotal,
            cgst: gstAmount / 2,
            sgst: gstAmount / 2,
            igst: 0, // Assuming intra-state for now
            totalTax: gstAmount
        };
    });
    
    const grandTotal = subtotal + totalGST;
    
    const purchaseOrder = new PurchaseOrder({
        supplier,
        expectedDeliveryDate,
        items: processedItems,
        pricing: {
            subtotal,
            taxableAmount: subtotal,
            totalGST,
            grandTotal
        },
        deliveryAddress,
        paymentInfo: {
            ...paymentInfo,
            balanceAmount: grandTotal
        },
        terms,
        notes,
        priority,
        createdBy: req.user._id
    });
    
    await purchaseOrder.save();
    
    res.success({
        purchaseOrder: purchaseOrder.getFormattedData()
    }, 'Purchase order created successfully', 201);
});

// Update purchase order
exports.updatePurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    // Only allow updates if PO is in draft status
    if (purchaseOrder.status !== 'draft') {
        return res.error('Only draft purchase orders can be updated', [], 400);
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'createdBy') {
            purchaseOrder[key] = updateData[key];
        }
    });
    
    purchaseOrder.lastUpdatedBy = req.user._id;
    await purchaseOrder.save();
    
    res.success({
        purchaseOrder: purchaseOrder.getFormattedData()
    }, 'Purchase order updated successfully');
});

// Approve purchase order
exports.approvePurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    await purchaseOrder.approve(req.user._id);
    
    res.success({
        purchaseOrder: purchaseOrder.getFormattedData()
    }, 'Purchase order approved successfully');
});

// Reject purchase order
exports.rejectPurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    await purchaseOrder.reject(reason, req.user._id);
    
    res.success({
        purchaseOrder: purchaseOrder.getFormattedData()
    }, 'Purchase order rejected successfully');
});

// Receive items
exports.receiveItems = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { receivedItems } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    try {
        await purchaseOrder.receiveItems(receivedItems, req.user._id);
        
        res.success({
            purchaseOrder: purchaseOrder.getFormattedData()
        }, 'Items received successfully');
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Cancel purchase order
exports.cancelPurchaseOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    await purchaseOrder.cancel(reason, req.user._id);
    
    res.success({
        purchaseOrder: purchaseOrder.getFormattedData()
    }, 'Purchase order cancelled successfully');
});

// Get overdue purchase orders
exports.getOverduePurchaseOrders = asyncHandler(async (req, res) => {
    const overduePOs = await PurchaseOrder.getOverduePOs();
    
    res.success({
        purchaseOrders: overduePOs.map(po => po.getFormattedData()),
        count: overduePOs.length
    }, 'Overdue purchase orders retrieved successfully');
});

// Get POs needing approval
exports.getPOsNeedingApproval = asyncHandler(async (req, res) => {
    const pendingPOs = await PurchaseOrder.getPOsNeedingApproval();
    
    res.success({
        purchaseOrders: pendingPOs.map(po => po.getFormattedData()),
        count: pendingPOs.length
    }, 'Purchase orders needing approval retrieved successfully');
});

// Get PO summary
exports.getPOSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const summary = await PurchaseOrder.getPOSummary({ startDate, endDate });
    
    res.success({
        summary
    }, 'Purchase order summary retrieved successfully');
});

// Generate PO PDF
exports.generatePOPDF = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findById(id)
        .populate('supplier', 'name code contactInfo addresses businessInfo')
        .populate('items.product', 'name sku');
    
    if (!purchaseOrder) {
        return res.error('Purchase order not found', [], 404);
    }
    
    try {
        const pdfBuffer = await generatePOPDF(purchaseOrder);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="PO-${purchaseOrder.formattedPONumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        return res.error('Failed to generate PDF', [error.message], 500);
    }
});

// Export POs to Excel
exports.exportPOsToExcel = asyncHandler(async (req, res) => {
    const { status, supplier, startDate, endDate, format = 'detailed' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (supplier) query.supplier = supplier;
    
    if (startDate || endDate) {
        query.poDate = {};
        if (startDate) query.poDate.$gte = new Date(startDate);
        if (endDate) query.poDate.$lte = new Date(endDate);
    }
    
    const purchaseOrders = await PurchaseOrder.find(query)
        .populate('supplier', 'name code')
        .sort({ poDate: -1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Purchase Orders');
    
    if (format === 'detailed') {
        worksheet.addRow([
            'PO Number', 'PO Date', 'Supplier', 'Expected Delivery', 'Status',
            'Total Amount', 'Paid Amount', 'Balance', 'Completion %', 'Created By'
        ]);
        
        purchaseOrders.forEach(po => {
            worksheet.addRow([
                po.formattedPONumber,
                po.poDate.toLocaleDateString(),
                po.supplier.name,
                po.expectedDeliveryDate.toLocaleDateString(),
                po.status,
                po.pricing.grandTotal,
                po.paymentInfo.paidAmount,
                po.paymentInfo.balanceAmount,
                po.completionPercentage,
                po.createdBy
            ]);
        });
    } else {
        worksheet.addRow(['PO Number', 'Date', 'Supplier', 'Amount', 'Status']);
        
        purchaseOrders.forEach(po => {
            worksheet.addRow([
                po.formattedPONumber,
                po.poDate.toLocaleDateString(),
                po.supplier.name,
                po.pricing.grandTotal,
                po.status
            ]);
        });
    }
    
    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    worksheet.columns.forEach(column => {
        column.width = 15;
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    const filename = `Purchase-Orders-${format}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

// Get PO analytics
exports.getPOAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
        matchStage.poDate = {};
        if (startDate) matchStage.poDate.$gte = new Date(startDate);
        if (endDate) matchStage.poDate.$lte = new Date(endDate);
    }
    
    // Basic metrics
    const summary = await PurchaseOrder.getPOSummary({ startDate, endDate });
    
    // Status distribution
    const statusDistribution = await PurchaseOrder.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$pricing.grandTotal' } } }
    ]);
    
    // Supplier-wise analysis
    const supplierAnalysis = await PurchaseOrder.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: 'suppliers',
                localField: 'supplier',
                foreignField: '_id',
                as: 'supplierInfo'
            }
        },
        { $unwind: '$supplierInfo' },
        {
            $group: {
                _id: '$supplierInfo.name',
                totalPOs: { $sum: 1 },
                totalAmount: { $sum: '$pricing.grandTotal' },
                avgAmount: { $avg: '$pricing.grandTotal' }
            }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
    ]);
    
    res.success({
        analytics: {
            summary,
            statusDistribution,
            supplierAnalysis
        }
    }, 'Purchase order analytics retrieved successfully');
});

// Helper function to generate PO PDF
async function generatePOPDF(purchaseOrder) {
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
            doc.fontSize(20).text('PURCHASE ORDER', 50, 50);
            doc.fontSize(12).text(`PO Number: ${purchaseOrder.formattedPONumber}`, 50, 80);
            doc.text(`PO Date: ${purchaseOrder.poDate.toLocaleDateString()}`, 50, 95);
            doc.text(`Expected Delivery: ${purchaseOrder.expectedDeliveryDate.toLocaleDateString()}`, 50, 110);

            // Supplier details
            doc.text('Supplier:', 50, 140);
            doc.text(purchaseOrder.supplier.name, 50, 155);
            if (purchaseOrder.supplier.addresses && purchaseOrder.supplier.addresses.length > 0) {
                const address = purchaseOrder.supplier.addresses[0];
                doc.text(`${address.street}, ${address.city}`, 50, 170);
                doc.text(`${address.state} - ${address.postalCode}`, 50, 185);
            }

            // Items table
            let yPosition = 220;
            doc.text('Items:', 50, yPosition);
            yPosition += 20;
            
            doc.text('Product', 50, yPosition);
            doc.text('Qty', 200, yPosition);
            doc.text('Rate', 250, yPosition);
            doc.text('Amount', 350, yPosition);
            yPosition += 20;

            purchaseOrder.items.forEach(item => {
                doc.text(item.productName, 50, yPosition);
                doc.text(item.quantity.toString(), 200, yPosition);
                doc.text(`₹${item.unitPrice}`, 250, yPosition);
                doc.text(`₹${item.totalPrice}`, 350, yPosition);
                yPosition += 20;
            });

            // Totals
            yPosition += 20;
            doc.text(`Subtotal: ₹${purchaseOrder.pricing.subtotal}`, 250, yPosition);
            yPosition += 15;
            doc.text(`Total GST: ₹${purchaseOrder.pricing.totalGST}`, 250, yPosition);
            yPosition += 15;
            doc.fontSize(14).text(`Grand Total: ₹${purchaseOrder.pricing.grandTotal}`, 250, yPosition);

            // Terms
            if (purchaseOrder.terms) {
                yPosition += 40;
                doc.fontSize(12).text('Terms & Conditions:', 50, yPosition);
                doc.text(purchaseOrder.terms, 50, yPosition + 15);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = exports;
