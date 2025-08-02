const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorHandler');
const firebaseService = require('../services/firebaseService');

// Get user notifications
exports.getUserNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type
    } = req.query;
    
    const result = await Notification.getUserNotifications(req.user._id, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true',
        type
    });
    
    const formattedNotifications = result.notifications.map(notification => 
        notification.getFormattedData()
    );
    
    res.success({
        notifications: formattedNotifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount
    }, 'Notifications retrieved successfully');
});

// Get single notification
exports.getNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
        _id: id,
        user: req.user._id,
        isActive: true
    });
    
    if (!notification) {
        return res.error('Notification not found', [], 404);
    }
    
    res.success({
        notification: notification.getFormattedData()
    }, 'Notification retrieved successfully');
});

// Mark notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
        _id: id,
        user: req.user._id,
        isActive: true
    });
    
    if (!notification) {
        return res.error('Notification not found', [], 404);
    }
    
    await notification.markAsRead();
    
    res.success({
        notification: notification.getFormattedData()
    }, 'Notification marked as read');
});

// Mark all notifications as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            user: req.user._id,
            'channels.inApp.read': false,
            isActive: true
        },
        {
            'channels.inApp.read': true,
            'channels.inApp.readAt': new Date()
        }
    );
    
    res.success({
        message: 'All notifications marked as read'
    }, 'All notifications marked as read');
});

// Delete notification
exports.deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const notification = await Notification.findOne({
        _id: id,
        user: req.user._id
    });
    
    if (!notification) {
        return res.error('Notification not found', [], 404);
    }
    
    notification.isActive = false;
    await notification.save();
    
    res.success({
        message: 'Notification deleted successfully'
    }, 'Notification deleted successfully');
});

// Get notification settings
exports.getNotificationSettings = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('notificationSettings');
    
    const defaultSettings = {
        email: {
            orderUpdates: true,
            paymentUpdates: true,
            promotions: false,
            newsletter: false
        },
        sms: {
            orderUpdates: true,
            paymentUpdates: true,
            promotions: false
        },
        push: {
            orderUpdates: true,
            paymentUpdates: true,
            promotions: true,
            newsletter: false
        }
    };
    
    res.success({
        settings: user.notificationSettings || defaultSettings
    }, 'Notification settings retrieved successfully');
});

// Update notification settings
exports.updateNotificationSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body;
    
    const user = await User.findById(req.user._id);
    user.notificationSettings = { ...user.notificationSettings, ...settings };
    await user.save();
    
    res.success({
        settings: user.notificationSettings
    }, 'Notification settings updated successfully');
});

// Admin: Create notification
exports.createNotification = asyncHandler(async (req, res) => {
    const {
        users,
        title,
        message,
        type,
        priority = 'medium',
        channels = { inApp: { enabled: true } },
        data = {},
        actionButton,
        scheduledFor
    } = req.body;
    
    if (users && users.length > 0) {
        // Bulk notification
        const notifications = await Notification.sendBulkNotifications(users, {
            title,
            message,
            type,
            priority,
            channels,
            data,
            actionButton,
            scheduledFor,
            isScheduled: !!scheduledFor,
            createdBy: req.user._id
        });
        
        res.success({
            notifications: notifications.map(n => n.getFormattedData()),
            count: notifications.length
        }, 'Bulk notifications created successfully', 201);
    } else {
        return res.error('Users array is required', [], 400);
    }
});

// Admin: Get all notifications
exports.getAllNotifications = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        type,
        status,
        priority,
        startDate,
        endDate
    } = req.query;
    
    const query = { isActive: true };
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const notifications = await Notification.find(query)
        .populate('user', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.success({
        notifications: notifications.map(n => n.getFormattedData()),
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'All notifications retrieved successfully');
});

// Admin: Get notification analytics
exports.getNotificationAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const matchStage = { isActive: true };
    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    
    // Type-wise distribution
    const typeDistribution = await Notification.aggregate([
        { $match: matchStage },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
    
    // Status distribution
    const statusDistribution = await Notification.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Channel performance
    const channelPerformance = await Notification.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalNotifications: { $sum: 1 },
                inAppSent: { $sum: { $cond: ['$channels.inApp.sent', 1, 0] } },
                emailSent: { $sum: { $cond: ['$channels.email.sent', 1, 0] } },
                smsSent: { $sum: { $cond: ['$channels.sms.sent', 1, 0] } },
                pushSent: { $sum: { $cond: ['$channels.push.sent', 1, 0] } },
                inAppRead: { $sum: { $cond: ['$channels.inApp.read', 1, 0] } }
            }
        }
    ]);
    
    // Daily trend
    const dailyTrend = await Notification.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                },
                count: { $sum: 1 },
                readCount: { $sum: { $cond: ['$channels.inApp.read', 1, 0] } }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    const performance = channelPerformance[0] || {
        totalNotifications: 0,
        inAppSent: 0,
        emailSent: 0,
        smsSent: 0,
        pushSent: 0,
        inAppRead: 0
    };
    
    // Calculate read rate
    performance.readRate = performance.inAppSent > 0 ? 
        (performance.inAppRead / performance.inAppSent * 100).toFixed(2) : 0;
    
    res.success({
        analytics: {
            summary: performance,
            typeDistribution,
            statusDistribution,
            dailyTrend
        }
    }, 'Notification analytics retrieved successfully');
});

