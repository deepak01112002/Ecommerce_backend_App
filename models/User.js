const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Removed embedded address schema - now using separate Address model

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    phone: {
        type: String,
        trim: true,
        index: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        index: true
    },
    avatar: {
        type: String
    },
    // Addresses now handled by separate Address model
    preferences: {
        newsletter: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' },
        currency: { type: String, default: 'INR' }
    },
    socialProfiles: {
        facebook: String,
        google: String,
        twitter: String
    },
    isGuest: {
        type: Boolean,
        default: false,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator', 'guest'],
        default: 'user',
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending'],
        default: 'active',
        index: true
    },
    emailVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        index: true
    },
    loginCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    orderCount: {
        type: Number,
        default: 0,
        min: 0
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    },

    // Notification Settings
    notificationSettings: {
        email: {
            orderUpdates: { type: Boolean, default: true },
            paymentUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false },
            newsletter: { type: Boolean, default: false }
        },
        sms: {
            orderUpdates: { type: Boolean, default: true },
            paymentUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false }
        },
        push: {
            orderUpdates: { type: Boolean, default: true },
            paymentUpdates: { type: Boolean, default: true },
            promotions: { type: Boolean, default: true },
            newsletter: { type: Boolean, default: false }
        }
    },

    // FCM Token for push notifications
    fcmToken: {
        type: String,
        default: null
    },
    fcmTokenUpdatedAt: {
        type: Date,
        default: null
    },

    // Admin FCM Token (for admin users)
    adminFcmToken: {
        type: String,
        default: null
    },
    adminFcmTokenUpdatedAt: {
        type: Date,
        default: null
    },

    // Device Tokens for Push Notifications
    deviceTokens: [String],

    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordExpires;
            delete ret.emailVerificationToken;
            delete ret.emailVerificationExpires;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for name (backward compatibility)
userSchema.virtual('name').get(function() {
    return this.fullName;
});

// Virtual for default address
userSchema.virtual('defaultAddress').get(function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Virtual for customer tier based on total spent
userSchema.virtual('customerTier').get(function() {
    if (this.totalSpent >= 50000) return 'platinum';
    if (this.totalSpent >= 25000) return 'gold';
    if (this.totalSpent >= 10000) return 'silver';
    return 'bronze';
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Post-save middleware to create wallet for new users
userSchema.post('save', async function(doc) {
    if (doc.isNew && !doc.wallet) {
        try {
            const Wallet = require('./Wallet');
            const wallet = await Wallet.create({ user: doc._id });

            // Update user with wallet reference
            await this.constructor.findByIdAndUpdate(doc._id, { wallet: wallet._id });
        } catch (error) {
            console.error('Error creating wallet for user:', error);
        }
    }
});

// Update login info
userSchema.methods.updateLoginInfo = function() {
    this.lastLogin = new Date();
    this.loginCount += 1;
    return this.save();
};

// Compare password method
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Add address method
userSchema.methods.addAddress = function(addressData) {
    // If this is the first address or marked as default, make it default
    if (this.addresses.length === 0 || addressData.isDefault) {
        this.addresses.forEach(addr => addr.isDefault = false);
        addressData.isDefault = true;
    }
    this.addresses.push(addressData);
    return this.save();
};

// Update address method
userSchema.methods.updateAddress = function(addressId, updateData) {
    const address = this.addresses.id(addressId);
    if (!address) throw new Error('Address not found');

    // If setting as default, unset others
    if (updateData.isDefault) {
        this.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(address, updateData);
    return this.save();
};

// Remove address method
userSchema.methods.removeAddress = function(addressId) {
    const address = this.addresses.id(addressId);
    if (!address) throw new Error('Address not found');

    const wasDefault = address.isDefault;
    address.remove();

    // If removed address was default, make first remaining address default
    if (wasDefault && this.addresses.length > 0) {
        this.addresses[0].isDefault = true;
    }

    return this.save();
};

// Add loyalty points
userSchema.methods.addLoyaltyPoints = function(points) {
    this.loyaltyPoints += points;
    return this.save();
};

// Use loyalty points
userSchema.methods.useLoyaltyPoints = function(points) {
    if (this.loyaltyPoints < points) {
        throw new Error('Insufficient loyalty points');
    }
    this.loyaltyPoints -= points;
    return this.save();
};

// Update spending and order count
userSchema.methods.updatePurchaseStats = function(orderAmount) {
    this.totalSpent += orderAmount;
    this.orderCount += 1;

    // Award loyalty points (1 point per 100 spent)
    const pointsEarned = Math.floor(orderAmount / 100);
    this.loyaltyPoints += pointsEarned;

    return this.save();
};

// Method to get user addresses
userSchema.methods.getAddresses = function(options = {}) {
    const Address = require('./Address');
    return Address.getUserAddresses(this._id, options);
};

// Method to get default address
userSchema.methods.getDefaultAddress = function() {
    const Address = require('./Address');
    return Address.getDefaultAddress(this._id);
};

// Method to get or create wallet
userSchema.methods.getWallet = async function() {
    const Wallet = require('./Wallet');

    if (this.wallet) {
        return await Wallet.findById(this.wallet);
    }

    // Create wallet if doesn't exist
    const wallet = await Wallet.create({ user: this._id });
    this.wallet = wallet._id;
    await this.save();

    return wallet;
};

// Comprehensive indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ phone: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ status: 1, isActive: 1 });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ totalSpent: -1 });
userSchema.index({ loyaltyPoints: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ emailVerified: 1, isActive: 1 });

module.exports = mongoose.model('User', userSchema);