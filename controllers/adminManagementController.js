const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Coupon = require('../models/Coupon');
const SystemSettings = require('../models/SystemSettings');
const { asyncHandler } = require('../middlewares/errorHandler');
const bcrypt = require('bcryptjs');

// User Management
exports.getAllUsers = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        role,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    if (search) {
        query.$or = [
            { firstName: new RegExp(search, 'i') },
            { lastName: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
            { phone: new RegExp(search, 'i') }
        ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(query)
        .select('-password -resetPasswordToken -emailVerificationToken')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    // Format users data
    const formattedUsers = users.map(user => ({
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name || `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin
    }));

    res.success({
        users: formattedUsers,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Users retrieved successfully');
});

exports.getUserDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const user = await User.findById(id)
        .select('-password -resetPasswordToken -emailVerificationToken')
        .populate('wallet')
        .populate('addresses');
    
    if (!user) {
        return res.error('User not found', [], 404);
    }
    
    // Get user's order statistics
    const orderStats = await Order.aggregate([
        { $match: { user: user._id } },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$pricing.total' },
                avgOrderValue: { $avg: '$pricing.total' },
                completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
            }
        }
    ]);
    
    // Get recent orders
    const recentOrders = await Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber status pricing.total orderDate');
    
    res.success({
        user,
        orderStats: orderStats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0, completedOrders: 0 },
        recentOrders
    }, 'User details retrieved successfully');
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive, role } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
        return res.error('User not found', [], 404);
    }
    
    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;
    
    await user.save();
    
    res.success({
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }
    }, 'User status updated successfully');
});

exports.createAdminUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, role = 'admin' } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.error('User with this email already exists', [], 400);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        role,
        isEmailVerified: true,
        isActive: true
    });
    
    await user.save();
    
    res.success({
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        }
    }, 'Admin user created successfully', 201);
});

// Order Management
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, trackingNumber, notes } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
        return res.error('Order not found', [], 404);
    }
    
    const oldStatus = order.status;
    order.status = status;
    
    if (trackingNumber) {
        order.trackingNumber = trackingNumber;
    }
    
    // Add status update to timeline
    order.statusHistory.push({
        status,
        timestamp: new Date(),
        notes: notes || `Order status updated from ${oldStatus} to ${status}`,
        updatedBy: req.user._id
    });
    
    // Update specific status dates
    switch (status) {
        case 'confirmed':
            order.confirmedAt = new Date();
            break;
        case 'shipped':
            order.shippedAt = new Date();
            break;
        case 'delivered':
            order.deliveredAt = new Date();
            break;
        case 'cancelled':
            order.cancelledAt = new Date();
            break;
    }
    
    await order.save();
    
    res.success({
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            trackingNumber: order.trackingNumber,
            statusHistory: order.statusHistory
        }
    }, 'Order status updated successfully');
});

// Product Management
exports.toggleProductStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
        return res.error('Product not found', [], 404);
    }
    
    product.isActive = !product.isActive;
    await product.save();
    
    res.success({
        product: {
            _id: product._id,
            name: product.name,
            isActive: product.isActive
        }
    }, `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`);
});

exports.updateProductStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock, operation = 'set' } = req.body; // set, add, subtract
    
    const product = await Product.findById(id);
    if (!product) {
        return res.error('Product not found', [], 404);
    }
    
    switch (operation) {
        case 'add':
            product.stock += parseInt(stock);
            break;
        case 'subtract':
            product.stock = Math.max(0, product.stock - parseInt(stock));
            break;
        default:
            product.stock = parseInt(stock);
    }
    
    await product.save();
    
    res.success({
        product: {
            _id: product._id,
            name: product.name,
            stock: product.stock
        }
    }, 'Product stock updated successfully');
});

// Category Management
exports.toggleCategoryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
        return res.error('Category not found', [], 404);
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    res.success({
        category: {
            _id: category._id,
            name: category.name,
            isActive: category.isActive
        }
    }, `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`);
});

// Coupon Management
exports.toggleCouponStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const coupon = await Coupon.findById(id);
    if (!coupon) {
        return res.error('Coupon not found', [], 404);
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    res.success({
        coupon: {
            _id: coupon._id,
            code: coupon.code,
            isActive: coupon.isActive
        }
    }, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`);
});

// System Management
exports.getSystemOverview = asyncHandler(async (req, res) => {
    const settings = await SystemSettings.getCurrentSettings();
    
    // Get system health metrics
    const systemHealth = {
        database: 'connected',
        server: 'running',
        storage: 'available',
        lastBackup: settings.backup.enableAutoBackup ? new Date() : null,
        maintenanceMode: settings.general.maintenanceMode
    };
    
    // Get recent activity
    const recentActivity = await Order.find()
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber user status createdAt');
    
    res.success({
        systemOverview: {
            settings: settings.getFormattedSettings(),
            systemHealth,
            recentActivity,
            serverInfo: {
                nodeVersion: process.version,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                platform: process.platform
            }
        }
    }, 'System overview retrieved successfully');
});

exports.toggleMaintenanceMode = asyncHandler(async (req, res) => {
    const { enabled, message } = req.body;
    
    const settings = await SystemSettings.getCurrentSettings();
    settings.general.maintenanceMode = enabled;
    if (message) {
        settings.general.maintenanceMessage = message;
    }
    settings.updatedBy = req.user._id;
    
    await settings.save();
    
    res.success({
        maintenanceMode: {
            enabled: settings.general.maintenanceMode,
            message: settings.general.maintenanceMessage
        }
    }, `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`);
});

module.exports = exports;
