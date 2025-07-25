const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const PurchaseOrder = require('../models/PurchaseOrder');
const { asyncHandler } = require('../middlewares/errorHandler');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Get sales report
exports.getSalesReport = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        groupBy = 'day',
        productId,
        categoryId,
        customerId
    } = req.query;
    
    if (!startDate || !endDate) {
        return res.error('Start date and end date are required', [], 400);
    }
    
    const matchStage = {
        orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        },
        status: { $in: ['processing', 'shipped', 'delivered', 'completed'] }
    };
    
    if (productId) matchStage['items.product'] = new mongoose.Types.ObjectId(productId);
    if (customerId) matchStage.user = new mongoose.Types.ObjectId(customerId);
    
    // Group stage based on groupBy parameter
    let groupStage;
    switch (groupBy) {
        case 'hour':
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' },
                    day: { $dayOfMonth: '$orderDate' },
                    hour: { $hour: '$orderDate' }
                }
            };
            break;
        case 'week':
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' },
                    week: { $week: '$orderDate' }
                }
            };
            break;
        case 'month':
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' }
                }
            };
            break;
        case 'year':
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' }
                }
            };
            break;
        default: // day
            groupStage = {
                _id: {
                    year: { $year: '$orderDate' },
                    month: { $month: '$orderDate' },
                    day: { $dayOfMonth: '$orderDate' }
                }
            };
    }
    
    const salesData = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                ...groupStage,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.total' },
                totalItems: { $sum: { $size: '$items' } },
                avgOrderValue: { $avg: '$pricing.total' },
                uniqueCustomers: { $addToSet: '$user' }
            }
        },
        {
            $addFields: {
                uniqueCustomerCount: { $size: '$uniqueCustomers' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.week': 1 } }
    ]);
    
    // Get top products
    const topProducts = await Order.aggregate([
        { $match: matchStage },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
                orderCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' },
        {
            $project: {
                productName: '$productInfo.name',
                sku: '$productInfo.sku',
                totalQuantity: 1,
                totalRevenue: 1,
                orderCount: 1
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
    ]);
    
    // Get top customers
    const topCustomers = await Order.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$user',
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' },
                avgOrderValue: { $avg: '$pricing.total' }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'customerInfo'
            }
        },
        { $unwind: '$customerInfo' },
        {
            $project: {
                customerName: { $concat: ['$customerInfo.firstName', ' ', '$customerInfo.lastName'] },
                email: '$customerInfo.email',
                totalOrders: 1,
                totalSpent: 1,
                avgOrderValue: 1
            }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
    ]);
    
    // Calculate summary
    const summary = salesData.reduce((acc, item) => {
        acc.totalOrders += item.totalOrders;
        acc.totalRevenue += item.totalRevenue;
        acc.totalItems += item.totalItems;
        acc.uniqueCustomers = Math.max(acc.uniqueCustomers, item.uniqueCustomerCount);
        return acc;
    }, {
        totalOrders: 0,
        totalRevenue: 0,
        totalItems: 0,
        uniqueCustomers: 0
    });
    
    summary.avgOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;
    
    res.success({
        report: {
            summary,
            salesData,
            topProducts,
            topCustomers,
            period: { startDate, endDate, groupBy }
        }
    }, 'Sales report generated successfully');
});

