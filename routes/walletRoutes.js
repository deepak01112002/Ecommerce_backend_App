const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All wallet routes require authentication
router.use(authMiddleware);

// Get wallet details
router.get('/',
    walletController.getWallet
);

// Get wallet balance
router.get('/balance',
    walletController.getBalance
);

// Add money to wallet (Top-up)
router.post('/add-money',
    [
        body('amount').isFloat({ min: 10, max: 50000 }).withMessage('Amount must be between ₹10 and ₹50,000'),
        body('paymentMethod').optional().isIn(['upi', 'card', 'netbanking']).withMessage('Invalid payment method'),
        body('description').optional().isLength({ max: 200 }).withMessage('Description must be max 200 characters'),
        body('externalTransactionId').optional().isString().withMessage('External transaction ID must be string')
    ],
    validateRequest,
    walletController.addMoney
);

// Check balance for payment
router.post('/check-balance',
    [
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive')
    ],
    validateRequest,
    walletController.checkBalance
);

// Process wallet payment (internal use)
router.post('/process-payment',
    [
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
        body('description').notEmpty().withMessage('Description is required'),
        body('orderId').optional().isMongoId().withMessage('Invalid order ID'),
        body('category').optional().isIn([
            'order_payment', 'order_refund', 'wallet_topup', 'cashback',
            'referral_bonus', 'loyalty_reward', 'admin_adjustment', 'penalty',
            'withdrawal', 'other'
        ]).withMessage('Invalid category')
    ],
    validateRequest,
    walletController.processPayment
);

// Get transaction history
router.get('/transactions',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('type').optional().isIn(['credit', 'debit']).withMessage('Invalid transaction type'),
        query('category').optional().isIn([
            'order_payment', 'order_refund', 'wallet_topup', 'cashback',
            'referral_bonus', 'loyalty_reward', 'admin_adjustment', 'penalty',
            'withdrawal', 'other'
        ]).withMessage('Invalid category'),
        query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled', 'reversed']).withMessage('Invalid status'),
        query('dateFrom').optional().isISO8601().withMessage('Invalid date format for dateFrom'),
        query('dateTo').optional().isISO8601().withMessage('Invalid date format for dateTo')
    ],
    validateRequest,
    walletController.getTransactionHistory
);

// Get transaction summary
router.get('/transactions/summary',
    [
        query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period')
    ],
    validateRequest,
    walletController.getTransactionSummary
);

// Get single transaction
router.get('/transactions/:id',
    [
        param('id').isMongoId().withMessage('Invalid transaction ID')
    ],
    validateRequest,
    walletController.getTransaction
);

module.exports = router;
