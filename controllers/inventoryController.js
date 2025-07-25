const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const { asyncHandler } = require('../middlewares/errorHandler');
const ExcelJS = require('exceljs');

// Get inventory dashboard
exports.getInventoryDashboard = asyncHandler(async (req, res) => {
    // Get inventory summary
    const summary = await Inventory.getInventorySummary();
    
    // Get low stock items
    const lowStockItems = await Inventory.getLowStockItems(10);
    
    // Get items needing reorder
    const reorderItems = await Inventory.getReorderItems();
    
    // Get recent stock movements
    const recentMovements = await Inventory.find({ isActive: true })
        .populate('product', 'name sku images')
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('product currentStock lastStockIn lastStockOut updatedAt');
    
    // Stock status distribution
    const statusDistribution = await Inventory.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$stockStatus',
                count: { $sum: 1 },
                totalValue: { $sum: '$totalStockValue' }
            }
        }
    ]);
    
    res.success({
        dashboard: {
            summary,
            lowStockItems: lowStockItems.map(item => item.getFormattedData()),
            reorderItems: reorderItems.map(item => item.getFormattedData()),
            recentMovements,
            statusDistribution
        }
    }, 'Inventory dashboard retrieved successfully');
});

// Get all inventory items
exports.getAllInventory = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        search,
        stockStatus,
        category,
        supplier,
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        lowStock = false,
        needsReorder = false
    } = req.query;
    
    const query = { isActive: true };
    
    // Filters
    if (stockStatus) query.stockStatus = stockStatus;
    if (lowStock === 'true') {
        query.stockStatus = { $in: ['low_stock', 'out_of_stock'] };
    }
    if (needsReorder === 'true') {
        query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }
    if (supplier) query.primarySupplier = supplier;
    
    // Build aggregation pipeline
    const pipeline = [
        {
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        { $match: query }
    ];
    
    // Add search filter
    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { 'productInfo.name': new RegExp(search, 'i') },
                    { 'productInfo.sku': new RegExp(search, 'i') }
                ]
            }
        });
    }
    
    // Add category filter
    if (category) {
        pipeline.push({
            $match: { 'productInfo.category': new mongoose.Types.ObjectId(category) }
        });
    }
    
    // Add sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });
    
    // Add pagination
    pipeline.push(
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    );
    
    // Add population
    pipeline.push(
        {
            $lookup: {
                from: 'suppliers',
                localField: 'primarySupplier',
                foreignField: '_id',
                as: 'supplierInfo'
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'productInfo.category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        }
    );
    
    const inventory = await Inventory.aggregate(pipeline);
    
    // Get total count for pagination
    const totalPipeline = pipeline.slice(0, -3); // Remove skip, limit, and lookups
    totalPipeline.push({ $count: 'total' });
    const totalResult = await Inventory.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;
    
    const formattedInventory = inventory.map(item => ({
        _id: item._id,
        product: {
            _id: item.productInfo._id,
            name: item.productInfo.name,
            sku: item.productInfo.sku,
            images: item.productInfo.images,
            category: item.categoryInfo[0]?.name
        },
        currentStock: item.currentStock,
        reservedStock: item.reservedStock,
        availableStock: item.availableStock,
        stockStatus: item.stockStatus,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        reorderLevel: item.reorderLevel,
        reorderQuantity: item.reorderQuantity,
        averageCost: item.averageCost,
        totalStockValue: item.totalStockValue,
        location: item.location,
        primarySupplier: item.supplierInfo[0],
        lastStockIn: item.lastStockIn,
        lastStockOut: item.lastStockOut,
        needsReorder: item.currentStock <= item.reorderLevel,
        updatedAt: item.updatedAt
    }));
    
    res.success({
        inventory: formattedInventory,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        },
        filters: {
            search,
            stockStatus,
            category,
            supplier,
            lowStock,
            needsReorder
        }
    }, 'Inventory retrieved successfully');
});

