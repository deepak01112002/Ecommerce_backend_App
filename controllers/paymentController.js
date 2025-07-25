const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Validate Razorpay configuration
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials not found in environment variables');
}

// Create payment (generic method)
exports.createPayment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const { amount, orderId, paymentMethod = 'razorpay', currency = 'INR' } = req.body;

    try {
        if (paymentMethod === 'cod') {
            // Handle Cash on Delivery
            const paymentData = {
                _id: `cod_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                orderId: orderId,
                amount: amount,
                currency: currency,
                method: 'cod',
                status: 'pending',
                createdAt: new Date()
            };

            res.success({
                payment: paymentData,
                requiresPayment: false
            }, 'COD payment created successfully');
        } else {
            // Handle online payment via Razorpay
            const options = {
                amount: Math.round(amount * 100), // Convert to paise
                currency: currency,
                receipt: orderId || `receipt_${Date.now()}`,
                notes: {
                    orderId: orderId,
                    paymentMethod: paymentMethod
                }
            };

            const razorpayOrder = await razorpay.orders.create(options);

            const paymentData = {
                _id: razorpayOrder.id,
                orderId: orderId,
                amount: amount,
                currency: currency,
                method: paymentMethod,
                status: 'created',
                createdAt: new Date(),
                razorpay_order_id: razorpayOrder.id
            };

            res.success({
                payment: paymentData,
                razorpayOrder: razorpayOrder,
                key_id: process.env.RAZORPAY_KEY_ID,
                requiresPayment: true
            }, 'Razorpay payment created successfully');
        }
    } catch (error) {
        console.error('Payment creation error:', error);
        res.error('Failed to create payment', [], 500);
    }
});

// Get payment methods
exports.getPaymentMethods = asyncHandler(async (req, res) => {
    const paymentMethods = [
        {
            id: 'cod',
            name: 'Cash on Delivery',
            description: 'Pay when your order is delivered',
            enabled: true,
            charges: 0, // No extra charges for COD
            minAmount: 100,
            maxAmount: 50000,
            icon: 'cash',
            processingTime: 'On delivery'
        },
        {
            id: 'razorpay',
            name: 'Online Payment',
            description: 'Pay using UPI, Cards, Net Banking, Wallets',
            enabled: true,
            charges: 0,
            minAmount: 1,
            maxAmount: 500000,
            icon: 'credit-card',
            processingTime: 'Instant',
            supportedMethods: [
                'UPI',
                'Credit Card',
                'Debit Card',
                'Net Banking',
                'Wallets (Paytm, PhonePe, etc.)',
                'EMI'
            ]
        },
        {
            id: 'wallet',
            name: 'Wallet Payment',
            description: 'Pay using your wallet balance',
            enabled: true,
            charges: 0,
            minAmount: 1,
            maxAmount: 100000,
            icon: 'wallet',
            processingTime: 'Instant'
        }
    ];

    res.success({
        methods: paymentMethods,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
    }, 'Payment methods retrieved successfully');
});

// Get payment by ID
exports.getPaymentById = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    // Mock payment data for testing
    const payment = {
        _id: paymentId,
        orderId: 'order_123',
        amount: 199999,
        currency: 'INR',
        method: 'online',
        status: 'completed',
        razorpay_payment_id: `pay_${paymentId}`,
        razorpay_order_id: `order_${paymentId}`,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    res.success({ payment }, 'Payment details retrieved successfully');
});

// Create Razorpay order
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const { amount, currency = 'INR', receipt, orderId } = req.body;

    try {
        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency,
            receipt: receipt || `order_${Date.now()}`,
            notes: {
                orderId: orderId,
                created_at: new Date().toISOString()
            }
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Log successful order creation
        console.log('Razorpay order created:', {
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            receipt: razorpayOrder.receipt
        });

        res.success({
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID,
            amount: amount,
            currency: currency
        }, 'Razorpay order created successfully');
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        res.error('Failed to create Razorpay order', [error.message], 500);
    }
});

// Verify Razorpay payment
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        order_id // Our internal order ID
    } = req.body;

    try {
        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.error('Payment signature verification failed:', {
                expected: expectedSignature,
                received: razorpay_signature,
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id
            });
            return res.error('Payment verification failed - Invalid signature', [], 400);
        }

        // Fetch payment details from Razorpay
        let paymentDetails = null;
        try {
            paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        } catch (fetchError) {
            console.error('Failed to fetch payment details:', fetchError);
        }

        // Update order status
        const updateData = {
            status: 'confirmed',
            'paymentInfo.status': 'completed',
            'paymentInfo.method': 'razorpay',
            'paymentInfo.transactionId': razorpay_payment_id,
            'paymentInfo.razorpayOrderId': razorpay_order_id,
            'paymentInfo.razorpayPaymentId': razorpay_payment_id,
            'paymentInfo.razorpaySignature': razorpay_signature,
            'paymentInfo.paidAt': new Date()
        };

        // Add payment details if available
        if (paymentDetails) {
            updateData['paymentInfo.paymentMethod'] = paymentDetails.method;
            updateData['paymentInfo.bank'] = paymentDetails.bank;
            updateData['paymentInfo.wallet'] = paymentDetails.wallet;
        }

        const order = await Order.findByIdAndUpdate(order_id, updateData, { new: true })
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name images');

        if (!order) {
            return res.error('Order not found', [], 404);
        }

        // Log successful payment
        console.log('Payment verified successfully:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: order.pricing.total,
            paymentId: razorpay_payment_id,
            userId: order.user?._id
        });

        res.success({
            order: order,
            payment: {
                id: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature,
                status: 'completed',
                verifiedAt: new Date()
            }
        }, 'Payment verified successfully');

    } catch (error) {
        console.error('Payment verification error:', error);
        res.error('Payment verification failed', [error.message], 500);
    }
});

// Handle payment failure
exports.handlePaymentFailure = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const { order_id, error, razorpay_order_id, razorpay_payment_id } = req.body;

    try {
        // Update order status to failed
        const updateData = {
            'paymentInfo.status': 'failed',
            'paymentInfo.error': error || 'Payment failed',
            'paymentInfo.failedAt': new Date()
        };

        if (razorpay_order_id) {
            updateData['paymentInfo.razorpayOrderId'] = razorpay_order_id;
        }
        if (razorpay_payment_id) {
            updateData['paymentInfo.razorpayPaymentId'] = razorpay_payment_id;
        }

        const order = await Order.findByIdAndUpdate(order_id, updateData, { new: true });

        if (!order) {
            return res.error('Order not found', [], 404);
        }

        // Log payment failure
        console.log('Payment failure recorded:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            error: error,
            razorpayOrderId: razorpay_order_id
        });

        res.success({
            order: order,
            message: 'Payment failure recorded'
        }, 'Payment failure recorded successfully');

    } catch (error) {
        console.error('Failed to record payment failure:', error);
        res.error('Failed to record payment failure', [error.message], 500);
    }
});

// Get payment details
exports.getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await razorpay.payments.fetch(paymentId);

        res.json({
            success: true,
            payment
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch payment details', 
            error: err.message 
        });
    }
};

// Refund payment (admin)
exports.refundPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { paymentId, amount, reason } = req.body;

        const refund = await razorpay.payments.refund(paymentId, {
            amount: amount * 100, // amount in paise
            notes: {
                reason: reason || 'Refund requested by admin'
            }
        });

        res.json({
            success: true,
            message: 'Refund initiated successfully',
            refund
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to initiate refund', 
            error: err.message 
        });
    }
};

// Webhook handler for Razorpay events
exports.handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Log webhook received
        console.log('Webhook received:', {
            event: req.body.event,
            timestamp: new Date().toISOString(),
            signature: webhookSignature ? 'present' : 'missing'
        });

        // Verify webhook signature (if secret is configured)
        if (webhookSecret && webhookSignature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (webhookSignature !== expectedSignature) {
                console.error('Invalid webhook signature');
                return res.status(400).json({ message: 'Invalid webhook signature' });
            }
        }

        const event = req.body.event;
        const payload = req.body.payload;

        switch (event) {
            case 'payment.captured':
                if (payload.payment && payload.payment.entity) {
                    await handlePaymentCaptured(payload.payment.entity);
                }
                break;
            case 'payment.failed':
                if (payload.payment && payload.payment.entity) {
                    await handlePaymentFailed(payload.payment.entity);
                }
                break;
            case 'order.paid':
                if (payload.order && payload.order.entity) {
                    await handleOrderPaid(payload.order.entity);
                }
                break;
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ message: 'Webhook processing failed', error: err.message });
    }
};

// Helper functions
async function handlePaymentCaptured(paymentEntity) {
    try {
        console.log('Processing payment captured:', paymentEntity.id);

        // Find order by Razorpay order ID
        const order = await Order.findOne({
            'paymentInfo.razorpayOrderId': paymentEntity.order_id
        });

        if (order && order.paymentInfo.status !== 'completed') {
            const updateData = {
                status: 'confirmed',
                'paymentInfo.status': 'completed',
                'paymentInfo.transactionId': paymentEntity.id,
                'paymentInfo.razorpayPaymentId': paymentEntity.id,
                'paymentInfo.paidAt': new Date(),
                'paymentInfo.method': paymentEntity.method || 'razorpay'
            };

            await Order.findByIdAndUpdate(order._id, updateData);

            console.log('Payment captured successfully for order:', order.orderNumber);
        }
    } catch (err) {
        console.error('Error handling payment captured:', err);
    }
}

async function handlePaymentFailed(paymentEntity) {
    try {
        console.log('Processing payment failed:', paymentEntity.id);

        // Find order by Razorpay order ID
        const order = await Order.findOne({
            'paymentInfo.razorpayOrderId': paymentEntity.order_id
        });

        if (order) {
            const updateData = {
                'paymentInfo.status': 'failed',
                'paymentInfo.error': paymentEntity.error_description || 'Payment failed',
                'paymentInfo.failedAt': new Date()
            };

            await Order.findByIdAndUpdate(order._id, updateData);

            console.log('Payment failure recorded for order:', order.orderNumber);
        }
    } catch (err) {
        console.error('Error handling payment failed:', err);
    }
}

async function handleOrderPaid(orderEntity) {
    try {
        console.log('Processing order paid:', orderEntity.id);

        // Find order by Razorpay order ID
        const order = await Order.findOne({
            'paymentInfo.razorpayOrderId': orderEntity.id
        });

        if (order && order.paymentInfo.status !== 'completed') {
            const updateData = {
                status: 'confirmed',
                'paymentInfo.status': 'completed',
                'paymentInfo.paidAt': new Date()
            };

            await Order.findByIdAndUpdate(order._id, updateData);

            console.log('Order marked as paid:', order.orderNumber);
        }
    } catch (err) {
        console.error('Error handling order paid:', err);
    }
}

// Handle COD payment confirmation
exports.confirmCODPayment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const { order_id } = req.body;

    try {
        const order = await Order.findById(order_id)
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name images');

        if (!order) {
            return res.error('Order not found', [], 404);
        }

        if (order.paymentInfo.method !== 'cod') {
            return res.error('This order is not a COD order', [], 400);
        }

        // Update order status for COD
        const updateData = {
            status: 'confirmed',
            'paymentInfo.status': 'pending', // COD payment is pending until delivery
            'paymentInfo.confirmedAt': new Date()
        };

        const updatedOrder = await Order.findByIdAndUpdate(order_id, updateData, { new: true })
            .populate('user', 'firstName lastName email')
            .populate('items.product', 'name images');

        console.log('COD order confirmed:', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: order.pricing.total,
            userId: order.user?._id
        });

        res.success({
            order: updatedOrder,
            payment: {
                method: 'cod',
                status: 'pending',
                confirmedAt: new Date()
            }
        }, 'COD order confirmed successfully');

    } catch (error) {
        console.error('COD confirmation error:', error);
        res.error('Failed to confirm COD order', [error.message], 500);
    }
});

async function handlePaymentFailed(paymentEntity) {
    try {
        // Find order by Razorpay order ID
        const order = await Order.findOne({
            'paymentInfo.razorpayOrderId': paymentEntity.order_id
        });

        if (order) {
            order.paymentInfo.error = paymentEntity.error_description;
            order.paymentInfo.failedAt = new Date();
            await order.save();
        }
    } catch (err) {
        console.error('Error handling payment failed:', err);
    }
}
