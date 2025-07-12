const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Optional auth middleware
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        authMiddleware(req, res, next);
    } else {
        next();
    }
};

// Create Razorpay order
router.post('/create-order',
    optionalAuth,
    [
        body('amount').isNumeric({ min: 1 }).withMessage('Amount must be a positive number'),
        body('currency').optional().isString().withMessage('Currency must be a string'),
        body('receipt').optional().isString().withMessage('Receipt must be a string')
    ],
    paymentController.createRazorpayOrder
);

// Verify Razorpay payment
router.post('/verify',
    optionalAuth,
    [
        body('razorpay_order_id').notEmpty().withMessage('Razorpay order ID is required'),
        body('razorpay_payment_id').notEmpty().withMessage('Razorpay payment ID is required'),
        body('razorpay_signature').notEmpty().withMessage('Razorpay signature is required'),
        body('order_id').isMongoId().withMessage('Valid order ID is required')
    ],
    paymentController.verifyRazorpayPayment
);

// Handle payment failure
router.post('/failure',
    optionalAuth,
    [
        body('order_id').isMongoId().withMessage('Valid order ID is required'),
        body('error').optional().isString().withMessage('Error must be a string')
    ],
    paymentController.handlePaymentFailure
);

// Get payment details
router.get('/details/:paymentId', authMiddleware, paymentController.getPaymentDetails);

// Admin routes
// Refund payment
router.post('/refund',
    adminMiddleware,
    [
        body('paymentId').notEmpty().withMessage('Payment ID is required'),
        body('amount').isNumeric({ min: 1 }).withMessage('Amount must be a positive number'),
        body('reason').optional().isString().withMessage('Reason must be a string')
    ],
    paymentController.refundPayment
);

// Webhook endpoint (no auth required)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
