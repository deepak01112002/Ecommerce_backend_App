const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Inventory = require('../models/Inventory');
const Return = require('../models/Return');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const SystemSettings = require('../models/SystemSettings');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get complete admin dashboard
exports.getAdminDashboard = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    const endDate = new Date();

    // Basic counts
    const totalOrders = await Order.countDocuments() || 0;
    const totalUsers = await User.countDocuments({ role: 'user' }) || 0;
    const totalProducts = await Product.countDocuments() || 0;

    // Get recent orders for sales calculation
    const periodOrders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
    }).select('pricing status createdAt items');

    // Calculate sales overview
    const completedOrders = periodOrders.filter(order =>
        ['processing', 'shipped', 'delivered', 'completed'].includes(order.status)
    );

    const totalRevenue = completedOrders.reduce((sum, order) =>
        sum + (order.pricing?.total || 0), 0
    );

    const avgOrderValue = completedOrders.length > 0 ?
        Math.round(totalRevenue / completedOrders.length) : 0;

    const totalItems = completedOrders.reduce((sum, order) =>
        sum + (order.items?.length || 0), 0
    );

    const salesOverview = {
        totalOrders: completedOrders.length,
        totalRevenue,
        avgOrderValue,
        totalItems
    };

    // Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayOrdersCount = await Order.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    const todayStats = {
        todayOrders: todayOrdersCount,
        todayRevenue: 0
    };

    // Customer Stats
    const newCustomers = await User.countDocuments({
        role: 'user',
        createdAt: { $gte: startDate }
    });

    const customerStats = {
        totalCustomers: totalUsers,
        newCustomersThisMonth: newCustomers,
        activeCustomers: totalUsers
    };

    // Product Stats
    const activeProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ stock: { $lte: 0 } });
    const lowStockProducts = await Product.countDocuments({
        stock: { $gt: 0, $lte: 10 }
    });

    const productStats = {
        totalProducts,
        activeProducts,
        outOfStockProducts,
        lowStockProducts
    };

    // Recent Orders
    const latestOrders = await Order.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber user pricing status createdAt');

    // Order Status Distribution
    const orderStatusDistribution = await Order.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Format recent orders
    const formattedRecentOrders = latestOrders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        user: order.user ? {
            name: `${order.user.firstName} ${order.user.lastName}`,
            email: order.user.email
        } : null,
        total: order.pricing?.total || 0,
        status: order.status,
        createdAt: order.createdAt
    }));

    // Response
    res.success({
        dashboard: {
            salesOverview,
            todayStats,
            customerStats,
            productStats,
            orderStatusDistribution,
            recentOrders: formattedRecentOrders,
            topProducts: [],
            inventoryAlerts: [],
            supportSummary: { totalTickets: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 },
            returnsSummary: { totalReturns: 0, pendingReturns: 0, completedReturns: 0, totalRefundAmount: 0 },
            revenueTrend: [],
            systemNotifications: [],
            purchaseOrdersSummary: { totalPOs: 0, pendingPOs: 0, completedPOs: 0, totalAmount: 0 },
            suppliersSummary: { totalSuppliers: 0, activeSuppliers: 0, approvedSuppliers: 0 },
            period: parseInt(period)
        }
    }, 'Admin dashboard data retrieved successfully');
});

// Get quick stats for admin header
exports.getQuickStats = asyncHandler(async (req, res) => {
    const [
        pendingOrders,
        lowStockItems,
        totalUsers,
        totalProducts
    ] = await Promise.all([
        Order.countDocuments({ status: 'pending' }),
        Product.countDocuments({ stock: { $lte: 10 } }),
        User.countDocuments({ role: 'user' }),
        Product.countDocuments()
    ]);

    res.success({
        quickStats: {
            pendingOrders,
            lowStockItems,
            totalUsers,
            totalProducts,
            unreadNotifications: 0,
            openTickets: 0,
            pendingReturns: 0
        }
    }, 'Quick stats retrieved successfully');
});

module.exports = exports;
