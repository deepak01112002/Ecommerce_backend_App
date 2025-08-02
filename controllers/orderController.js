const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Address = require('../models/Address');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');
const firebaseService = require('../services/firebaseService');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order from cart
exports.createOrder = asyncHandler(async (req, res) => {
    const {
        addressId,
        address,
        paymentInfo,
        couponCode,
        useWallet = false,
        walletAmount = 0
    } = req.body;
    const userId = req.user._id;

    // Get cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
        return res.error('Cart is empty', [], 400);
    }

    // Handle address - either use existing address or create new one
    let orderAddress;
    if (addressId) {
        // Use existing address
        const existingAddress = await Address.findOne({
            _id: addressId,
            user: userId,
            isActive: true
        });

        if (!existingAddress) {
            return res.error('Address not found', [], 404);
        }

        orderAddress = existingAddress.toOrderFormat();
    } else if (address) {
        // Use provided address (create snapshot)
        orderAddress = {
            firstName: address.firstName,
            lastName: address.lastName,
            fullName: `${address.firstName} ${address.lastName}`,
            phone: address.phone,
            alternatePhone: address.alternatePhone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            country: address.country || 'India',
            postalCode: address.postalCode,
            completeAddress: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}${address.landmark ? ', ' + address.landmark : ''}, ${address.city}, ${address.state} - ${address.postalCode}, ${address.country || 'India'}`,
            deliveryInstructions: address.deliveryInstructions,
            coordinates: address.coordinates
        };
    } else {
        // Use default address
        const defaultAddress = await Address.getDefaultAddress(userId);
        if (!defaultAddress) {
            return res.error('No address provided and no default address found', [], 400);
        }
        orderAddress = defaultAddress.toOrderFormat();
    }

    // Calculate total and validate stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
        const product = item.product;

        // Check if product is still active and in stock
        if (!product.isActive) {
            return res.error(`Product ${product.name} is no longer available`, [], 400);
        }

        if (product.stock < item.quantity) {
            return res.error(`Insufficient stock for ${product.name}. Available: ${product.stock}`, [], 400);
        }

        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
            product: product._id,
            productSnapshot: {
                name: product.name,
                description: product.description,
                images: product.images,
                category: product.category
            },
            variant: item.variant || 'Standard',
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
            discount: 0
        });
    }

    // Calculate pricing
    const shipping = subtotal >= 1999 ? 0 : 99;
    const tax = Math.round((subtotal * 0.18) * 100) / 100;
    const total = subtotal + shipping + tax;

    // Handle wallet payment
    let walletTransaction = null;
    let finalTotal = total;
    let actualWalletAmount = 0;

    if (useWallet && walletAmount > 0) {
        const wallet = await Wallet.getOrCreateWallet(userId);

        if (!wallet.hasSufficientBalance(walletAmount)) {
            return res.error('Insufficient wallet balance', [], 400);
        }

        actualWalletAmount = Math.min(walletAmount, total);
        finalTotal = total - actualWalletAmount;
    }

    const pricing = {
        subtotal,
        tax,
        taxRate: 0.18,
        shipping,
        discount: 0,
        walletAmountUsed: actualWalletAmount,
        total: finalTotal,
        originalTotal: total
    };

    // Create order
    const order = new Order({
        user: userId,
        items: orderItems,
        pricing,
        shippingAddress: orderAddress,
        billingAddress: orderAddress,
        paymentInfo: {
            method: paymentInfo.method,
            status: paymentInfo.method === 'cod' ? 'pending' : 'pending',
            walletAmountUsed: actualWalletAmount
        },
        status: 'pending',
        source: 'web'
    });

    await order.save();

    // Process wallet payment if applicable
    if (actualWalletAmount > 0) {
        const wallet = await Wallet.getOrCreateWallet(userId);
        const walletPaymentResult = await wallet.debit(actualWalletAmount, {
            description: `Payment for order ${order.orderNumber}`,
            category: 'order_payment',
            relatedOrder: order._id,
            paymentMethod: 'wallet'
        });

        // Update order with wallet transaction
        order.paymentInfo.walletTransactionId = walletPaymentResult.transaction._id;
        await order.save();
    }

    // Update product stock
    for (const item of cart.items) {
        await Product.findByIdAndUpdate(
            item.product._id,
            { $inc: { stock: -item.quantity } }
        );
    }

    // Clear cart
    await Cart.findOneAndUpdate(
        { user: userId },
        { $set: { items: [] } }
    );

    // Send notification to admins about new order
    try {
        // Get all admin users with FCM tokens
        const admins = await User.find({
            role: 'admin',
            adminFcmToken: { $exists: true, $ne: null }
        }).select('adminFcmToken');

        if (admins.length > 0) {
            const adminTokens = admins.map(admin => admin.adminFcmToken);

            // Send Firebase notification
            await firebaseService.sendOrderNotificationToAdmins(order, adminTokens);
            console.log('Order notification sent to admins:', order.orderNumber);
        }
    } catch (notificationError) {
        console.error('Failed to send order notification:', notificationError);
        // Don't fail the order creation if notification fails
    }

    // Create Razorpay order if payment method is not COD
    let razorpayOrder = null;
    if (paymentInfo.method !== 'cod' && finalTotal > 0) {
        try {
            const razorpayOptions = {
                amount: Math.round(finalTotal * 100), // Convert to paise
                currency: 'INR',
                receipt: order.orderNumber,
                notes: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    userId: userId.toString()
                }
            };

            razorpayOrder = await razorpay.orders.create(razorpayOptions);

            // Update order with Razorpay order ID
            order.paymentInfo.razorpayOrderId = razorpayOrder.id;
            await order.save();

            console.log('Razorpay order created:', {
                orderId: order._id,
                razorpayOrderId: razorpayOrder.id,
                amount: finalTotal
            });
        } catch (error) {
            console.error('Failed to create Razorpay order:', error);
            // Don't fail the order creation, just log the error
        }
    }

    const responseData = {
        order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            items: order.items,
            pricing: order.pricing,
            shippingAddress: order.shippingAddress,
            paymentInfo: order.paymentInfo,
            createdAt: order.createdAt
        }
    };

    // Add Razorpay details if payment is required
    if (razorpayOrder) {
        responseData.razorpay = {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        };
        responseData.requiresPayment = true;
    } else {
        responseData.requiresPayment = false;
    }

    res.success(responseData, 'Order created successfully', 201);
});

// Get user's orders
exports.getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
        .populate('items.product', 'name images slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    const formattedOrders = orders.map(order => ({
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalItems: order.totalItems,
        pricing: order.pricing,
        paymentInfo: order.paymentInfo,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
        }))
    }));

    res.success({
        orders: formattedOrders,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: skip + parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Orders retrieved successfully');
});

// Get single order details
exports.getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user ? req.user._id : null;

    // Validate orderId format
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.error('Invalid order ID format', [], 400);
    }

    const query = { _id: orderId };
    if (userId) query.user = userId; // Users can only see their own orders

    const order = await Order.findOne(query)
        .populate('items.product', 'name images price')
        .populate('user', 'name email');

    if (!order) {
        return res.error('Order not found', [], 404);
    }

    // Format order response
    const orderResponse = {
        _id: order._id,
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items.map(item => ({
            _id: item._id,
            product: item.product ? {
                _id: item.product._id,
                id: item.product._id,
                name: item.product.name,
                images: item.product.images || [],
                price: item.product.price
            } : item.productSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            variant: item.variant
        })),
        pricing: order.pricing,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        paymentInfo: order.paymentInfo,
        user: order.user ? {
            _id: order.user._id,
            name: order.user.name,
            email: order.user.email
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedDelivery: order.estimatedDelivery,
        trackingInfo: order.trackingInfo
    };

    res.success(orderResponse, 'Order details retrieved successfully');
});

// Track order
exports.trackOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user ? req.user._id : null;

    // Validate orderId format
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.error('Invalid order ID format', [], 400);
    }

    const query = { _id: orderId };
    if (userId) query.user = userId; // Users can only track their own orders

    const order = await Order.findOne(query).select('_id orderNumber status createdAt updatedAt estimatedDelivery trackingInfo');

    if (!order) {
        return res.error('Order not found', [], 404);
    }

    // Create tracking timeline
    const trackingTimeline = [
        {
            status: 'pending',
            title: 'Order Placed',
            description: 'Your order has been placed successfully',
            timestamp: order.createdAt,
            completed: true
        },
        {
            status: 'confirmed',
            title: 'Order Confirmed',
            description: 'Your order has been confirmed and is being prepared',
            timestamp: order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
            completed: ['confirmed', 'shipped', 'delivered'].includes(order.status)
        },
        {
            status: 'shipped',
            title: 'Order Shipped',
            description: 'Your order has been shipped and is on the way',
            timestamp: order.status === 'shipped' || order.status === 'delivered' ? order.updatedAt : null,
            completed: ['shipped', 'delivered'].includes(order.status)
        },
        {
            status: 'delivered',
            title: 'Order Delivered',
            description: 'Your order has been delivered successfully',
            timestamp: order.status === 'delivered' ? order.updatedAt : null,
            completed: order.status === 'delivered'
        }
    ];

    const trackingResponse = {
        _id: order._id,
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        estimatedDelivery: order.estimatedDelivery,
        trackingInfo: order.trackingInfo,
        timeline: trackingTimeline,
        lastUpdated: order.updatedAt
    };

    res.success(trackingResponse, 'Order tracking information retrieved successfully');
});

// List all orders (admin)
exports.getOrders = asyncHandler(async (req, res) => {
    console.log('�🚨🚨 ADMIN ORDERS ENDPOINT HIT 🚨🚨🚨');
    console.log('�🔍 getOrders called with params:', req.query);
    const { page = 1, limit = 10, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;

    let orders;
    if (search) {
        // Search by order ID or user email/name
        orders = await Order.find(filter)
            .populate('user', 'name email firstName lastName')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 });

        // Filter by search term
        orders = orders.filter(order =>
            order._id.toString().includes(search) ||
            (order.user && (
                order.user.name.toLowerCase().includes(search.toLowerCase()) ||
                order.user.email.toLowerCase().includes(search.toLowerCase())
            ))
        );
    } else {
        orders = await Order.find(filter)
            .populate('user', 'name email firstName lastName')
            .populate('items.product', 'name price')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
    }

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    // Format orders for response with null safety
    const formattedOrders = orders.map(order => ({
        _id: order._id,
        id: order._id,
        orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
        user: order.user ? {
            _id: order.user._id,
            id: order.user._id,
            name: order.user.name || 'Unknown User',
            email: order.user.email || 'No email',
            firstName: order.user.firstName || 'Unknown',
            lastName: order.user.lastName || 'User'
        } : {
            _id: null,
            id: null,
            name: 'Guest User',
            email: 'No email',
            firstName: 'Guest',
            lastName: 'User'
        },
        items: order.items ? order.items.map(item => {
            // Handle undefined/null values for pricing
            const unitPrice = (item.unitPrice !== undefined && item.unitPrice !== null) ? item.unitPrice :
                             (item.price !== undefined && item.price !== null) ? item.price :
                             (item.product && item.product.price !== undefined && item.product.price !== null) ? item.product.price : 0;
            const quantity = (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 0;
            const totalPrice = (item.totalPrice !== undefined && item.totalPrice !== null) ? item.totalPrice :
                              (quantity * unitPrice);

            console.log('🔍 Processing item:', {
                productId: item.product?._id,
                productPrice: item.product?.price,
                itemUnitPrice: item.unitPrice,
                itemTotalPrice: item.totalPrice,
                calculatedUnitPrice: unitPrice,
                calculatedTotalPrice: totalPrice
            });

            return {
                product: item.product ? {
                    _id: item.product._id,
                    id: item.product._id,
                    name: item.product.name || 'Unknown Product'
                } : {
                    _id: null,
                    id: null,
                    name: 'Deleted Product'
                },
                quantity: quantity,
                price: unitPrice,
                subtotal: totalPrice
            };
        }) : [],
        total: (() => {
            // Try order pricing first
            if (order.pricing?.total !== undefined && order.pricing?.total !== null) return order.pricing.total;
            if (order.total !== undefined && order.total !== null) return order.total;

            // Calculate from items if pricing is missing
            let calculatedTotal = 0;
            if (order.items && order.items.length > 0) {
                calculatedTotal = order.items.reduce((sum, item) => {
                    const unitPrice = (item.unitPrice !== undefined && item.unitPrice !== null) ? item.unitPrice :
                                     (item.price !== undefined && item.price !== null) ? item.price :
                                     (item.product && item.product.price !== undefined && item.product.price !== null) ? item.product.price : 0;
                    const quantity = (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 0;
                    const itemTotal = (item.totalPrice !== undefined && item.totalPrice !== null) ? item.totalPrice : (quantity * unitPrice);
                    return sum + itemTotal;
                }, 0);
            }
            return calculatedTotal;
        })(),
        pricing: {
            total: (() => {
                // Try order pricing first
                if (order.pricing?.total !== undefined && order.pricing?.total !== null) return order.pricing.total;
                if (order.total !== undefined && order.total !== null) return order.total;

                // Calculate from items if pricing is missing
                let calculatedTotal = 0;
                if (order.items && order.items.length > 0) {
                    calculatedTotal = order.items.reduce((sum, item) => {
                        const unitPrice = (item.unitPrice !== undefined && item.unitPrice !== null) ? item.unitPrice :
                                         (item.price !== undefined && item.price !== null) ? item.price :
                                         (item.product && item.product.price !== undefined && item.product.price !== null) ? item.product.price : 0;
                        const quantity = (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 0;
                        const itemTotal = (item.totalPrice !== undefined && item.totalPrice !== null) ? item.totalPrice : (quantity * unitPrice);
                        return sum + itemTotal;
                    }, 0);
                }
                return calculatedTotal;
            })(),
            subtotal: (() => {
                // Try order pricing first
                if (order.pricing?.subtotal !== undefined && order.pricing?.subtotal !== null) return order.pricing.subtotal;
                if (order.subtotal !== undefined && order.subtotal !== null) return order.subtotal;
                if (order.pricing?.total !== undefined && order.pricing?.total !== null) return order.pricing.total;
                if (order.total !== undefined && order.total !== null) return order.total;

                // Calculate from items if pricing is missing
                let calculatedSubtotal = 0;
                if (order.items && order.items.length > 0) {
                    calculatedSubtotal = order.items.reduce((sum, item) => {
                        const unitPrice = (item.unitPrice !== undefined && item.unitPrice !== null) ? item.unitPrice :
                                         (item.price !== undefined && item.price !== null) ? item.price :
                                         (item.product && item.product.price !== undefined && item.product.price !== null) ? item.product.price : 0;
                        const quantity = (item.quantity !== undefined && item.quantity !== null) ? item.quantity : 0;
                        const itemTotal = (item.totalPrice !== undefined && item.totalPrice !== null) ? item.totalPrice : (quantity * unitPrice);
                        return sum + itemTotal;
                    }, 0);
                }
                return calculatedSubtotal;
            })(),
            tax: order.pricing?.tax || 0,
            taxRate: order.pricing?.taxRate || 0,
            shipping: order.pricing?.shipping || 0,
            discount: order.pricing?.discount || 0
        },
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        paymentMethod: order.paymentInfo?.method || 'unknown',
        shippingAddress: order.shippingAddress || {},
        createdAt: order.createdAt,
        orderDate: order.createdAt,
        created_at: order.createdAt,
        updatedAt: order.updatedAt
    }));

    const pagination = {
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        total: totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

    res.success({
        orders: formattedOrders,
        pagination: {
            currentPage: parseInt(page),
            totalPages,
            total: totalOrders,
            hasNext: page < totalPages,
            hasPrev: page > 1
        },
        debug: {
            controller: 'orderController.getOrders',
            timestamp: new Date().toISOString(),
            fixApplied: true
        }
    }, 'Orders retrieved successfully');
});

// Update order status (admin)
exports.updateOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            message: 'Order updated successfully',
            order
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending' && order.status !== 'paid') {
            return res.status(400).json({
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update order status only (admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.error('Invalid status', [], 400);
    }

    // Find and update order
    const order = await Order.findById(id);
    if (!order) {
        return res.error('Order not found', [], 404);
    }

    order.status = status;
    await order.save();

    // Populate order data for response
    await order.populate('user', 'name email');
    await order.populate('items.product', 'name');

    const formattedOrder = {
        id: order._id,
        orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
        user: order.user ? {
            id: order.user._id,
            name: order.user.name,
            email: order.user.email
        } : null,
        items: order.items.map(item => ({
            product: {
                id: item.product._id,
                name: item.product.name
            },
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
        })),
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentInfo?.method,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
    };

    res.success(formattedOrder, 'Order status updated successfully');
});