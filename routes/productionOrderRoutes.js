const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, query, param } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const OrderService = require('../services/orderService');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');
const auth = require('../middlewares/authMiddleware');
const adminAuth = require('../middlewares/adminMiddleware');

/**
 * @route   POST /api/orders/validate-cart
 * @desc    Validate cart items and calculate totals before order creation
 * @access  Private
 */
router.post('/validate-cart',
    auth,
    [
        body('items').isArray({ min: 1 }).withMessage('Cart must contain at least one item'),
        body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('items.*.variant').optional().isString().withMessage('Variant must be a string'),
        body('couponCode').optional().isString().withMessage('Coupon code must be a string')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { items, couponCode } = req.body;
        const userId = req.user._id;

        const validation = await OrderService.validateCartAndCalculateTotals(userId, items, couponCode);

        if (!validation.isValid) {
            return res.error('Cart validation failed', validation.errors, 400);
        }

        res.success({
            validation: {
                is_valid: validation.isValid,
                items: validation.items,
                pricing: validation.pricing,
                coupon: validation.coupon
            }
        }, 'Cart validated successfully');
    })
);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/',
    auth,
    [
        body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
        body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('shippingAddress').isObject().withMessage('Shipping address is required'),
        body('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
        body('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
        body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
        body('shippingAddress.city').notEmpty().withMessage('City is required'),
        body('shippingAddress.state').notEmpty().withMessage('State is required'),
        body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
        body('shippingAddress.country').notEmpty().withMessage('Country is required'),
        body('shippingAddress.phone').notEmpty().withMessage('Phone number is required'),
        body('paymentMethod').isIn(['razorpay', 'upi', 'credit_card', 'debit_card', 'net_banking', 'cod']).withMessage('Invalid payment method'),
        body('billingAddress').optional().isObject().withMessage('Billing address must be an object'),
        body('couponCode').optional().isString().withMessage('Coupon code must be a string'),
        body('notes.customer').optional().isString().withMessage('Customer notes must be a string')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { items, shippingAddress, billingAddress, paymentMethod, couponCode, notes } = req.body;
        const userId = req.user._id;

        // Step 1: Validate cart and calculate totals
        const validation = await OrderService.validateCartAndCalculateTotals(userId, items, couponCode);

        if (!validation.isValid) {
            return res.error('Order validation failed', validation.errors, 400);
        }

        // Step 2: Create order
        const orderData = {
            items: validation.items,
            pricing: validation.pricing,
            shippingAddress,
            billingAddress,
            paymentMethod,
            coupon: validation.coupon,
            notes
        };

        const order = await OrderService.createOrder(userId, orderData);

        // Step 3: Process payment (except for COD)
        let paymentResult = { success: true };
        if (paymentMethod !== 'cod') {
            paymentResult = await OrderService.processPayment(order._id, { method: paymentMethod });
        }

        // Populate order for response
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name slug images');

        res.success({
            order: {
                _id: populatedOrder._id,
                order_number: populatedOrder.orderNumber,
                status: populatedOrder.status,
                items: populatedOrder.items.map(item => ({
                    product: {
                        _id: item.product._id,
                        name: item.product.name,
                        slug: item.product.slug,
                        image: item.product.images?.[0] || null
                    },
                    variant: item.variant,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total_price: item.totalPrice
                })),
                pricing: populatedOrder.pricing,
                shipping_address: populatedOrder.shippingAddress,
                payment_info: {
                    method: populatedOrder.paymentInfo.method,
                    status: populatedOrder.paymentInfo.status
                },
                created_at: populatedOrder.createdAt
            },
            payment_success: paymentResult.success
        }, paymentResult.success ? 'Order created successfully' : 'Order created but payment failed');
    })
);

/**
 * @route   GET /api/orders
 * @desc    Get user's orders with filtering and pagination
 * @access  Private
 */
router.get('/',
    auth,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']).withMessage('Invalid status'),
        query('sort').optional().isIn(['created_at', 'updated_at', 'total', 'status']).withMessage('Invalid sort field'),
        query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 10,
            status,
            sort = 'created_at',
            order = 'desc'
        } = req.query;

        const userId = req.user._id;

        // Build filter
        const filter = { user: userId };
        if (status) filter.status = status;

        // Build sort
        const sortObj = {};
        sortObj[sort === 'created_at' ? 'createdAt' : sort] = order === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const orders = await Order.find(filter)
            .populate('items.product', 'name slug images')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        // Format orders
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            order_number: order.orderNumber,
            status: order.status,
            items_count: order.totalItems,
            total_amount: order.pricing.total,
            payment_method: order.paymentInfo.method,
            payment_status: order.paymentInfo.status,
            created_at: order.createdAt,
            updated_at: order.updatedAt,
            items: order.items.map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    slug: item.product.slug,
                    image: item.product.images?.[0] || null
                },
                quantity: item.quantity,
                unit_price: item.unitPrice
            }))
        }));

        res.success({
            orders: formattedOrders,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total,
                total_pages: Math.ceil(total / parseInt(limit)),
                has_next_page: skip + parseInt(limit) < total,
                has_prev_page: parseInt(page) > 1
            },
            filters: {
                status: status || null,
                sort,
                order
            }
        }, 'Orders retrieved successfully');
    })
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order details
 * @access  Private
 */
