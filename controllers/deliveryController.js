const mongoose = require('mongoose');
const { asyncHandler } = require('../middlewares/errorHandler');

// @desc    Get orders with delivery method filter
// @route   GET /api/admin-delivery/orders
// @access  Admin
const getOrdersByDeliveryMethod = asyncHandler(async (req, res) => {
    const { deliveryMethod, status, page = 1, limit = 20 } = req.query;

    console.log('🔍 getOrdersByDeliveryMethod called with params:', { deliveryMethod, status, page, limit });

    // Import Order model directly to avoid circular dependency issues
    const Order = require('../models/Order');
    console.log('Order model type:', typeof Order);
    console.log('Order.find type:', typeof Order.find);

    const query = {};
    
    if (deliveryMethod) {
        query['shipping.deliveryMethod'] = deliveryMethod;
    }
    
    if (status) {
        query.status = status;
    }

    console.log('MongoDB query:', JSON.stringify(query));

    try {
        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email phone')
            .populate('shipping.assignedBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        // Get delivery method statistics
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: '$shipping.deliveryMethod',
                    count: { $sum: 1 },
                    totalValue: { $sum: '$pricing.total' }
                }
            }
        ]);

        console.log(`✅ Found ${orders.length} orders, ${stats.length} stats`);

        res.success({
            orders,
            stats,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        }, 'Orders retrieved successfully');
    } catch (error) {
        console.error('❌ Error in getOrdersByDeliveryMethod:', error);
        res.error('Failed to retrieve orders', 500);
    }
});

// @desc    Get orders pending delivery method assignment
// @route   GET /api/admin-delivery/orders/pending
// @access  Admin
const getPendingDeliveryAssignments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    console.log('🔍 getPendingDeliveryAssignments called with params:', { page, limit });

    // Import Order model directly to avoid circular dependency issues
    const Order = require('../models/Order');
    console.log('Order model type:', typeof Order);

    const query = {
        status: { $in: ['confirmed', 'processing'] },
        'paymentInfo.status': 'completed',
        $or: [
            { 'shipping.deliveryMethod': { $exists: false } },
            { 'shipping.deliveryMethod': null },
            { 'shipping.deliveryMethod': '' }
        ]
    };

    console.log('MongoDB query:', JSON.stringify(query));

    try {
        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        console.log(`✅ Found ${orders.length} pending orders`);

        res.success({
            orders,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total,
                limit: parseInt(limit)
            }
        }, 'Orders pending delivery assignment retrieved successfully');
    } catch (error) {
        console.error('❌ Error in getPendingDeliveryAssignments:', error);
        res.error('Failed to retrieve pending orders', 500);
    }
});

// @desc    Update delivery method for an order
// @route   PUT /api/admin-delivery/orders/:orderId/method
// @access  Admin
const updateOrderDeliveryMethod = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { deliveryMethod, adminNotes } = req.body;

    console.log('🔍 updateOrderDeliveryMethod called for order:', orderId);
    console.log('Delivery method:', deliveryMethod);

    // Import Order model directly to avoid circular dependency issues
    const Order = require('../models/Order');
    console.log('Order model type:', typeof Order);

    // Validate delivery method
    if (!['manual', 'delhivery'].includes(deliveryMethod)) {
        return res.error('Invalid delivery method. Use "manual" or "delhivery"', 400);
    }

    try {
        // Find the order
        const order = await Order.findById(orderId).populate('user', 'firstName lastName email phone');
        if (!order) {
            return res.error('Order not found', 404);
        }

        // Check if order can be updated
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return res.error('Cannot update delivery method for completed orders', 400);
        }

        // Initialize shipping object if it doesn't exist
        if (!order.shipping) {
            order.shipping = {};
        }

        // Update delivery method
        order.shipping.deliveryMethod = deliveryMethod;
        order.shipping.assignedBy = req.user?._id || null;
        order.shipping.assignedAt = new Date();
        order.shipping.adminNotes = adminNotes || '';

        console.log('✅ Delivery method fields updated:', {
            deliveryMethod: order.shipping.deliveryMethod,
            assignedBy: order.shipping.assignedBy,
            assignedAt: order.shipping.assignedAt
        });

        if (deliveryMethod === 'delhivery') {
            order.shipping.carrier = 'Delhivery';
            // For now, just set a dummy tracking number
            order.shipping.trackingNumber = `DHL${Date.now()}`;
            order.status = 'processing';
            console.log(`✅ Delhivery delivery method set for order ${order.orderNumber}`);
        } else if (deliveryMethod === 'manual') {
            order.shipping.carrier = 'Manual Delivery';
            order.shipping.trackingNumber = null;
            order.shipping.awbCode = null;
            order.shipping.shiprocketOrderId = null;
        }

        await order.save();

        console.log(`✅ Delivery method updated to ${deliveryMethod} for order ${order.orderNumber}`);

        res.success({
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                shipping: order.shipping,
                user: order.user,
                updatedAt: order.updatedAt
            }
        }, `Delivery method updated to ${deliveryMethod} successfully`);
    } catch (error) {
        console.error('❌ Error in updateOrderDeliveryMethod:', error);
        console.error('Error stack:', error.stack);
        console.error('Error details:', {
            orderId,
            deliveryMethod,
            adminNotes,
            userExists: !!req.user,
            userId: req.user?._id
        });
        res.error('Failed to update delivery method', 500);
    }
});

