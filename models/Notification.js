const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Recipient Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Notification Content
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    
    // Notification Type
    type: {
        type: String,
        enum: [
            'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
            'payment_success', 'payment_failed', 'payment_pending',
            'wallet_credited', 'wallet_debited',
            'product_back_in_stock', 'product_price_drop',
            'coupon_available', 'coupon_expiring',
            'review_request', 'review_response',
            'account_created', 'password_changed', 'profile_updated',
            'system_maintenance', 'system_update',
            'promotional', 'marketing',
            'admin_alert', 'low_stock', 'new_order'
        ],
        required: true,
        index: true
    },
    
    // Priority Level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },
    
    // Related Entity
    relatedEntity: {
        entityType: {
            type: String,
            enum: ['order', 'product', 'payment', 'coupon', 'user', 'wallet', 'invoice', 'shipment']
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    
    // Notification Channels
    channels: {
        inApp: {
            enabled: { type: Boolean, default: true },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            read: { type: Boolean, default: false },
            readAt: Date
        },
        email: {
            enabled: { type: Boolean, default: false },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            emailId: String,
            error: String
        },
        sms: {
            enabled: { type: Boolean, default: false },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            phoneNumber: String,
            error: String
        },
        push: {
            enabled: { type: Boolean, default: false },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            deviceTokens: [String],
            error: String
        }
    },
    
    // Notification Data
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Action Button
    actionButton: {
        text: String,
        url: String,
        action: String
    },
    
    // Scheduling
    scheduledFor: {
        type: Date,
        index: true
    },
    isScheduled: {
        type: Boolean,
        default: false,
        index: true
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    
    // Expiry
    expiresAt: {
        type: Date,
        index: true
    },
    
    // Metadata
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ 'channels.inApp.read': 1, user: 1 });
notificationSchema.index({ scheduledFor: 1, isScheduled: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for formatted creation time
notificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
    const notification = new this(notificationData);
    
    // Set default expiry (30 days for most notifications)
    if (!notification.expiresAt) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        notification.expiresAt = expiryDate;
    }
    
    await notification.save();
    
    // Send notification immediately if not scheduled
    if (!notification.isScheduled) {
        await notification.send();
    }
    
    return notification;
};

// Static method to send bulk notifications
notificationSchema.statics.sendBulkNotifications = async function(users, notificationData) {
    const notifications = users.map(userId => ({
        ...notificationData,
        user: userId
    }));
    
    const createdNotifications = await this.insertMany(notifications);
    
    // Send all notifications
    for (const notification of createdNotifications) {
        await notification.send();
    }
    
    return createdNotifications;
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type
    } = options;
    
    const query = { user: userId, isActive: true };
    
    if (unreadOnly) {
        query['channels.inApp.read'] = false;
    }
    
    if (type) {
        query.type = type;
    }
    
    const notifications = await this.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await this.countDocuments(query);
    const unreadCount = await this.countDocuments({
        user: userId,
        'channels.inApp.read': false,
        isActive: true
    });
    
    return {
        notifications,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        },
        unreadCount
    };
};

// Instance method to send notification
notificationSchema.methods.send = async function() {
    try {
        // Send in-app notification (always enabled)
        if (this.channels.inApp.enabled) {
            this.channels.inApp.sent = true;
            this.channels.inApp.sentAt = new Date();
        }
        
        // Send email notification
        if (this.channels.email.enabled) {
            try {
                // Email service integration would go here
                // await EmailService.send(this.channels.email.emailId, this.title, this.message);
                this.channels.email.sent = true;
                this.channels.email.sentAt = new Date();
            } catch (error) {
                this.channels.email.error = error.message;
            }
        }
        
        // Send SMS notification
        if (this.channels.sms.enabled) {
            try {
                // SMS service integration would go here
                // await SMSService.send(this.channels.sms.phoneNumber, this.message);
                this.channels.sms.sent = true;
                this.channels.sms.sentAt = new Date();
            } catch (error) {
                this.channels.sms.error = error.message;
            }
        }
        
        // Send push notification
        if (this.channels.push.enabled && this.channels.push.deviceTokens.length > 0) {
            try {
                // Push notification service integration would go here
                // await PushService.send(this.channels.push.deviceTokens, this.title, this.message);
                this.channels.push.sent = true;
                this.channels.push.sentAt = new Date();
            } catch (error) {
                this.channels.push.error = error.message;
            }
        }
        
        this.status = 'sent';
        await this.save();
        
        return true;
    } catch (error) {
        this.status = 'failed';
        await this.save();
        throw error;
    }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
    this.channels.inApp.read = true;
    this.channels.inApp.readAt = new Date();
    await this.save();
    return this;
};

// Instance method to get formatted data
notificationSchema.methods.getFormattedData = function() {
    return {
        _id: this._id,
        title: this.title,
        message: this.message,
        type: this.type,
        priority: this.priority,
        relatedEntity: this.relatedEntity,
        channels: this.channels,
        data: this.data,
        actionButton: this.actionButton,
        status: this.status,
        timeAgo: this.timeAgo,
        isRead: this.channels.inApp.read,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('Notification', notificationSchema);
