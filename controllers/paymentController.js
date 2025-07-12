const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
exports.createRazorpayOrder = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: amount * 100, // amount in paise
            currency,
            receipt: receipt || `order_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create Razorpay order', 
            error: err.message 
        });
    }
};

// Verify Razorpay payment
exports.verifyRazorpayPayment = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            order_id // Our internal order ID
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Update order status
        const order = await Order.findByIdAndUpdate(
            order_id,
            {
                status: 'paid',
                'paymentInfo.transactionId': razorpay_payment_id,
                'paymentInfo.razorpayOrderId': razorpay_order_id,
                'paymentInfo.razorpaySignature': razorpay_signature
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            order
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Payment verification failed', 
            error: err.message 
        });
    }
};

// Handle payment failure
exports.handlePaymentFailure = async (req, res) => {
    try {
        const { order_id, error } = req.body;

        // Update order status to failed or keep as pending
        await Order.findByIdAndUpdate(
            order_id,
            {
                'paymentInfo.error': error,
                'paymentInfo.failedAt': new Date()
            }
        );

        res.json({
            success: true,
            message: 'Payment failure recorded'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to record payment failure', 
            error: err.message 
        });
    }
};

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

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            return res.status(400).json({ message: 'Invalid webhook signature' });
        }

        const event = req.body.event;
        const paymentEntity = req.body.payload.payment.entity;

        switch (event) {
            case 'payment.captured':
                // Handle successful payment
                await handlePaymentCaptured(paymentEntity);
                break;
            case 'payment.failed':
                // Handle failed payment
                await handlePaymentFailed(paymentEntity);
                break;
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

// Helper functions
async function handlePaymentCaptured(paymentEntity) {
    try {
        // Find order by Razorpay order ID
        const order = await Order.findOne({
            'paymentInfo.razorpayOrderId': paymentEntity.order_id
        });

        if (order && order.status === 'pending') {
            order.status = 'paid';
            order.paymentInfo.transactionId = paymentEntity.id;
            order.paymentInfo.capturedAt = new Date();
            await order.save();
        }
    } catch (err) {
        console.error('Error handling payment captured:', err);
    }
}

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
