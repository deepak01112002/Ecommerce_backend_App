const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const { asyncHandler } = require('../middlewares/errorHandler');
const ExcelJS = require('exceljs');

// Get all suppliers
exports.getAllSuppliers = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        status,
        type,
        sortBy = 'name',
        sortOrder = 'asc',
        isApproved
    } = req.query;
    
    const query = {};
    
    // Filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    
    if (search) {
        query.$or = [
            { name: new RegExp(search, 'i') },
            { code: new RegExp(search, 'i') },
            { 'contactInfo.companyEmail': new RegExp(search, 'i') },
            { 'businessInfo.gstin': new RegExp(search, 'i') }
        ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const suppliers = await Supplier.find(query)
        .populate('productCategories.category', 'name')
        .populate('approvedBy', 'firstName lastName')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Supplier.countDocuments(query);
    
    const formattedSuppliers = suppliers.map(supplier => supplier.getFormattedData());
    
    res.success({
        suppliers: formattedSuppliers,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Suppliers retrieved successfully');
});

// Get single supplier
exports.getSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id)
        .populate('productCategories.category', 'name')
        .populate('approvedBy', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .populate('lastUpdatedBy', 'firstName lastName');
    
    if (!supplier) {
        return res.error('Supplier not found', [], 404);
    }
    
    // Get recent purchase orders
    const recentPOs = await PurchaseOrder.find({ supplier: id })
        .sort({ poDate: -1 })
        .limit(5)
        .select('poNumber poDate status pricing.grandTotal');
    
    res.success({
        supplier: supplier.getFormattedData(),
        recentPurchaseOrders: recentPOs
    }, 'Supplier retrieved successfully');
});

// Create new supplier
exports.createSupplier = asyncHandler(async (req, res) => {
    const supplierData = {
        ...req.body,
        createdBy: req.user._id
    };
    
    const supplier = new Supplier(supplierData);
    await supplier.save();
    
    res.success({
        supplier: supplier.getFormattedData()
    }, 'Supplier created successfully', 201);
});

// Update supplier
exports.updateSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
        return res.error('Supplier not found', [], 404);
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
            supplier[key] = updateData[key];
        }
    });
    
    supplier.lastUpdatedBy = req.user._id;
    await supplier.save();
    
    res.success({
        supplier: supplier.getFormattedData()
    }, 'Supplier updated successfully');
});

// Delete supplier
exports.deleteSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
        return res.error('Supplier not found', [], 404);
    }
    
    // Check if supplier has active purchase orders
    const activePOs = await PurchaseOrder.countDocuments({
        supplier: id,
        status: { $nin: ['completed', 'cancelled', 'closed'] }
    });
    
    if (activePOs > 0) {
        return res.error('Cannot delete supplier with active purchase orders', [], 400);
    }
    
    supplier.status = 'inactive';
    supplier.lastUpdatedBy = req.user._id;
    await supplier.save();
    
    res.success({
        message: 'Supplier deactivated successfully'
    }, 'Supplier deactivated successfully');
});

// Approve supplier
exports.approveSupplier = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
        return res.error('Supplier not found', [], 404);
    }
    
    await supplier.approve(req.user._id);
    
    res.success({
        supplier: supplier.getFormattedData()
    }, 'Supplier approved successfully');
});

// Get active suppliers
exports.getActiveSuppliers = asyncHandler(async (req, res) => {
    const { category, limit = 50 } = req.query;
    
    const suppliers = await Supplier.getActiveSuppliers({
        category,
        limit: parseInt(limit)
    });
    
    res.success({
        suppliers: suppliers.map(supplier => supplier.getFormattedData())
    }, 'Active suppliers retrieved successfully');
});

// Get supplier performance report
exports.getSupplierPerformanceReport = asyncHandler(async (req, res) => {
    const performanceReport = await Supplier.getPerformanceReport();
    
    res.success({
        performanceReport
    }, 'Supplier performance report retrieved successfully');
});

// Update supplier performance
exports.updateSupplierPerformance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { orderData } = req.body;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
        return res.error('Supplier not found', [], 404);
    }
    
    await supplier.updatePerformance(orderData);
    
    res.success({
        supplier: supplier.getFormattedData()
    }, 'Supplier performance updated successfully');
});

// Update supplier financials
exports.updateSupplierFinancials = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, type } = req.body;
    
    const supplier = await Supplier.findById(id);
    if (!supplier) {
        return res.error('Supplier not found', [], 404);
    }
    
    await supplier.updateFinancials(amount, type);
    
    res.success({
        supplier: supplier.getFormattedData()
    }, 'Supplier financials updated successfully');
});

// Export suppliers to Excel
exports.exportSuppliersToExcel = asyncHandler(async (req, res) => {
    const { status, type, format = 'detailed' } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    const suppliers = await Supplier.find(query)
        .populate('productCategories.category', 'name')
        .sort({ name: 1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Suppliers');
    
    if (format === 'detailed') {
        worksheet.addRow([
            'Supplier Code', 'Name', 'Type', 'Contact Person', 'Phone', 'Email',
            'GSTIN', 'Status', 'Rating', 'Total Orders', 'On-Time Delivery %',
            'Outstanding Balance', 'Created Date'
        ]);
        
        suppliers.forEach(supplier => {
            worksheet.addRow([
                supplier.code,
                supplier.name,
                supplier.type,
                supplier.contactInfo.primaryContact?.name || '',
                supplier.contactInfo.primaryContact?.phone || '',
                supplier.contactInfo.companyEmail || '',
                supplier.businessInfo.gstin || '',
                supplier.status,
                supplier.performance.rating,
                supplier.performance.totalOrders,
                supplier.performance.onTimeDeliveryRate,
                supplier.outstandingBalance,
                supplier.createdAt.toLocaleDateString()
            ]);
        });
    } else {
        worksheet.addRow(['Code', 'Name', 'Contact', 'Status', 'Rating']);
        
        suppliers.forEach(supplier => {
            worksheet.addRow([
                supplier.code,
                supplier.name,
                supplier.contactInfo.primaryContact?.phone || '',
                supplier.status,
                supplier.performance.rating
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
    
    const filename = `Suppliers-${format}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

// Get supplier analytics
exports.getSupplierAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Basic supplier metrics
    const totalSuppliers = await Supplier.countDocuments({ status: 'active' });
    const approvedSuppliers = await Supplier.countDocuments({ status: 'active', isApproved: true });
    const pendingApproval = await Supplier.countDocuments({ status: 'pending_approval' });
    
    // Supplier type distribution
    const typeDistribution = await Supplier.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Performance distribution
    const performanceDistribution = await Supplier.aggregate([
        { $match: { status: 'active', isApproved: true } },
        {
            $bucket: {
                groupBy: '$performance.rating',
                boundaries: [1, 2, 3, 4, 5, 6],
                default: 'Other',
                output: {
                    count: { $sum: 1 },
                    avgOnTimeDelivery: { $avg: '$performance.onTimeDeliveryRate' }
                }
            }
        }
    ]);
    
    // Top suppliers by orders
    const topSuppliers = await Supplier.find({ status: 'active', isApproved: true })
        .sort({ 'performance.totalOrders': -1 })
        .limit(10)
        .select('name performance.totalOrders performance.rating');
    
    res.success({
        analytics: {
            summary: {
                totalSuppliers,
                approvedSuppliers,
                pendingApproval,
                approvalRate: totalSuppliers > 0 ? (approvedSuppliers / totalSuppliers * 100) : 0
            },
            typeDistribution,
            performanceDistribution,
            topSuppliers
        }
    }, 'Supplier analytics retrieved successfully');
});

module.exports = exports;
