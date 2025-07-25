const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0,
        set: function(value) {
            return Math.round(value * 100) / 100; // Round to 2 decimal places
        }
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedReason: {
        type: String,
        trim: true
    },
    blockedAt: {
        type: Date
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastTransactionAt: {
        type: Date
    },
    totalCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    totalDebits: {
        type: Number,
        default: 0,
        min: 0
    },
    transactionCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
walletSchema.index({ user: 1, isActive: 1 });
walletSchema.index({ balance: 1 });

// Virtual for formatted balance
walletSchema.virtual('formattedBalance').get(function() {
    return `₹${this.balance.toFixed(2)}`;
});

// Virtual for wallet status
walletSchema.virtual('status').get(function() {
    if (this.isBlocked) return 'blocked';
    if (!this.isActive) return 'inactive';
    return 'active';
});

// Static method to get or create wallet
walletSchema.statics.getOrCreateWallet = async function(userId) {
    let wallet = await this.findOne({ user: userId });
    
    if (!wallet) {
        wallet = await this.create({ user: userId });
    }
    
    return wallet;
};

// Instance method to check if sufficient balance
walletSchema.methods.hasSufficientBalance = function(amount) {
    return this.balance >= amount && this.isActive && !this.isBlocked;
};

// Instance method to add money (credit)
walletSchema.methods.credit = async function(amount, transactionData = {}) {
    if (amount <= 0) {
        throw new Error('Credit amount must be positive');
    }
    
    if (this.isBlocked) {
        throw new Error('Wallet is blocked');
    }
    
    // Update wallet balance and stats
    this.balance += amount;
    this.totalCredits += amount;
    this.transactionCount += 1;
    this.lastTransactionAt = new Date();
    
    await this.save();
    
    // Create transaction record
    const WalletTransaction = require('./WalletTransaction');
    const transaction = await WalletTransaction.create({
        wallet: this._id,
        user: this.user,
        type: 'credit',
        amount: amount,
        balanceAfter: this.balance,
        ...transactionData
    });
    
    return { wallet: this, transaction };
};

// Instance method to deduct money (debit)
walletSchema.methods.debit = async function(amount, transactionData = {}) {
    if (amount <= 0) {
        throw new Error('Debit amount must be positive');
    }
    
    if (!this.hasSufficientBalance(amount)) {
        throw new Error('Insufficient wallet balance');
    }
    
    // Update wallet balance and stats
    this.balance -= amount;
    this.totalDebits += amount;
    this.transactionCount += 1;
    this.lastTransactionAt = new Date();
    
    await this.save();
    
    // Create transaction record
    const WalletTransaction = require('./WalletTransaction');
    const transaction = await WalletTransaction.create({
        wallet: this._id,
        user: this.user,
        type: 'debit',
        amount: amount,
        balanceAfter: this.balance,
        ...transactionData
    });
    
    return { wallet: this, transaction };
};

// Instance method to block wallet
walletSchema.methods.block = async function(reason, blockedBy) {
    this.isBlocked = true;
    this.blockedReason = reason;
    this.blockedAt = new Date();
    this.blockedBy = blockedBy;
    
    return this.save();
};

// Instance method to unblock wallet
walletSchema.methods.unblock = async function() {
    this.isBlocked = false;
    this.blockedReason = undefined;
    this.blockedAt = undefined;
    this.blockedBy = undefined;
    
    return this.save();
};

// Instance method to get transaction history
walletSchema.methods.getTransactionHistory = function(options = {}) {
    const WalletTransaction = require('./WalletTransaction');
    
    const query = { wallet: this._id };
    
    if (options.type) {
        query.type = options.type;
    }
    
    if (options.status) {
        query.status = options.status;
    }
    
    if (options.dateFrom || options.dateTo) {
        query.createdAt = {};
        if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
        if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
    }
    
    return WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .skip(options.skip || 0)
        .populate('relatedOrder', 'orderNumber')
        .populate('relatedRefund', 'refundId');
};

module.exports = mongoose.model('Wallet', walletSchema);