// @desc    Get delivery method options for admin dropdown
// @route   GET /api/admin-delivery/options
// @access  Admin
const getDeliveryOptions = asyncHandler(async (req, res) => {
    const options = [
        {
            value: 'manual',
            label: 'Manual Delivery',
            description: 'Handle delivery manually by your team',
            icon: '🚚'
        },
        {
            value: 'delhivery',
            label: 'Delhivery',
            description: 'Professional courier service with tracking',
            icon: '📦'
        }
    ];

    res.success({
        options,
        default: 'manual'
    }, 'Delivery method options retrieved successfully');
});

// @desc    Sync all Delhivery orders with real tracking updates
// @route   POST /api/admin-delivery/sync-all-delhivery
// @access  Admin
const syncAllDelhiveryOrders = asyncHandler(async (req, res) => {
    console.log('🔍 syncAllDelhiveryOrders called - Real Delhivery sync');

    // Import Order model directly to avoid circular dependency issues
    const Order = require('../models/Order');
    const delhiveryService = require('../services/delhiveryService');

    try {
        // Find all orders with Delhivery delivery method and real tracking numbers
        const delhiveryOrders = await Order.find({
            'shipping.deliveryMethod': 'delhivery',
            'shipping.trackingNumber': {
                $exists: true,
                $ne: null,
                $not: /^MOCK_/ // Exclude mock tracking numbers
            },
            status: { $nin: ['delivered', 'cancelled'] }
        }).populate('user', 'firstName lastName email phone');

        console.log(`✅ Found ${delhiveryOrders.length} real Delhivery orders to sync`);

        let syncedCount = 0;
        let errorCount = 0;
        let errors = [];

        // Sync each order
        for (const order of delhiveryOrders) {
            try {
                console.log(`🔄 Syncing order ${order.orderNumber} with tracking ${order.shipping.trackingNumber}`);

                // Get tracking info from Delhivery
                const trackingResult = await delhiveryService.trackShipment(order.shipping.trackingNumber);

                if (trackingResult.success) {
                    const trackingData = trackingResult.data;

                    // Update order with latest tracking info
                    order.shipping.delhiveryStatus = trackingData.status;
                    order.shipping.currentLocation = trackingData.currentLocation;
                    order.shipping.estimatedDelivery = trackingData.estimatedDelivery;
                    order.shipping.lastTracked = new Date();

                    // Update order status based on Delhivery status
                    if (trackingData.status.toLowerCase().includes('delivered')) {
                        order.status = 'delivered';
                        order.deliveredAt = new Date();
                    } else if (trackingData.status.toLowerCase().includes('out for delivery')) {
                        order.status = 'shipped';
                    } else if (trackingData.status.toLowerCase().includes('in transit')) {
                        order.status = 'shipped';
                    }

                    await order.save();
                    syncedCount++;

                    console.log(`✅ Synced ${order.orderNumber}: ${trackingData.status}`);
                } else {
                    console.log(`⚠️ Failed to sync ${order.orderNumber}: ${trackingResult.error}`);
                    errorCount++;
                    errors.push({
                        orderNumber: order.orderNumber,
                        error: trackingResult.error
                    });
                }
            } catch (error) {
                console.error(`❌ Error syncing order ${order.orderNumber}:`, error);
                errorCount++;
                errors.push({
                    orderNumber: order.orderNumber,
                    error: error.message
                });
            }
        }

        console.log(`🎯 Sync complete: ${syncedCount}/${delhiveryOrders.length} orders synced`);

        res.success({
            totalOrders: delhiveryOrders.length,
            syncedCount: syncedCount,
            errorCount: errorCount,
            errors: errors.slice(0, 5), // Show first 5 errors only
            message: `Successfully synced ${syncedCount} out of ${delhiveryOrders.length} Delhivery orders`
        }, `Successfully synced ${syncedCount} out of ${delhiveryOrders.length} Delhivery orders`);
    } catch (error) {
        console.error('❌ Error in syncAllDelhiveryOrders:', error);
        res.error('Failed to sync Delhivery orders', 500);
    }
});

