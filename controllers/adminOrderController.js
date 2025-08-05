const Order = require('../models/Order');
const delhiveryService = require('../services/delhiveryService');
const { asyncHandler } = require('../middlewares/errorHandler');

// @desc    Update delivery method for an order
// @route   PUT /api/orders/admin/:orderId/delivery-method
// @access  Admin
const updateOrderDeliveryMethod = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { deliveryMethod, adminNotes } = req.body;

    // Find the order
    const order = await Order.findById(orderId).populate('user', 'firstName lastName email phone');
    if (!order) {
        return res.error('Order not found', 404);
    }

    // Validate delivery method
    if (!['manual', 'delhivery'].includes(deliveryMethod)) {
        return res.error('Invalid delivery method. Use "manual" or "delhivery"', 400);
    }

    // Check if order can be updated
    if (order.status === 'delivered' || order.status === 'cancelled') {
        return res.error('Cannot update delivery method for completed orders', 400);
    }

    // Update delivery method
    order.shipping.deliveryMethod = deliveryMethod;
    order.shipping.assignedBy = req.user._id;
    order.shipping.assignedAt = new Date();
    order.shipping.adminNotes = adminNotes || '';

    if (deliveryMethod === 'delhivery') {
        order.shipping.carrier = 'Delhivery';
        
        // Try to create Delhivery shipment automatically
        try {
            const shipmentResult = await createDelhiveryShipment(order);
            if (shipmentResult.success) {
                order.shipping.trackingNumber = shipmentResult.data.waybill;
                order.shipping.awbCode = shipmentResult.data.waybill;
                order.shipping.shiprocketOrderId = shipmentResult.data.refnum;
                order.status = 'processing';
                console.log(`✅ Delhivery shipment created for order ${order.orderNumber}`);
            } else {
                console.log(`⚠️ Failed to create Delhivery shipment: ${shipmentResult.error}`);
                // Continue without failing the delivery method update
            }
        } catch (error) {
            console.error('Error creating Delhivery shipment:', error);
            // Continue without failing the delivery method update
        }
    } else if (deliveryMethod === 'manual') {
        order.shipping.carrier = 'Manual Delivery';
        order.shipping.trackingNumber = null;
        order.shipping.awbCode = null;
        order.shipping.shiprocketOrderId = null;
    }

    await order.save();

    // Populate the updated order for response
    await order.populate([
        { path: 'shipping.assignedBy', select: 'firstName lastName' }
    ]);

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
});

// @desc    Get orders with delivery method filter
// @route   GET /api/orders/admin/by-delivery-method
// @access  Admin
const getOrdersByDeliveryMethod = asyncHandler(async (req, res) => {
    const { deliveryMethod, status, page = 1, limit = 20 } = req.query;

    // Debug logging
    console.log('🔍 getOrdersByDeliveryMethod called');
    console.log('Order model type:', typeof Order);
    console.log('Order model:', Order);

    const query = {};

    if (deliveryMethod) {
        query['shipping.deliveryMethod'] = deliveryMethod;
    }

    if (status) {
        query.status = status;
    }

    console.log('Query:', query);

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
});

// @desc    Get orders pending delivery method assignment
// @route   GET /api/orders/admin/pending-delivery-assignment
// @access  Admin
const getOrdersPendingDeliveryAssignment = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const query = {
        status: { $in: ['confirmed', 'processing'] },
        'paymentInfo.status': 'completed',
        $or: [
            { 'shipping.deliveryMethod': { $exists: false } },
            { 'shipping.deliveryMethod': null },
            { 'shipping.deliveryMethod': '' }
        ]
    };

    const orders = await Order.find(query)
        .populate('user', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.success({
        orders,
        pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
        }
    }, 'Orders pending delivery assignment retrieved successfully');
});

// @desc    Bulk update delivery method for multiple orders
// @route   PUT /api/orders/admin/bulk-delivery-method
// @access  Admin
const bulkUpdateDeliveryMethod = asyncHandler(async (req, res) => {
    const { orderIds, deliveryMethod, adminNotes } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.error('Order IDs array is required', 400);
    }

    if (!['manual', 'delhivery'].includes(deliveryMethod)) {
        return res.error('Invalid delivery method. Use "manual" or "delhivery"', 400);
    }

    const updateData = {
        'shipping.deliveryMethod': deliveryMethod,
        'shipping.assignedBy': req.user._id,
        'shipping.assignedAt': new Date(),
        'shipping.adminNotes': adminNotes || '',
        'shipping.carrier': deliveryMethod === 'delhivery' ? 'Delhivery' : 'Manual Delivery'
    };

    const result = await Order.updateMany(
        { 
            _id: { $in: orderIds },
            status: { $nin: ['delivered', 'cancelled'] }
        },
        updateData
    );

    res.success({
        updatedCount: result.modifiedCount,
        deliveryMethod,
        orderIds
    }, `${result.modifiedCount} orders updated with ${deliveryMethod} delivery method`);
});

