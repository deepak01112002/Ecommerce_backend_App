const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get user wallet
exports.getWallet = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const wallet = await Wallet.getOrCreateWallet(userId);

    res.success({
        wallet: {
            _id: wallet._id,
            balance: wallet.balance,
            formattedBalance: wallet.formattedBalance,
            currency: wallet.currency,
            status: wallet.status,
            isActive: wallet.isActive,
            isBlocked: wallet.isBlocked,
            blockedReason: wallet.blockedReason,
            lastTransactionAt: wallet.lastTransactionAt,
            totalCredits: wallet.totalCredits,
            totalDebits: wallet.totalDebits,
            transactionCount: wallet.transactionCount,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt
        }
    }, 'Wallet retrieved successfully');
});

// Get wallet balance
exports.getBalance = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const wallet = await Wallet.getOrCreateWallet(userId);

    res.success({
        balance: wallet.balance,
        formattedBalance: wallet.formattedBalance,
        currency: wallet.currency,
        status: wallet.status
    }, 'Wallet balance retrieved successfully');
});

// Add money to wallet (Top-up)
exports.addMoney = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { amount, paymentMethod = 'upi', description, externalTransactionId } = req.body;

    if (!amount || amount <= 0) {
        return res.error('Invalid amount', [], 400);
    }

    if (amount < 10) {
        return res.error('Minimum top-up amount is ₹10', [], 400);
    }

    if (amount > 50000) {
        return res.error('Maximum top-up amount is ₹50,000', [], 400);
    }

    const wallet = await Wallet.getOrCreateWallet(userId);

    if (wallet.isBlocked) {
        return res.error('Wallet is blocked', [], 403);
    }

    // In real implementation, you would integrate with payment gateway here
    // For now, we'll simulate successful payment

    const transactionData = {
        description: description || `Wallet top-up of ₹${amount}`,
        category: 'wallet_topup',
        paymentMethod,
        externalTransactionId,
        metadata: {
            topupMethod: paymentMethod,
            requestedAt: new Date()
        }
    };

    const result = await wallet.credit(amount, transactionData);

    res.success({
        wallet: {
            balance: result.wallet.balance,
            formattedBalance: result.wallet.formattedBalance
        },
        transaction: {
            _id: result.transaction._id,
            transactionId: result.transaction.transactionId,
            amount: result.transaction.amount,
            formattedAmount: result.transaction.formattedAmount,
            type: result.transaction.type,
            status: result.transaction.status,
            createdAt: result.transaction.createdAt
        }
    }, 'Money added to wallet successfully');
});

// Get transaction history
exports.getTransactionHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        page = 1,
        limit = 20,
        type,
        category,
        status,
        dateFrom,
        dateTo
    } = req.query;

    const options = {
        limit: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        type,
        category,
        status,
        dateFrom,
        dateTo
    };

    try {
        const transactions = await WalletTransaction.getUserTransactions(userId, options);
        const total = await WalletTransaction.countDocuments({
            user: userId,
            ...(type && { type }),
            ...(category && { category }),
            ...(status && { status }),
            ...(dateFrom || dateTo) && {
                createdAt: {
                    ...(dateFrom && { $gte: new Date(dateFrom) }),
                    ...(dateTo && { $lte: new Date(dateTo) })
                }
            }
        });

    const formattedTransactions = (transactions || []).map(transaction => ({
        _id: transaction._id,
        transactionId: transaction.transactionId,
        type: transaction.type,
        amount: transaction.amount,
        formattedAmount: transaction.formattedAmount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        category: transaction.category,
        displayCategory: transaction.displayCategory,
        status: transaction.status,
        displayStatus: transaction.displayStatus,
        paymentMethod: transaction.paymentMethod,
        relatedOrder: transaction.relatedOrder,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt
    }));

    res.success({
        transactions: formattedTransactions,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        },
        filters: {
            type,
            category,
            status,
            dateFrom,
            dateTo
        }
    }, 'Transaction history retrieved successfully');

    } catch (error) {
        console.error('Transaction history error:', error);
        res.success({
            transactions: [],
            pagination: {
                currentPage: parseInt(page),
                totalPages: 0,
                total: 0,
                hasNext: false,
                hasPrev: false
            }
        }, 'Transaction history retrieved successfully');
    }
});

