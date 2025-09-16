const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Address = require('../models/Address');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Invoice = require('../models/Invoice');
const SystemSettings = require('../models/SystemSettings');
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
        console.log('🏢 [DEBUG] Order creation - Using existing address with GST/PAN:');
        console.log('🏢 [DEBUG] GST Number:', orderAddress.gstNumber);
        console.log('📄 [DEBUG] PAN Number:', orderAddress.panNumber);
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
            coordinates: address.coordinates,
            gstNumber: address.gstNumber,
            panNumber: address.panNumber
        };
        console.log('🏢 [DEBUG] Order creation - Using provided address with GST/PAN:');
        console.log('🏢 [DEBUG] GST Number:', orderAddress.gstNumber);
        console.log('📄 [DEBUG] PAN Number:', orderAddress.panNumber);
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
    let totalTax = 0;
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

        // Calculate tax based on product's GST rate
        const gstRate = product.gstRate || 18; // Default to 18% if not set
        const itemTax = Math.round((itemTotal * (gstRate / 100)) * 100) / 100;
        totalTax += itemTax;

        orderItems.push({
            product: product._id,
            productSnapshot: {
                name: product.name,
                description: product.description,
                images: product.images,
                category: product.category,
                gstRate: gstRate,
                hsnCode: product.hsnCode || '9999'
            },
            variant: item.variant || 'Standard',
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice: itemTotal,
            discount: 0,
            tax: itemTax,
            taxRate: gstRate
        });
    }

    // Calculate pricing
    const shipping = 0; // Set shipping to 0 instead of removing zero
    const total = subtotal + shipping + totalTax;

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
        tax: totalTax,
        taxRate: 0.18, // This will be updated by the loop above
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
        console.log('🔍 Looking for admin users with FCM tokens...');

        // Get all admin users with FCM tokens
        const admins = await User.find({
            role: 'admin',
            adminFcmToken: { $exists: true, $ne: null }
        }).select('adminFcmToken firstName lastName email');

        console.log('👥 Found admins with FCM tokens:', {
            count: admins.length,
            admins: admins.map(admin => ({
                name: `${admin.firstName} ${admin.lastName}`,
                email: admin.email,
                hasToken: !!admin.adminFcmToken
            }))
        });

        if (admins.length > 0) {
            const adminTokens = admins.map(admin => admin.adminFcmToken);
            console.log('📱 Admin FCM tokens:', adminTokens.length, 'tokens found');

            // Send Firebase notification
            const notificationResult = await firebaseService.sendOrderNotificationToAdmins(order, adminTokens);
            console.log('✅ Order notification sent to admins:', {
                orderNumber: order.orderNumber,
                result: notificationResult
            });
        } else {
            console.log('⚠️ No admin users with FCM tokens found');
        }
    } catch (notificationError) {
        console.error('❌ Failed to send order notification:', notificationError);
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
            totalPrice: item.totalPrice,
            // Add GST fields for bill generation
            taxRate: item.taxRate || item.product?.gstRate || 18,
            tax: item.tax || 0,
            productSnapshot: {
                name: item.productSnapshot?.name || item.product?.name || 'Unknown Product',
                description: item.productSnapshot?.description || item.product?.description || '',
                images: item.productSnapshot?.images || item.product?.images || [],
                category: item.productSnapshot?.category || item.product?.category || '',
                gstRate: item.productSnapshot?.gstRate || item.taxRate || item.product?.gstRate || 18,
                hsnCode: item.productSnapshot?.hsnCode || item.product?.hsnCode || '9999'
            }
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
            variant: item.variant,
            // Add GST fields for bill generation
            taxRate: item.taxRate || item.product?.gstRate || 18,
            tax: item.tax || 0,
            productSnapshot: {
                name: item.productSnapshot?.name || item.product?.name || 'Unknown Product',
                description: item.productSnapshot?.description || item.product?.description || '',
                images: item.productSnapshot?.images || item.product?.images || [],
                category: item.productSnapshot?.category || item.product?.category || '',
                gstRate: item.productSnapshot?.gstRate || item.taxRate || item.product?.gstRate || 18,
                hsnCode: item.productSnapshot?.hsnCode || item.product?.hsnCode || '9999'
            }
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

// Download order invoice (authenticated users only)
exports.downloadOrderInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { format = 'A4' } = req.query;
    const userId = req.user._id;

    // Validate orderId format
    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.error('Invalid order ID format', [], 400);
    }

    // First verify the order belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        return res.error('Order not found or access denied', [], 404);
    }

    // Check if invoice download is enabled in system settings
    const settings = await SystemSettings.getCurrentSettings();
    if (!settings.features?.enableInvoiceDownload) {
        return res.error('Invoice download is currently disabled', [], 403);
    }

    // Find the invoice for this order, or create one if it doesn't exist
    let invoice = await Invoice.findOne({ order: orderId, user: userId })
        .populate('items.product', 'name description');

    if (!invoice) {
        // Auto-generate invoice from order (like admin panel does)
        try {
            invoice = await Invoice.generateFromOrder(orderId, {
                createdBy: userId // User generating their own invoice
            });

            // Generate QR code for the invoice
            if (invoice.generateQRCode) {
                await invoice.generateQRCode();
            }

            // Populate the product details for PDF generation
            invoice = await Invoice.findById(invoice._id)
                .populate('items.product', 'name description');

        } catch (generateError) {
            console.error('Auto-invoice generation error:', generateError);
            return res.error('Unable to generate invoice for this order', [generateError.message], 500);
        }
    }

    try {
        let pdfBuffer;

        if (format === 'thermal') {
            pdfBuffer = await generateThermalPDF(invoice);

        } else if (format === '4x6') {
            pdfBuffer = await generate4x6InvoicePDF(invoice);

        } else {
            pdfBuffer = await generateStandardPDF(invoice);
        }

        // Update download timestamp
        invoice.downloadedAt = new Date();
        await invoice.save();

        const filename = format === '4x6' ? `Invoice-4x6-${invoice.formattedInvoiceNumber}.pdf` : `Invoice-${invoice.formattedInvoiceNumber}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('PDF generation error:', error);
        return res.error('Failed to generate invoice PDF', [error.message], 500);
    }
});

// Helper function to generate standard PDF (copied from invoice controller)
async function generateStandardPDF(invoice) {
    return new Promise((resolve, reject) => {
        try {
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fontSize(20).text(invoice.companyDetails.name || 'Ghanshyam Murti Bhandar', 50, 50);
            doc.fontSize(10).text(invoice.companyDetails.address || 'Religious Items Store', 50, 80);
            doc.text(`Phone: ${invoice.companyDetails.phone || '+919876543210'}`, 50, 95);
            doc.text(`Email: ${invoice.companyDetails.email || 'support@ghanshyammurtibhandar.com'}`, 50, 110);
            doc.text(`GSTIN: ${invoice.companyDetails.gstin || 'GST123456789'}`, 50, 125);

            // Invoice details
            doc.fontSize(16).text('INVOICE', 400, 50);
            doc.fontSize(10).text(`Invoice No: ${invoice.formattedInvoiceNumber}`, 400, 80);
            doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`, 400, 95);
            doc.text(`Due Date: ${invoice.dueDate ? invoice.dueDate.toLocaleDateString() : 'N/A'}`, 400, 110);

            // Customer details
            doc.text('Bill To:', 50, 160);
            doc.text(invoice.customerDetails.name, 50, 175);
            doc.text(invoice.customerDetails.address, 50, 190);
            doc.text(`Phone: ${invoice.customerDetails.phone}`, 50, 205);
            doc.text(`Email: ${invoice.customerDetails.email}`, 50, 220);

            // Items table
            let yPosition = 260;
            doc.text('Item', 50, yPosition);
            doc.text('Qty', 200, yPosition);
            doc.text('Rate', 250, yPosition);
            doc.text('Amount', 350, yPosition);
            doc.text('GST', 420, yPosition);
            doc.text('Total', 480, yPosition);

            yPosition += 20;
            doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
            yPosition += 10;

            invoice.items.forEach(item => {
                doc.text(item.name, 50, yPosition);
                doc.text(item.quantity.toString(), 200, yPosition);
                doc.text(`₹${item.rate}`, 250, yPosition);
                doc.text(`₹${item.taxableAmount}`, 350, yPosition);
                doc.text(`₹${(item.cgst + item.sgst + item.igst)}`, 420, yPosition);
                doc.text(`₹${item.totalAmount}`, 480, yPosition);
                yPosition += 20;
            });

            // Totals
            yPosition += 20;
            doc.text(`Subtotal: ₹${invoice.pricing.subtotal}`, 350, yPosition);
            yPosition += 15;
            doc.text(`GST: ₹${invoice.pricing.totalGST}`, 350, yPosition);
            yPosition += 15;
            doc.fontSize(12).text(`Total: ₹${invoice.pricing.grandTotal}`, 350, yPosition);

            // Terms and conditions
            if (invoice.termsAndConditions) {
                yPosition += 40;
                doc.fontSize(10).text('Terms & Conditions:', 50, yPosition);
                doc.text(invoice.termsAndConditions, 50, yPosition + 15);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate thermal PDF (copied from invoice controller)
async function generateThermalPDF(invoice) {
    return new Promise((resolve, reject) => {
        try {
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({
                size: [164, 'auto'], // 58mm width
                margin: 10
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Header
            doc.fontSize(12).text(invoice.companyDetails.name || 'Ghanshyam Murti Bhandar', { align: 'center' });
            doc.fontSize(8).text(invoice.companyDetails.address || 'Religious Items Store', { align: 'center' });
            doc.text(`Ph: ${invoice.companyDetails.phone || '+919876543210'}`, { align: 'center' });
            doc.text(`GSTIN: ${invoice.companyDetails.gstin || 'GST123456789'}`, { align: 'center' });

            doc.moveDown();
            doc.text('--------------------------------', { align: 'center' });
            doc.text('INVOICE', { align: 'center' });
            doc.text('--------------------------------', { align: 'center' });

            // Invoice details
            doc.text(`Invoice: ${invoice.formattedInvoiceNumber}`);
            doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`);
            doc.text(`Customer: ${invoice.customerDetails.name}`);

            doc.moveDown();
            doc.text('--------------------------------');

            // Items
            invoice.items.forEach(item => {
                doc.text(`${item.name}`);
                doc.text(`${item.quantity} x ₹${item.rate} = ₹${item.totalAmount}`);
                doc.moveDown(0.5);
            });

            doc.text('--------------------------------');
            doc.text(`Subtotal: ₹${invoice.pricing.subtotal}`);
            doc.text(`GST: ₹${invoice.pricing.totalGST}`);
            doc.text('--------------------------------');
            doc.fontSize(10).text(`TOTAL: ₹${invoice.pricing.grandTotal}`, { align: 'center' });
            doc.text('--------------------------------');

            doc.moveDown();
            doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

// List all orders (admin)
exports.getOrders = asyncHandler(async (req, res) => {

    console.log('🚨🚨 ADMIN ORDERS ENDPOINT HIT 🚨🚨🚨');
    console.log('🔍 getOrders called with params:', req.query);

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

    // Debug: Check if orders have GST/PAN data
    console.log('🔍 [DEBUG] getOrders - Checking address data in orders:');
    orders.forEach((order, index) => {
        if (index < 3) { // Only log first 3 orders to avoid spam
            console.log(`📋 [DEBUG] Order ${index + 1} (${order._id}):`);
            console.log('🏢 [DEBUG] Shipping Address GST:', order.shippingAddress?.gstNumber || 'N/A');
            console.log('📄 [DEBUG] Shipping Address PAN:', order.shippingAddress?.panNumber || 'N/A');
            console.log('🏢 [DEBUG] Billing Address GST:', order.billingAddress?.gstNumber || 'N/A');
            console.log('📄 [DEBUG] Billing Address PAN:', order.billingAddress?.panNumber || 'N/A');
        }
    });

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

                subtotal: totalPrice,
                // Add GST fields for bill generation
                totalPrice: item.totalPrice || totalPrice,
                unitPrice: item.unitPrice || unitPrice,
                taxRate: item.taxRate || item.product?.gstRate || 18,
                tax: item.tax || 0,
                productSnapshot: {
                    name: item.productSnapshot?.name || item.product?.name || 'Unknown Product',
                    description: item.productSnapshot?.description || item.product?.description || '',
                    images: item.productSnapshot?.images || item.product?.images || [],
                    category: item.productSnapshot?.category || item.product?.category || '',
                    gstRate: item.productSnapshot?.gstRate || item.taxRate || item.product?.gstRate || 18,
                    hsnCode: item.productSnapshot?.hsnCode || item.product?.hsnCode || '9999'
                }

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
        shipping: {
            deliveryMethod: order.shipping?.deliveryMethod || 'manual',
            carrier: order.shipping?.carrier || 'Manual Delivery',
            trackingNumber: order.shipping?.trackingNumber || null,
            assignedBy: order.shipping?.assignedBy || null,
            assignedAt: order.shipping?.assignedAt || null,
            adminNotes: order.shipping?.adminNotes || '',
            estimatedDelivery: order.shipping?.estimatedDelivery || null,
            actualDelivery: order.shipping?.actualDelivery || null
        },
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