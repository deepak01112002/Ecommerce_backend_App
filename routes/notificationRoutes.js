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

module.exports = router;