router.get('/:id',
    auth,
    [
        param('id').isMongoId().withMessage('Invalid order ID')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: id, user: userId })
            .populate('user', 'firstName lastName email phone')
            .populate('items.product', 'name slug description images brand');

        if (!order) {
            return res.error('Order not found', [], 404);
        }

        // Format detailed order
        const formattedOrder = {
            _id: order._id,
            order_number: order.orderNumber,
            status: order.status,
            items: order.items.map(item => ({
                _id: item._id,
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    slug: item.product.slug,
                    description: item.product.description,
                    images: item.product.images,
                    brand: item.product.brand
                },
                variant: item.variant,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                discount: item.discount
            })),
            pricing: order.pricing,
            shipping_address: order.shippingAddress,
            billing_address: order.billingAddress,
            payment_info: {
                method: order.paymentInfo.method,
                status: order.paymentInfo.status,
                transaction_id: order.paymentInfo.transactionId,
                paid_at: order.paymentInfo.paidAt
            },
            shipping: {
                method: order.shipping.method,
                tracking_number: order.shipping.trackingNumber,
                carrier: order.shipping.carrier,
                estimated_delivery: order.shipping.estimatedDelivery,
                actual_delivery: order.shipping.actualDelivery
            },
            status_history: order.statusHistory.map(history => ({
                status: history.status,
                timestamp: history.timestamp,
                note: history.note
            })),
            coupon: order.coupon,
            notes: order.notes,
            order_age_days: order.orderAge,
            created_at: order.createdAt,
            updated_at: order.updatedAt
        };

        res.success({
            order: formattedOrder
        }, 'Order details retrieved successfully');
    })
);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Private
 */
router.put('/:id/cancel',
    auth,
    [
        param('id').isMongoId().withMessage('Invalid order ID'),
        body('reason').optional().isString().withMessage('Cancellation reason must be a string')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason = 'Cancelled by customer' } = req.body;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: id, user: userId });

        if (!order) {
            return res.error('Order not found', [], 404);
        }

        // Check if order can be cancelled
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.error('Order cannot be cancelled at this stage', [], 400);
        }

        // Cancel order
        const updatedOrder = await OrderService.updateOrderStatus(id, 'cancelled', reason, userId);

        res.success({
            order: {
                _id: updatedOrder._id,
                order_number: updatedOrder.orderNumber,
                status: updatedOrder.status,
                cancellation_reason: reason
            }
        }, 'Order cancelled successfully');
    })
);

/**
 * @route   POST /api/orders/:id/return
 * @desc    Request order return
 * @access  Private
 */
