const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    transactionId: {
        type: String,
        unique: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01,
        set: function(value) {
            return Math.round(value * 100) / 100; // Round to 2 decimal places
        }
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    category: {
        type: String,
        enum: [
            'order_payment',      // Payment for order
            'order_refund',       // Refund from order
            'wallet_topup',       // Manual wallet top-up
            'cashback',           // Cashback credit
            'referral_bonus',     // Referral bonus
            'loyalty_reward',     // Loyalty points conversion
            'admin_adjustment',   // Admin manual adjustment
            'penalty',            // Penalty deduction
            'withdrawal',         // Wallet withdrawal
            'other'
        ],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled', 'reversed'],
        default: 'completed',
        index: true
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'upi', 'card', 'netbanking', 'cash', 'admin', 'system'],
        default: 'wallet'
    },
    relatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    relatedRefund: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Refund'
    },
    externalTransactionId: {
        type: String,
        trim: true
    },
    externalReference: {
        type: String,
        trim: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    processedAt: {
        type: Date,
        default: Date.now
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    failureReason: {
        type: String,
        trim: true
    },
    isReversible: {
        type: Boolean,
        default: true
    },
    reversedAt: {
        type: Date
    },
    reversedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reversalTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
walletTransactionSchema.index({ wallet: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ category: 1, createdAt: -1 });
walletTransactionSchema.index({ relatedOrder: 1 });
walletTransactionSchema.index({ transactionId: 1 });

// Virtual for formatted amount
walletTransactionSchema.virtual('formattedAmount').get(function() {
    const sign = this.type === 'credit' ? '+' : '-';
    return `${sign}₹${this.amount.toFixed(2)}`;
});

// Virtual for display status
walletTransactionSchema.virtual('displayStatus').get(function() {
    const statusMap = {
        'pending': 'Pending',
        'completed': 'Completed',
        'failed': 'Failed',
        'cancelled': 'Cancelled',
        'reversed': 'Reversed'
    };
    return statusMap[this.status] || this.status;
});

// Virtual for display category
walletTransactionSchema.virtual('displayCategory').get(function() {
    const categoryMap = {
        'order_payment': 'Order Payment',
        'order_refund': 'Order Refund',
        'wallet_topup': 'Wallet Top-up',
        'cashback': 'Cashback',
        'referral_bonus': 'Referral Bonus',
        'loyalty_reward': 'Loyalty Reward',
        'admin_adjustment': 'Admin Adjustment',
        'penalty': 'Penalty',
        'withdrawal': 'Withdrawal',
        'other': 'Other'
    };
    return categoryMap[this.category] || this.category;
});

// Pre-save middleware to generate transaction ID
walletTransactionSchema.pre('save', function(next) {
    if (this.isNew && !this.transactionId) {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TXN${timestamp}${random}`;
    }
    next();
});

// Static method to get user transaction history
walletTransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
    const query = { user: userId };
    
    if (options.type) {
        query.type = options.type;
    }
    
    if (options.category) {
        query.category = options.category;
    }
    
    if (options.status) {
        query.status = options.status;
    }
    
    if (options.dateFrom || options.dateTo) {
        query.createdAt = {};
        if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
        if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
    }
    
    return this.find(query)
        .populate('relatedOrder', 'orderNumber status')
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0);
};

// Static method to get transaction summary
walletTransactionSchema.statics.getTransactionSummary = async function(userId, period = 'month') {
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const summary = await this.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate },
                status: 'completed'
            }
        },
        {
            $group: {
                _id: '$type',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {
        period,
        startDate,
        endDate: now,
        totalCredits: 0,
        totalDebits: 0,
        creditCount: 0,
        debitCount: 0,
        netAmount: 0
    };
    
    summary.forEach(item => {
        if (item._id === 'credit') {
            result.totalCredits = item.totalAmount;
            result.creditCount = item.count;
        } else if (item._id === 'debit') {
            result.totalDebits = item.totalAmount;
            result.debitCount = item.count;
        }
    });
    
    result.netAmount = result.totalCredits - result.totalDebits;
    
    return result;
};

// Instance method to reverse transaction
walletTransactionSchema.methods.reverse = async function(reversedBy, reason) {
    if (!this.isReversible) {
        throw new Error('Transaction is not reversible');
    }
    
    if (this.status !== 'completed') {
        throw new Error('Only completed transactions can be reversed');
    }
    
    const Wallet = require('./Wallet');
    const wallet = await Wallet.findById(this.wallet);
    
    if (!wallet) {
        throw new Error('Wallet not found');
    }
    
    // Create reverse transaction
    const reverseType = this.type === 'credit' ? 'debit' : 'credit';
    const reverseTransaction = new this.constructor({
        wallet: this.wallet,
        user: this.user,
        type: reverseType,
        amount: this.amount,
        balanceAfter: this.type === 'credit' ? wallet.balance - this.amount : wallet.balance + this.amount,
        description: `Reversal of transaction ${this.transactionId} - ${reason}`,
        category: 'admin_adjustment',
        status: 'completed',
        paymentMethod: 'system',
        processedBy: reversedBy,
        metadata: {
            originalTransactionId: this.transactionId,
            reversalReason: reason
        }
    });
    
    await reverseTransaction.save();
    
    // Update original transaction
    this.status = 'reversed';
    this.reversedAt = new Date();
    this.reversedBy = reversedBy;
    this.reversalTransactionId = reverseTransaction._id;
    
    await this.save();
    
    // Update wallet balance
    if (this.type === 'credit') {
        await wallet.debit(this.amount, {
            description: `Reversal of credit transaction ${this.transactionId}`,
            category: 'admin_adjustment'
        });
    } else {
        await wallet.credit(this.amount, {
            description: `Reversal of debit transaction ${this.transactionId}`,
            category: 'admin_adjustment'
        });
    }
    
    return reverseTransaction;
};

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
