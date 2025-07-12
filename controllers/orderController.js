const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');

// Create order from cart
exports.createOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { address, paymentInfo, couponCode } = req.body;
        const userId = req.user ? req.user._id : null;
        const guestId = req.headers['guest-id'];

        if (!userId && !guestId) {
            return res.status(400).json({ message: 'User ID or Guest ID required' });
        }

        // Get cart
        const query = userId ? { user: userId } : { guestId: guestId };
        const cart = await Cart.findOne(query).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Calculate total and validate stock
        let total = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.product;

            // Check if product is still active and in stock
            if (!product.isActive) {
                return res.status(400).json({
                    message: `Product ${product.name} is no longer available`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
                });
            }

            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                variant: item.variant
            });
        }

        // Create order
        const order = new Order({
            user: userId,
            guestId: guestId,
            items: orderItems,
            total,
            address,
            paymentInfo,
            status: 'pending'
        });

        await order.save();

        // Update product stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(
                item.product._id,
                { $inc: { stock: -item.quantity } }
            );
        }

        // Clear cart
        await Cart.findOneAndDelete(query);

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const filter = { user: userId };
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .populate('items.product', 'name images')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalOrders = await Order.countDocuments(filter);

        res.json({
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get single order details
exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user ? req.user._id : null;

        const query = { _id: orderId };
        if (userId) query.user = userId; // Users can only see their own orders

        const order = await Order.findOne(query)
            .populate('items.product', 'name images')
            .populate('user', 'name email');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// List all orders (admin)
exports.getOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;

    let orders;
    if (search) {
        // Search by order ID or user email/name
        orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('items.product', 'name')
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
            .populate('user', 'name email')
            .populate('items.product', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
    }

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    // Format orders for response
    const formattedOrders = orders.map(order => ({
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
    }));

    const pagination = {
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        total: totalOrders,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

    res.paginated(formattedOrders, pagination, 'Orders retrieved successfully');
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