// Get single inventory item
exports.getInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const inventory = await Inventory.findById(id)
        .populate('product', 'name sku description images category')
        .populate('primarySupplier', 'name contactInfo')
        .populate('alternateSuppliers.supplier', 'name contactInfo')
        .populate('lastUpdatedBy', 'firstName lastName');
    
    if (!inventory) {
        return res.error('Inventory item not found', [], 404);
    }
    
    res.success({
        inventory: inventory.getFormattedData()
    }, 'Inventory item retrieved successfully');
});

// Update inventory item
exports.updateInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const inventory = await Inventory.findById(id);
    if (!inventory) {
        return res.error('Inventory item not found', [], 404);
    }
    
    // Update allowed fields
    const allowedFields = [
        'minStockLevel', 'maxStockLevel', 'reorderLevel', 'reorderQuantity',
        'location', 'primarySupplier', 'alternateSuppliers', 'notes',
        'alerts', 'trackingEnabled', 'batchTracking', 'serialTracking', 'expiryTracking'
    ];
    
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            inventory[field] = updateData[field];
        }
    });
    
    inventory.lastUpdatedBy = req.user._id;
    await inventory.save();
    
    res.success({
        inventory: inventory.getFormattedData()
    }, 'Inventory item updated successfully');
});

// Update stock (Stock In/Out)
exports.updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, type, reference, cost, reason } = req.body;
    
    const inventory = await Inventory.findById(id).populate('product', 'name sku');
    if (!inventory) {
        return res.error('Inventory item not found', [], 404);
    }
    
    try {
        await inventory.updateStock(quantity, type, reference, {
            cost,
            reason,
            updatedBy: req.user._id
        });
        
        res.success({
            inventory: inventory.getFormattedData(),
            message: `Stock ${type === 'in' ? 'added' : 'removed'} successfully`
        }, `Stock ${type === 'in' ? 'added' : 'removed'} successfully`);
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Reserve stock
exports.reserveStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    
    const inventory = await Inventory.findById(id);
    if (!inventory) {
        return res.error('Inventory item not found', [], 404);
    }
    
    try {
        await inventory.reserveStock(quantity);
        
        res.success({
            inventory: inventory.getFormattedData()
        }, 'Stock reserved successfully');
    } catch (error) {
        return res.error(error.message, [], 400);
    }
});

// Release reserved stock
exports.releaseReservedStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    
    const inventory = await Inventory.findById(id);
    if (!inventory) {
        return res.error('Inventory item not found', [], 404);
    }
    
    await inventory.releaseReservedStock(quantity);
    
    res.success({
        inventory: inventory.getFormattedData()
    }, 'Reserved stock released successfully');
});

// Perform stock count
exports.performStockCount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { countedStock } = req.body;
    
    const inventory = await Inventory.findById(id);
    if (!inventory) {
        return res.error('Inventory item not found', [], 404);
    }
    
    await inventory.performStockCount(countedStock, req.user._id);
    
    res.success({
        inventory: inventory.getFormattedData(),
        variance: inventory.lastStockCount.variance
    }, 'Stock count performed successfully');
});

// Get low stock items
exports.getLowStockItems = asyncHandler(async (req, res) => {
    const { limit = 50 } = req.query;
    
    const lowStockItems = await Inventory.getLowStockItems(parseInt(limit));
    
    res.success({
        items: lowStockItems.map(item => item.getFormattedData()),
        count: lowStockItems.length
    }, 'Low stock items retrieved successfully');
});

// Get items needing reorder
exports.getReorderItems = asyncHandler(async (req, res) => {
    const reorderItems = await Inventory.getReorderItems();
    
    res.success({
        items: reorderItems.map(item => item.getFormattedData()),
        count: reorderItems.length
    }, 'Reorder items retrieved successfully');
});