// Helper function to create Delhivery shipment
const createDelhiveryShipment = async (order) => {
    try {
        const orderData = {
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerName: `${order.user.firstName} ${order.user.lastName}`,
            customerPhone: order.user.phone,
            customerEmail: order.user.email,
            shippingAddress: {
                addressLine1: order.shippingAddress.street,
                addressLine2: order.shippingAddress.area,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                postalCode: order.shippingAddress.postalCode,
                country: order.shippingAddress.country || 'India'
            },
            items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            codAmount: order.paymentInfo.method === 'cod' ? order.pricing.total : 0,
            weight: order.items.reduce((total, item) => total + (item.weight || 0.5), 0)
        };

        return await delhiveryService.createShipment(orderData);
    } catch (error) {
        console.error('Error creating Delhivery shipment:', error);
        return { success: false, error: error.message };
    }
};

// @desc    Get delivery method options for dropdown
// @route   GET /api/orders/admin/delivery-options
// @access  Admin
const getDeliveryMethodOptions = asyncHandler(async (req, res) => {
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

// @desc    Sync Delhivery order status
// @route   POST /api/admin-delivery/orders/:orderId/sync-status
// @access  Admin
const syncDelhiveryStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('user', 'firstName lastName email phone');
    if (!order) {
        return res.error('Order not found', 404);
    }

    if (order.shipping?.deliveryMethod !== 'delhivery' || !order.shipping?.trackingNumber) {
        return res.error('Order is not assigned to Delhivery or has no tracking number', 400);
    }

    try {
        // Get tracking info from Delhivery
        const trackingResult = await delhiveryService.trackShipment(order.shipping.trackingNumber);

        if (trackingResult.success) {
            const trackingData = trackingResult.data;

            // Map Delhivery status to our order status
            let newStatus = order.status;
            const delhiveryStatus = trackingData.status?.toLowerCase();

            if (delhiveryStatus?.includes('delivered')) {
                newStatus = 'delivered';
            } else if (delhiveryStatus?.includes('out for delivery') || delhiveryStatus?.includes('dispatched')) {
                newStatus = 'shipped';
            } else if (delhiveryStatus?.includes('in transit') || delhiveryStatus?.includes('picked')) {
                newStatus = 'processing';
            }

            // Update order status if changed
            if (newStatus !== order.status) {
                order.status = newStatus;
                order.shipping.lastSyncAt = new Date();
                await order.save();
            }

            res.success({
                order: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    shipping: order.shipping,
                    trackingData: trackingData
                }
            }, 'Delhivery status synced successfully');
        } else {
            res.error(trackingResult.error, 400);
        }
    } catch (error) {
        console.error('Error syncing Delhivery status:', error);
        res.error('Failed to sync Delhivery status', 500);
    }
});

// @desc    Auto-sync all Delhivery orders
// @route   POST /api/admin-delivery/sync-all-delhivery
// @access  Admin
const syncAllDelhiveryOrders = asyncHandler(async (req, res) => {
    try {
        const delhiveryOrders = await Order.find({
            'shipping.deliveryMethod': 'delhivery',
            'shipping.trackingNumber': { $exists: true, $ne: null },
            status: { $nin: ['delivered', 'cancelled'] }
        });

        let syncedCount = 0;
        let errorCount = 0;

        for (const order of delhiveryOrders) {
            try {
                const trackingResult = await delhiveryService.trackShipment(order.shipping.trackingNumber);

                if (trackingResult.success) {
                    const trackingData = trackingResult.data;
                    let newStatus = order.status;
                    const delhiveryStatus = trackingData.status?.toLowerCase();

                    if (delhiveryStatus?.includes('delivered')) {
                        newStatus = 'delivered';
                    } else if (delhiveryStatus?.includes('out for delivery') || delhiveryStatus?.includes('dispatched')) {
                        newStatus = 'shipped';
                    } else if (delhiveryStatus?.includes('in transit') || delhiveryStatus?.includes('picked')) {
                        newStatus = 'processing';
                    }

                    if (newStatus !== order.status) {
                        order.status = newStatus;
                        order.shipping.lastSyncAt = new Date();
                        await order.save();
                        syncedCount++;
                    }
                }
            } catch (error) {
                console.error(`Error syncing order ${order.orderNumber}:`, error);
                errorCount++;
            }
        }

        res.success({
            totalOrders: delhiveryOrders.length,
            syncedCount,
            errorCount
        }, `Synced ${syncedCount} Delhivery orders successfully`);
    } catch (error) {
        console.error('Error in bulk sync:', error);
        res.error('Failed to sync Delhivery orders', 500);
    }
});

module.exports = {
    updateOrderDeliveryMethod,
    getOrdersByDeliveryMethod,
    getOrdersPendingDeliveryAssignment,
    bulkUpdateDeliveryMethod,
    getDeliveryMethodOptions,
    syncDelhiveryStatus,
    syncAllDelhiveryOrders
};
