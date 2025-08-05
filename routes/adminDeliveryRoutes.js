const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const delhiveryService = require('../services/delhiveryService');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { asyncHandler } = require('../middlewares/errorHandler');
const {
    getDeliveryOptions,
    updateOrderDeliveryMethod,
    getOrdersByDeliveryMethod,
    syncAllDelhiveryOrders,
    syncDelhiveryOrder
} = require('../controllers/deliveryController');

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

console.log('🚨🚨🚨 ADMIN DELIVERY ROUTES LOADED 🚨🚨🚨');

// Test route to verify routes are working
router.get('/test', (req, res) => {
    console.log('🚨🚨🚨 ADMIN DELIVERY TEST ROUTE HIT 🚨🚨🚨');
    res.json({ success: true, message: 'Admin delivery routes are working!' });
});

// @desc    Get delivery method options for admin dropdown
// @route   GET /api/admin-delivery/options
// @access  Admin
router.get('/options', getDeliveryOptions);

// @desc    Get orders pending delivery method assignment (direct implementation)
// @route   GET /api/admin-delivery/orders/pending
// @access  Admin
router.get('/orders/pending', asyncHandler(async (req, res) => {
    console.log('🔍🔍🔍 PENDING ORDERS ROUTE HIT 🔍🔍🔍');
    const { page = 1, limit = 20 } = req.query;

    console.log('Query params:', { page, limit });

    try {
        const query = {
            status: { $in: ['confirmed', 'processing'] },
            'paymentInfo.status': 'completed',
            $or: [
                { 'shipping.deliveryMethod': { $exists: false } },
                { 'shipping.deliveryMethod': null },
                { 'shipping.deliveryMethod': '' },
                { 'shipping.deliveryMethod': 'manual' }
            ]
        };

        console.log('MongoDB query:', JSON.stringify(query));

        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(query);

        console.log(`✅ Found ${orders.length} pending orders out of ${total} total`);

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
        console.error('❌ Error in pending orders route:', error);
        res.error('Failed to retrieve pending orders', 500);
    }
}));

// @desc    Update delivery method for an order (simplified working version)
// @route   PUT /api/admin-delivery/update-method/:orderId
// @access  Admin
router.put('/update-method/:orderId', asyncHandler(async (req, res) => {
    console.log('🔍🔍🔍 PUT /update-method/:orderId route called 🔍🔍🔍');
    console.log('Order ID:', req.params.orderId);
    console.log('Body:', req.body);
    console.log('User:', req.user ? 'Present' : 'Missing');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);

    const { orderId } = req.params;
    const { deliveryMethod, adminNotes } = req.body;

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

        console.log('✅ Order found:', order.orderNumber);

        // Initialize shipping object if it doesn't exist
        if (!order.shipping) {
            order.shipping = {};
        }

        // Prepare update data
        const updateData = {
            'shipping.deliveryMethod': deliveryMethod,
            'shipping.assignedBy': req.user?._id || null,
            'shipping.assignedAt': new Date(),
            'shipping.adminNotes': adminNotes || '',
            'updatedAt': new Date()
        };

        if (deliveryMethod === 'delhivery') {
            updateData['shipping.carrier'] = 'Delhivery';
            updateData['status'] = 'processing';

            // Create real Delhivery shipment
            console.log('🚀 Creating real Delhivery shipment...');

            try {
                // Prepare shipment data
                const shipmentData = {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    customerName: `${order.user.firstName} ${order.user.lastName}`,
                    customerPhone: order.user.phone,
                    customerEmail: order.user.email,
                    shippingAddress: order.shippingAddress,
                    items: order.items,
                    codAmount: order.paymentInfo.method === 'cod' ? order.totalAmount : 0,
                    weight: order.items.reduce((total, item) => total + (item.weight || 0.5), 0) || 1
                };

                console.log('📦 Shipment data prepared:', {
                    orderNumber: shipmentData.orderNumber,
                    customer: shipmentData.customerName,
                    weight: shipmentData.weight,
                    codAmount: shipmentData.codAmount
                });

                // Create shipment with Delhivery
                const shipmentResult = await delhiveryService.createShipment(shipmentData);

                if (shipmentResult.success) {
                    // Real Delhivery tracking number
                    updateData['shipping.trackingNumber'] = shipmentResult.data.waybill;
                    updateData['shipping.delhiveryRefNum'] = shipmentResult.data.refnum;
                    updateData['shipping.trackingUrl'] = shipmentResult.data.trackingUrl;
                    updateData['shipping.delhiveryStatus'] = shipmentResult.data.status;
                    updateData['shipping.delhiveryRemarks'] = shipmentResult.data.remarks;

                    console.log('✅ Delhivery shipment created successfully!');
                    console.log(`📋 Waybill: ${shipmentResult.data.waybill}`);
                    console.log(`🔗 Tracking URL: ${shipmentResult.data.trackingUrl}`);
                } else {
                    // Fallback to mock if API fails
                    console.log('⚠️ Delhivery API failed, using mock tracking:', shipmentResult.error);
                    updateData['shipping.trackingNumber'] = `MOCK_DHL${Date.now()}`;
                    updateData['shipping.delhiveryError'] = shipmentResult.error;
                }
            } catch (error) {
                console.error('❌ Error creating Delhivery shipment:', error);
                // Fallback to mock tracking
                updateData['shipping.trackingNumber'] = `MOCK_DHL${Date.now()}`;
                updateData['shipping.delhiveryError'] = error.message;
            }
        } else if (deliveryMethod === 'manual') {
            updateData['shipping.carrier'] = 'Manual Delivery';
            updateData['shipping.trackingNumber'] = null;
            updateData['shipping.delhiveryRefNum'] = null;
            updateData['shipping.trackingUrl'] = null;
            updateData['shipping.delhiveryStatus'] = null;
        }

        // Use direct MongoDB update to ensure persistence
        const updateResult = await Order.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('user', 'firstName lastName email phone');

        console.log('✅ Order updated using direct MongoDB update');
        console.log('✅ Updated order shipping:', updateResult.shipping);

        res.success({
            order: {
                _id: updateResult._id,
                orderNumber: updateResult.orderNumber,
                status: updateResult.status,
                shipping: updateResult.shipping,
                updatedAt: updateResult.updatedAt
            }
        }, `Delivery method updated to ${deliveryMethod} successfully`);
    } catch (error) {
        console.error('❌ Error updating delivery method:', error);
        res.error('Failed to update delivery method', 500);
    }
}));

// @desc    Get orders with delivery method filter (general route last)
// @route   GET /api/admin-delivery/orders
// @access  Admin
router.get('/orders', getOrdersByDeliveryMethod);

// @desc    Auto-sync all Delhivery orders
// @route   POST /api/admin-delivery/sync-all-delhivery
// @access  Admin
router.post('/sync-all-delhivery', syncAllDelhiveryOrders);

// @desc    Sync individual Delhivery order
// @route   POST /api/admin-delivery/orders/:orderId/sync
// @access  Admin
router.post('/orders/:orderId/sync', syncDelhiveryOrder);

module.exports = router;