// Generate reorder suggestions
exports.generateReorderSuggestions = asyncHandler(async (req, res) => {
    const reorderItems = await Inventory.getReorderItems();
    
    const suggestions = reorderItems.map(item => ({
        inventory: item.getFormattedData(),
        suggestedQuantity: item.reorderQuantity,
        estimatedCost: item.reorderQuantity * item.averageCost,
        supplier: item.primarySupplier,
        urgency: item.currentStock === 0 ? 'critical' : 
                item.currentStock <= (item.minStockLevel / 2) ? 'high' : 'medium'
    }));
    
    res.success({
        suggestions,
        totalItems: suggestions.length,
        totalEstimatedCost: suggestions.reduce((sum, item) => sum + item.estimatedCost, 0)
    }, 'Reorder suggestions generated successfully');
});

// Export inventory to Excel
exports.exportInventoryToExcel = asyncHandler(async (req, res) => {
    const { stockStatus, category, format = 'detailed' } = req.query;
    
    const query = { isActive: true };
    if (stockStatus) query.stockStatus = stockStatus;
    
    const inventory = await Inventory.find(query)
        .populate('product', 'name sku category')
        .populate('primarySupplier', 'name')
        .sort({ 'product.name': 1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory Report');
    
    if (format === 'detailed') {
        // Detailed format
        worksheet.addRow([
            'Product Name', 'SKU', 'Current Stock', 'Reserved Stock', 'Available Stock',
            'Stock Status', 'Min Level', 'Max Level', 'Reorder Level', 'Reorder Qty',
            'Average Cost', 'Stock Value', 'Location', 'Supplier', 'Last Updated'
        ]);
        
        inventory.forEach(item => {
            worksheet.addRow([
                item.product.name,
                item.product.sku,
                item.currentStock,
                item.reservedStock,
                item.availableStock,
                item.stockStatus,
                item.minStockLevel,
                item.maxStockLevel,
                item.reorderLevel,
                item.reorderQuantity,
                item.averageCost,
                item.totalStockValue,
                `${item.location.warehouse} - ${item.location.section || ''}`,
                item.primarySupplier?.name || '',
                item.updatedAt.toLocaleDateString()
            ]);
        });
    } else {
        // Summary format
        worksheet.addRow(['Product Name', 'SKU', 'Stock', 'Status', 'Value']);
        
        inventory.forEach(item => {
            worksheet.addRow([
                item.product.name,
                item.product.sku,
                item.currentStock,
                item.stockStatus,
                item.totalStockValue
            ]);
        });
    }
    
    // Style the headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.width = 15;
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    const filename = `Inventory-Report-${format}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

// Get inventory analytics
exports.getInventoryAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    // Basic inventory metrics
    const summary = await Inventory.getInventorySummary();
    
    // Stock movement trends (if date range provided)
    let movementTrends = [];
    if (startDate && endDate) {
        // This would require a stock movement history table in a real implementation
        // For now, we'll provide current stock status
    }
    
    // Category-wise stock distribution
    const categoryDistribution = await Inventory.aggregate([
        { $match: { isActive: true } },
        {
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        {
            $lookup: {
                from: 'categories',
                localField: 'productInfo.category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        { $unwind: '$categoryInfo' },
        {
            $group: {
                _id: '$categoryInfo.name',
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$currentStock' },
                totalValue: { $sum: '$totalStockValue' },
                avgStock: { $avg: '$currentStock' }
            }
        },
        { $sort: { totalValue: -1 } }
    ]);
    
    // Supplier-wise distribution
    const supplierDistribution = await Inventory.aggregate([
        { $match: { isActive: true, primarySupplier: { $exists: true } } },
        {
            $lookup: {
                from: 'suppliers',
                localField: 'primarySupplier',
                foreignField: '_id',
                as: 'supplierInfo'
            }
        },
        { $unwind: '$supplierInfo' },
        {
            $group: {
                _id: '$supplierInfo.name',
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$currentStock' },
                totalValue: { $sum: '$totalStockValue' }
            }
        },
        { $sort: { totalValue: -1 } },
        { $limit: 10 }
    ]);
    
    res.success({
        analytics: {
            summary,
            categoryDistribution,
            supplierDistribution,
            movementTrends
        }
    }, 'Inventory analytics retrieved successfully');
});

module.exports = exports;