// Get profit & loss report
exports.getProfitLossReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.error('Start date and end date are required', [], 400);
    }
    
    const dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
    };
    
    // Revenue from orders
    const revenueData = await Order.aggregate([
        {
            $match: {
                orderDate: dateFilter,
                status: { $in: ['processing', 'shipped', 'delivered', 'completed'] }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$pricing.total' },
                totalShipping: { $sum: '$pricing.shipping' },
                totalTax: { $sum: '$pricing.tax' },
                totalOrders: { $sum: 1 }
            }
        }
    ]);
    
    // Cost of goods sold (from purchase orders)
    const cogsData = await PurchaseOrder.aggregate([
        {
            $match: {
                poDate: dateFilter,
                status: { $in: ['completed', 'partial'] }
            }
        },
        {
            $group: {
                _id: null,
                totalCOGS: { $sum: '$pricing.grandTotal' },
                totalPurchaseOrders: { $sum: 1 }
            }
        }
    ]);
    
    // Operating expenses (this would come from an expenses model in real implementation)
    const operatingExpenses = {
        salaries: 0,
        rent: 0,
        utilities: 0,
        marketing: 0,
        other: 0
    };
    
    const revenue = revenueData[0] || {
        totalRevenue: 0,
        totalShipping: 0,
        totalTax: 0,
        totalOrders: 0
    };
    
    const cogs = cogsData[0] || {
        totalCOGS: 0,
        totalPurchaseOrders: 0
    };
    
    // Calculate P&L
    const grossProfit = revenue.totalRevenue - cogs.totalCOGS;
    const totalOperatingExpenses = Object.values(operatingExpenses).reduce((sum, exp) => sum + exp, 0);
    const netProfit = grossProfit - totalOperatingExpenses;
    const grossMargin = revenue.totalRevenue > 0 ? (grossProfit / revenue.totalRevenue) * 100 : 0;
    const netMargin = revenue.totalRevenue > 0 ? (netProfit / revenue.totalRevenue) * 100 : 0;
    
    res.success({
        report: {
            period: { startDate, endDate },
            revenue: {
                totalRevenue: revenue.totalRevenue,
                shippingRevenue: revenue.totalShipping,
                taxCollected: revenue.totalTax,
                totalOrders: revenue.totalOrders
            },
            costs: {
                costOfGoodsSold: cogs.totalCOGS,
                operatingExpenses,
                totalOperatingExpenses
            },
            profitability: {
                grossProfit,
                netProfit,
                grossMargin,
                netMargin
            },
            metrics: {
                avgOrderValue: revenue.totalOrders > 0 ? revenue.totalRevenue / revenue.totalOrders : 0,
                avgCOGSPerOrder: revenue.totalOrders > 0 ? cogs.totalCOGS / revenue.totalOrders : 0
            }
        }
    }, 'Profit & Loss report generated successfully');
});

// Get inventory report
exports.getInventoryReport = asyncHandler(async (req, res) => {
    const { category, supplier, stockStatus } = req.query;
    
    const query = { isActive: true };
    if (stockStatus) query.stockStatus = stockStatus;
    if (supplier) query.primarySupplier = supplier;
    
    const pipeline = [
        { $match: query },
        {
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productInfo'
            }
        },
        { $unwind: '$productInfo' }
    ];
    
    if (category) {
        pipeline.push({
            $match: { 'productInfo.category': new mongoose.Types.ObjectId(category) }
        });
    }
    
    pipeline.push(
        {
            $lookup: {
                from: 'categories',
                localField: 'productInfo.category',
                foreignField: '_id',
                as: 'categoryInfo'
            }
        },
        {
            $lookup: {
                from: 'suppliers',
                localField: 'primarySupplier',
                foreignField: '_id',
                as: 'supplierInfo'
            }
        }
    );
    
    const inventoryData = await Inventory.aggregate(pipeline);
    
    // Calculate summary
    const summary = inventoryData.reduce((acc, item) => {
        acc.totalProducts += 1;
        acc.totalStock += item.currentStock;
        acc.totalValue += item.totalStockValue;
        
        if (item.stockStatus === 'low_stock') acc.lowStockItems += 1;
        if (item.stockStatus === 'out_of_stock') acc.outOfStockItems += 1;
        if (item.currentStock <= item.reorderLevel) acc.reorderItems += 1;
        
        return acc;
    }, {
        totalProducts: 0,
        totalStock: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        reorderItems: 0
    });
    
    // Category-wise breakdown
    const categoryBreakdown = {};
    inventoryData.forEach(item => {
        const categoryName = item.categoryInfo[0]?.name || 'Uncategorized';
        if (!categoryBreakdown[categoryName]) {
            categoryBreakdown[categoryName] = {
                products: 0,
                totalStock: 0,
                totalValue: 0
            };
        }
        categoryBreakdown[categoryName].products += 1;
        categoryBreakdown[categoryName].totalStock += item.currentStock;
        categoryBreakdown[categoryName].totalValue += item.totalStockValue;
    });
    
    res.success({
        report: {
            summary,
            categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({
                category: name,
                ...data
            })),
            inventoryItems: inventoryData.map(item => ({
                productName: item.productInfo.name,
                sku: item.productInfo.sku,
                category: item.categoryInfo[0]?.name,
                supplier: item.supplierInfo[0]?.name,
                currentStock: item.currentStock,
                stockStatus: item.stockStatus,
                stockValue: item.totalStockValue,
                lastUpdated: item.updatedAt
            }))
        }
    }, 'Inventory report generated successfully');
});