// Helper function to create order notification
exports.createOrderNotification = async (userId, orderId, type, customData = {}) => {
    const notificationData = {
        user: userId,
        type,
        relatedEntity: {
            entityType: 'order',
            entityId: orderId
        },
        channels: {
            inApp: { enabled: true },
            email: { enabled: true },
            sms: { enabled: type === 'order_delivered' }
        },
        data: customData
    };
    
    switch (type) {
        case 'order_placed':
            notificationData.title = 'Order Placed Successfully';
            notificationData.message = `Your order #${customData.orderNumber} has been placed successfully.`;
            notificationData.actionButton = {
                text: 'View Order',
                url: `/orders/${orderId}`
            };
            break;
        case 'order_confirmed':
            notificationData.title = 'Order Confirmed';
            notificationData.message = `Your order #${customData.orderNumber} has been confirmed and is being processed.`;
            break;
        case 'order_shipped':
            notificationData.title = 'Order Shipped';
            notificationData.message = `Your order #${customData.orderNumber} has been shipped. Track your order for updates.`;
            notificationData.actionButton = {
                text: 'Track Order',
                url: `/orders/${orderId}/track`
            };
            break;
        case 'order_delivered':
            notificationData.title = 'Order Delivered';
            notificationData.message = `Your order #${customData.orderNumber} has been delivered successfully.`;
            notificationData.actionButton = {
                text: 'Rate & Review',
                url: `/orders/${orderId}/review`
            };
            break;
    }
    
    return await Notification.createNotification(notificationData);
};

// FCM Token Management
exports.saveFCMToken = asyncHandler(async (req, res) => {
    const { fcmToken } = req.body;
    const userId = req.user._id;

    try {
        // Update user with FCM token
        await User.findByIdAndUpdate(userId, {
            fcmToken: fcmToken,
            fcmTokenUpdatedAt: new Date()
        });

        res.success({
            message: 'FCM token saved successfully'
        }, 'FCM token registered');
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.error('Failed to save FCM token', [], 500);
    }
});

exports.removeFCMToken = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        // Remove FCM token from user
        await User.findByIdAndUpdate(userId, {
            $unset: { fcmToken: 1, fcmTokenUpdatedAt: 1 }
        });

        res.success({
            message: 'FCM token removed successfully'
        }, 'FCM token unregistered');
    } catch (error) {
        console.error('Error removing FCM token:', error);
        res.error('Failed to remove FCM token', [], 500);
    }
});

// Admin FCM Token Management
exports.saveAdminFCMToken = asyncHandler(async (req, res) => {
    const { fcmToken } = req.body;
    const adminId = req.user._id;

    try {
        // Update admin user with FCM token
        await User.findByIdAndUpdate(adminId, {
            adminFcmToken: fcmToken,
            adminFcmTokenUpdatedAt: new Date()
        });

        res.success({
            message: 'Admin FCM token saved successfully'
        }, 'Admin FCM token registered');
    } catch (error) {
        console.error('Error saving admin FCM token:', error);
        res.error('Failed to save admin FCM token', [], 500);
    }
});

exports.removeAdminFCMToken = asyncHandler(async (req, res) => {
    const adminId = req.user._id;

    try {
        // Remove admin FCM token
        await User.findByIdAndUpdate(adminId, {
            $unset: { adminFcmToken: 1, adminFcmTokenUpdatedAt: 1 }
        });

        res.success({
            message: 'Admin FCM token removed successfully'
        }, 'Admin FCM token unregistered');
    } catch (error) {
        console.error('Error removing admin FCM token:', error);
        res.error('Failed to remove admin FCM token', [], 500);
    }
});

// Broadcast notification to all admins
exports.broadcastToAdmins = asyncHandler(async (req, res) => {
    const { title, body, type = 'system', data = {} } = req.body;

    try {
        // Get all admin users with FCM tokens
        const admins = await User.find({
            role: 'admin',
            adminFcmToken: { $exists: true, $ne: null }
        }).select('adminFcmToken');

        if (admins.length === 0) {
            return res.error('No admin devices found for notification', [], 404);
        }

        const adminTokens = admins.map(admin => admin.adminFcmToken);

        // Send notification via Firebase
        const result = await firebaseService.sendToMultipleDevices(
            adminTokens,
            { title, body },
            { type, ...data }
        );

        if (result.success) {
            res.success({
                message: 'Notification sent to admins',
                successCount: result.successCount,
                failureCount: result.failureCount,
                failedTokens: result.failedTokens || []
            }, 'Broadcast notification sent');
        } else {
            res.error('Failed to send notification', [result.error], 500);
        }
    } catch (error) {
        console.error('Error broadcasting to admins:', error);
        res.error('Failed to broadcast notification', [], 500);
    }
});

module.exports = exports;