// @desc    Sync individual Delhivery order tracking
// @route   POST /api/admin-delivery/orders/:orderId/sync
// @access  Admin
const syncDelhiveryOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    console.log(`🔍 syncDelhiveryOrder called for order: ${orderId}`);

    // Import Order model directly to avoid circular dependency issues
    const Order = require('../models/Order');
    const delhiveryService = require('../services/delhiveryService');

    try {
        // Find the order
        const order = await Order.findById(orderId).populate('user', 'firstName lastName email phone');
        if (!order) {
            return res.error('Order not found', 404);
        }

        // Check if it's a Delhivery order with tracking number
        if (order.shipping?.deliveryMethod !== 'delhivery') {
            return res.error('Order is not using Delhivery delivery', 400);
        }

        if (!order.shipping.trackingNumber || order.shipping.trackingNumber.startsWith('MOCK_')) {
            return res.error('Order does not have a valid Delhivery tracking number', 400);
        }

        console.log(`🔄 Syncing order ${order.orderNumber} with tracking ${order.shipping.trackingNumber}`);

        // Get tracking info from Delhivery
        const trackingResult = await delhiveryService.trackShipment(order.shipping.trackingNumber);

        if (trackingResult.success) {
            const trackingData = trackingResult.data;

            // Update order with latest tracking info
            order.shipping.delhiveryStatus = trackingData.status;
            order.shipping.currentLocation = trackingData.currentLocation;
            order.shipping.estimatedDelivery = trackingData.estimatedDelivery;
            order.shipping.lastTracked = new Date();

            // Update order status based on Delhivery status
            const oldStatus = order.status;
            if (trackingData.status.toLowerCase().includes('delivered')) {
                order.status = 'delivered';
                order.deliveredAt = new Date();
            } else if (trackingData.status.toLowerCase().includes('out for delivery')) {
                order.status = 'shipped';
            } else if (trackingData.status.toLowerCase().includes('in transit')) {
                order.status = 'shipped';
            }

            await order.save();

            console.log(`✅ Synced ${order.orderNumber}: ${trackingData.status}`);

            res.success({
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    oldStatus: oldStatus,
                    shipping: order.shipping,
                    updatedAt: order.updatedAt
                },
                trackingData: trackingData
            }, `Order ${order.orderNumber} synced successfully with Delhivery`);
        } else {
            console.log(`⚠️ Failed to sync ${order.orderNumber}: ${trackingResult.error}`);
            res.error(`Failed to sync with Delhivery: ${trackingResult.error}`, 400);
        }
    } catch (error) {
        console.error(`❌ Error syncing order ${orderId}:`, error);
        res.error('Failed to sync order with Delhivery', 500);
    }
});

module.exports = {
    getDeliveryOptions,
    updateOrderDeliveryMethod,
    getOrdersByDeliveryMethod,
    getPendingDeliveryAssignments,
    syncAllDelhiveryOrders,
    syncDelhiveryOrder
};