// Get transaction summary
exports.getTransactionSummary = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { period = 'month' } = req.query;

    const summary = await WalletTransaction.getTransactionSummary(userId, period);

    res.success({
        summary: {
            period: summary.period,
            startDate: summary.startDate,
            endDate: summary.endDate,
            totalCredits: summary.totalCredits,
            totalDebits: summary.totalDebits,
            creditCount: summary.creditCount,
            debitCount: summary.debitCount,
            netAmount: summary.netAmount,
            formattedCredits: `+₹${summary.totalCredits.toFixed(2)}`,
            formattedDebits: `-₹${summary.totalDebits.toFixed(2)}`,
            formattedNet: `${summary.netAmount >= 0 ? '+' : ''}₹${summary.netAmount.toFixed(2)}`
        }
    }, 'Transaction summary retrieved successfully');
});

// Check wallet balance for payment
exports.checkBalance = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        return res.error('Invalid amount', [], 400);
    }

    const wallet = await Wallet.getOrCreateWallet(userId);

    const hasSufficientBalance = wallet.hasSufficientBalance(amount);

    res.success({
        hasSufficientBalance,
        currentBalance: wallet.balance,
        requiredAmount: amount,
        shortfall: hasSufficientBalance ? 0 : amount - wallet.balance,
        walletStatus: wallet.status
    }, hasSufficientBalance ? 'Sufficient balance available' : 'Insufficient balance');
});

// Process wallet payment (internal use)
exports.processPayment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { amount, description, orderId, category = 'order_payment' } = req.body;

    if (!amount || amount <= 0) {
        return res.error('Invalid amount', [], 400);
    }

    const wallet = await Wallet.getOrCreateWallet(userId);

    if (!wallet.hasSufficientBalance(amount)) {
        return res.error('Insufficient wallet balance', [], 400);
    }

    const transactionData = {
        description: description || `Payment of ₹${amount}`,
        category,
        paymentMethod: 'wallet',
        relatedOrder: orderId,
        metadata: {
            paymentFor: 'order',
            processedAt: new Date()
        }
    };

    const result = await wallet.debit(amount, transactionData);

    res.success({
        wallet: {
            balance: result.wallet.balance,
            formattedBalance: result.wallet.formattedBalance
        },
        transaction: {
            _id: result.transaction._id,
            transactionId: result.transaction.transactionId,
            amount: result.transaction.amount,
            formattedAmount: result.transaction.formattedAmount,
            type: result.transaction.type,
            status: result.transaction.status,
            createdAt: result.transaction.createdAt
        }
    }, 'Payment processed successfully');
});

// Get single transaction
exports.getTransaction = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const transaction = await WalletTransaction.findOne({
        _id: id,
        user: userId
    }).populate('relatedOrder', 'orderNumber status');

    if (!transaction) {
        return res.error('Transaction not found', [], 404);
    }

    res.success({
        transaction: {
            _id: transaction._id,
            transactionId: transaction.transactionId,
            type: transaction.type,
            amount: transaction.amount,
            formattedAmount: transaction.formattedAmount,
            balanceAfter: transaction.balanceAfter,
            description: transaction.description,
            category: transaction.category,
            displayCategory: transaction.displayCategory,
            status: transaction.status,
            displayStatus: transaction.displayStatus,
            paymentMethod: transaction.paymentMethod,
            relatedOrder: transaction.relatedOrder,
            externalTransactionId: transaction.externalTransactionId,
            metadata: transaction.metadata,
            createdAt: transaction.createdAt,
            processedAt: transaction.processedAt,
            failureReason: transaction.failureReason
        }
    }, 'Transaction retrieved successfully');
});
