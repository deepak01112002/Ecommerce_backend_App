const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All notification routes require authentication
router.use(authMiddleware);

// User notification routes
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean'),
        query('type').optional().isString().withMessage('Type must be string')
    ],
    validateRequest,
    notificationController.getUserNotifications
);

router.get('/settings',
    notificationController.getNotificationSettings
);

router.put('/settings',
    [
        body('settings').isObject().withMessage('Settings must be an object')
    ],
    validateRequest,
    notificationController.updateNotificationSettings
);

router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid notification ID')
    ],
    validateRequest,
    notificationController.getNotification
);

router.patch('/:id/read',
    [
        param('id').isMongoId().withMessage('Invalid notification ID')
    ],
    validateRequest,
    notificationController.markAsRead
);

router.patch('/mark-all-read',
    notificationController.markAllAsRead
);

router.delete('/:id',
    [
        param('id').isMongoId().withMessage('Invalid notification ID')
    ],
    validateRequest,
    notificationController.deleteNotification
);

// FCM Token Management Routes
router.post('/fcm-token',
    [
        body('fcmToken').notEmpty().withMessage('FCM token is required')
    ],
    validateRequest,
    notificationController.saveFCMToken
);

router.delete('/fcm-token',
    notificationController.removeFCMToken
);

// Admin notification routes
router.use(adminMiddleware);

router.post('/',
    [
        body('users').isArray({ min: 1 }).withMessage('Users array is required'),
        body('title').notEmpty().withMessage('Title is required'),
        body('message').notEmpty().withMessage('Message is required'),
        body('type').notEmpty().withMessage('Type is required'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
    ],
    validateRequest,
    notificationController.createNotification
);

router.get('/admin/all',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('type').optional().isString().withMessage('Type must be string'),
        query('status').optional().isString().withMessage('Status must be string'),
        query('priority').optional().isString().withMessage('Priority must be string')
    ],
    validateRequest,
    notificationController.getAllNotifications
);

router.get('/admin/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    notificationController.getNotificationAnalytics
);

// Admin FCM Token Management
router.post('/admin/fcm-token',
    [
        body('fcmToken').notEmpty().withMessage('FCM token is required')
    ],
    validateRequest,
    notificationController.saveAdminFCMToken
);

router.delete('/admin/fcm-token',
    notificationController.removeAdminFCMToken
);

// Send push notification to all admins
router.post('/admin/broadcast',
    [
        body('title').notEmpty().withMessage('Title is required'),
        body('body').notEmpty().withMessage('Body is required'),
        body('type').optional().isString().withMessage('Type must be string'),
        body('data').optional().isObject().withMessage('Data must be object')
    ],
    validateRequest,
    notificationController.broadcastToAdmins
);

// Test notification endpoint
router.post('/test', async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token) {
      return res.error('FCM token is required', [], 400);
    }

    console.log('🧪 Testing notification to token:', token.substring(0, 20) + '...');

    const firebaseService = require('../services/firebaseService');
    const result = await firebaseService.sendToDevice(
      token,
      {
        title: title || 'Test Notification',
        body: body || 'This is a test notification from admin panel'
      },
      {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    );

    console.log('🧪 Test notification result:', result);

    if (result.success) {
      res.success('Test notification sent successfully', result);
    } else {
      res.error('Failed to send test notification', [result.error], 500);
    }
  } catch (error) {
    console.error('❌ Test notification error:', error);
    res.error('Failed to send test notification', [error.message], 500);
  }
});

// Debug endpoint to check admin tokens
router.get('/debug/admin-tokens', async (req, res) => {
  try {
    const User = require('../models/User');

    // Get all admin users with FCM tokens
    const admins = await User.find({
      role: 'admin',
      adminFcmToken: { $exists: true, $ne: null }
    }).select('adminFcmToken firstName lastName email');

    console.log('🔍 Debug: Found admin tokens:', {
      count: admins.length,
      admins: admins.map(admin => ({
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        tokenPreview: admin.adminFcmToken ? admin.adminFcmToken.substring(0, 20) + '...' : 'No token'
      }))
    });

    res.success('Admin tokens retrieved', {
      count: admins.length,
      tokens: admins.map(admin => ({
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        token: admin.adminFcmToken,
        tokenPreview: admin.adminFcmToken ? admin.adminFcmToken.substring(0, 20) + '...' : 'No token'
      }))
    });
  } catch (error) {
    console.error('❌ Debug admin tokens error:', error);
    res.error('Failed to get admin tokens', [error.message], 500);
  }
});

module.exports = router;