router.post('/:id/return',
    auth,
    [
        param('id').isMongoId().withMessage('Invalid order ID'),
        body('reason').notEmpty().withMessage('Return reason is required'),
        body('items').optional().isArray().withMessage('Items must be an array')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { reason, items } = req.body;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: id, user: userId });

        if (!order) {
            return res.error('Order not found', [], 404);
        }

        // Check if order can be returned
        if (order.status !== 'delivered') {
            return res.error('Only delivered orders can be returned', [], 400);
        }

        // Check return window (7 days)
        const deliveryDate = order.shipping.actualDelivery || order.updatedAt;
        const daysSinceDelivery = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));

        if (daysSinceDelivery > 7) {
            return res.error('Return window has expired (7 days from delivery)', [], 400);
        }

        // Update order with return request
        order.returnRequested = true;
        order.returnReason = reason;
        order.returnStatus = 'requested';

        order.statusHistory.push({
            status: 'return_requested',
            timestamp: new Date(),
            note: `Return requested: ${reason}`,
            updatedBy: userId
        });

        await order.save();

        res.success({
            order: {
                _id: order._id,
                order_number: order.orderNumber,
                return_status: order.returnStatus,
                return_reason: order.returnReason
            }
        }, 'Return request submitted successfully');
    })
);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/all',
    auth,
    adminAuth,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']).withMessage('Invalid status'),
        query('payment_status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid payment status'),
        query('date_from').optional().isISO8601().withMessage('Invalid date format'),
        query('date_to').optional().isISO8601().withMessage('Invalid date format'),
        query('search').optional().isString().withMessage('Search must be a string'),
        query('sort').optional().isIn(['created_at', 'updated_at', 'total', 'status']).withMessage('Invalid sort field'),
        query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 20,
            status,
            payment_status,
            date_from,
            date_to,
            search,
            sort = 'created_at',
            order = 'desc'
        } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (payment_status) filter['paymentInfo.status'] = payment_status;

        if (date_from || date_to) {
            filter.createdAt = {};
            if (date_from) filter.createdAt.$gte = new Date(date_from);
            if (date_to) filter.createdAt.$lte = new Date(date_to);
        }

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'paymentInfo.transactionId': { $regex: search, $options: 'i' } }
            ];
        }

        // Build sort
        const sortObj = {};
        sortObj[sort === 'created_at' ? 'createdAt' : sort] = order === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name slug')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        // Format orders for admin
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            order_number: order.orderNumber,
            customer: order.user ? {
                _id: order.user._id,
                name: `${order.user.firstName} ${order.user.lastName}`,
                email: order.user.email
            } : null,
            status: order.status,
            payment_status: order.paymentInfo.status,
            payment_method: order.paymentInfo.method,
            total_amount: order.pricing.total,
            items_count: order.totalItems,
            created_at: order.createdAt,
            updated_at: order.updatedAt,
            priority: order.priority,
            return_requested: order.returnRequested
        }));

        // Get summary statistics
        const stats = await Order.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total_orders: { $sum: 1 },
                    total_revenue: { $sum: '$pricing.total' },
                    average_order_value: { $avg: '$pricing.total' }
                }
            }
        ]);

        res.success({
            orders: formattedOrders,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total,
                total_pages: Math.ceil(total / parseInt(limit)),
                has_next_page: skip + parseInt(limit) < total,
                has_prev_page: parseInt(page) > 1
            },
            filters: {
                status: status || null,
                payment_status: payment_status || null,
                date_range: { from: date_from, to: date_to },
                search: search || null,
                sort,
                order
            },
            statistics: stats[0] || {
                total_orders: 0,
                total_revenue: 0,
                average_order_value: 0
            }
        }, 'Orders retrieved successfully');
    })
);

/**
 * @route   PUT /api/orders/admin/:id/status
 * @desc    Update order status (Admin only)
 * @access  Private (Admin)
 */
router.put('/admin/:id/status',
    auth,
    adminAuth,
    [
        param('id').isMongoId().withMessage('Invalid order ID'),
        body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned']).withMessage('Invalid status'),
        body('note').optional().isString().withMessage('Note must be a string'),
        body('tracking_number').optional().isString().withMessage('Tracking number must be a string'),
        body('carrier').optional().isString().withMessage('Carrier must be a string')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status, note, tracking_number, carrier } = req.body;
        const adminId = req.user._id;

        const order = await Order.findById(id);
        if (!order) {
            return res.error('Order not found', [], 404);
        }

        // Update order status
        const updatedOrder = await OrderService.updateOrderStatus(id, status, note, adminId);

        // Update shipping info if provided
        if (status === 'shipped' && (tracking_number || carrier)) {
            if (tracking_number) updatedOrder.shipping.trackingNumber = tracking_number;
            if (carrier) updatedOrder.shipping.carrier = carrier;
            await updatedOrder.save();
        }

        res.success({
            order: {
                _id: updatedOrder._id,
                order_number: updatedOrder.orderNumber,
                status: updatedOrder.status,
                shipping: updatedOrder.shipping
            }
        }, 'Order status updated successfully');
    })
);

/**
 * @route   GET /api/orders/admin/analytics
 * @desc    Get order analytics (Admin only)
 * @access  Private (Admin)
 */
router.get('/admin/analytics',
    auth,
    adminAuth,
    [
        query('period').optional().isIn(['today', 'week', 'month', 'year', 'custom']).withMessage('Invalid period'),
        query('date_from').optional().isISO8601().withMessage('Invalid date format'),
        query('date_to').optional().isISO8601().withMessage('Invalid date format')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { period = 'month', date_from, date_to } = req.query;

        let startDate, endDate;
        const now = new Date();

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear() + 1, 0, 1);
                break;
            case 'custom':
                if (!date_from || !date_to) {
                    return res.error('Custom period requires date_from and date_to', [], 400);
                }
                startDate = new Date(date_from);
                endDate = new Date(date_to);
                break;
        }

        const analytics = await OrderService.getOrderAnalytics(startDate, endDate);

        // Get status distribution
        const statusDistribution = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get payment method distribution
        const paymentMethodDistribution = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: '$paymentInfo.method',
                    count: { $sum: 1 },
                    revenue: { $sum: '$pricing.total' }
                }
            }
        ]);

        res.success({
            analytics: {
                ...analytics,
                period: {
                    type: period,
                    start_date: startDate,
                    end_date: endDate
                },
                status_distribution: statusDistribution,
                payment_method_distribution: paymentMethodDistribution
            }
        }, 'Order analytics retrieved successfully');
    })
);

module.exports = router;