// Get customer analytics report
exports.getCustomerAnalyticsReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
        orderDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    } : {};
    
    // Customer segmentation
    const customerSegmentation = await Order.aggregate([
        { $match: { ...dateFilter, status: { $in: ['processing', 'shipped', 'delivered', 'completed'] } } },
        {
            $group: {
                _id: '$user',
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' },
                avgOrderValue: { $avg: '$pricing.total' },
                firstOrder: { $min: '$orderDate' },
                lastOrder: { $max: '$orderDate' }
            }
        },
        {
            $addFields: {
                customerLifetime: {
                    $divide: [
                        { $subtract: ['$lastOrder', '$firstOrder'] },
                        1000 * 60 * 60 * 24 // Convert to days
                    ]
                },
                segment: {
                    $switch: {
                        branches: [
                            { case: { $gte: ['$totalSpent', 10000] }, then: 'VIP' },
                            { case: { $gte: ['$totalSpent', 5000] }, then: 'Premium' },
                            { case: { $gte: ['$totalSpent', 1000] }, then: 'Regular' }
                        ],
                        default: 'New'
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'customerInfo'
            }
        },
        { $unwind: '$customerInfo' }
    ]);
    
    // Segment summary
    const segmentSummary = customerSegmentation.reduce((acc, customer) => {
        const segment = customer.segment;
        if (!acc[segment]) {
            acc[segment] = { count: 0, totalRevenue: 0, avgSpent: 0 };
        }
        acc[segment].count += 1;
        acc[segment].totalRevenue += customer.totalSpent;
        return acc;
    }, {});
    
    // Calculate average spent per segment
    Object.keys(segmentSummary).forEach(segment => {
        segmentSummary[segment].avgSpent = segmentSummary[segment].totalRevenue / segmentSummary[segment].count;
    });
    
    // Customer retention analysis
    const retentionAnalysis = await Order.aggregate([
        { $match: { ...dateFilter, status: { $in: ['processing', 'shipped', 'delivered', 'completed'] } } },
        {
            $group: {
                _id: '$user',
                orderDates: { $push: '$orderDate' }
            }
        },
        {
            $addFields: {
                orderCount: { $size: '$orderDates' },
                isReturning: { $gt: [{ $size: '$orderDates' }, 1] }
            }
        },
        {
            $group: {
                _id: null,
                totalCustomers: { $sum: 1 },
                returningCustomers: { $sum: { $cond: ['$isReturning', 1, 0] } },
                oneTimeCustomers: { $sum: { $cond: ['$isReturning', 0, 1] } }
            }
        }
    ]);
    
    const retention = retentionAnalysis[0] || {
        totalCustomers: 0,
        returningCustomers: 0,
        oneTimeCustomers: 0
    };
    
    retention.retentionRate = retention.totalCustomers > 0 ? 
        (retention.returningCustomers / retention.totalCustomers) * 100 : 0;
    
    res.success({
        report: {
            period: { startDate, endDate },
            segmentSummary,
            retention,
            topCustomers: customerSegmentation
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 20)
                .map(customer => ({
                    name: `${customer.customerInfo.firstName} ${customer.customerInfo.lastName}`,
                    email: customer.customerInfo.email,
                    segment: customer.segment,
                    totalOrders: customer.totalOrders,
                    totalSpent: customer.totalSpent,
                    avgOrderValue: customer.avgOrderValue,
                    customerLifetime: Math.round(customer.customerLifetime)
                }))
        }
    }, 'Customer analytics report generated successfully');
});

// Export report to Excel
exports.exportReportToExcel = asyncHandler(async (req, res) => {
    const { reportType, startDate, endDate, ...filters } = req.query;
    
    let reportData;
    let filename;
    
    switch (reportType) {
        case 'sales':
            // Generate sales report data
            const salesReq = { query: { startDate, endDate, ...filters } };
            reportData = await generateSalesReportData(salesReq);
            filename = `Sales-Report-${startDate}-to-${endDate}.xlsx`;
            break;
            
        case 'inventory':
            // Generate inventory report data
            reportData = await generateInventoryReportData(filters);
            filename = `Inventory-Report-${new Date().toISOString().split('T')[0]}.xlsx`;
            break;
            
        case 'profit-loss':
            // Generate P&L report data
            reportData = await generatePLReportData({ startDate, endDate });
            filename = `PL-Report-${startDate}-to-${endDate}.xlsx`;
            break;
            
        default:
            return res.error('Invalid report type', [], 400);
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    
    // Add report data to worksheet based on report type
    await addReportDataToWorksheet(worksheet, reportType, reportData);
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
});

// Helper functions
async function generateSalesReportData(req) {
    // Implementation would call getSalesReport logic
    return {};
}

async function generateInventoryReportData(filters) {
    // Implementation would call getInventoryReport logic
    return {};
}

async function generatePLReportData(dateRange) {
    // Implementation would call getProfitLossReport logic
    return {};
}

async function addReportDataToWorksheet(worksheet, reportType, data) {
    // Implementation would format data based on report type
    worksheet.addRow(['Report generated on', new Date().toLocaleDateString()]);
}

module.exports = exports;
