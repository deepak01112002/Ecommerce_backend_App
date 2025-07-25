const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const returnController = require('../controllers/returnController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All return routes require authentication
router.use(authMiddleware);

// User return routes
router.post('/',
    [
        body('orderId').isMongoId().withMessage('Valid order ID is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
        body('items.*.returnReason').isIn(['defective', 'damaged', 'wrong_item', 'size_issue', 'color_issue', 'not_as_described', 'quality_issue', 'changed_mind', 'duplicate_order', 'late_delivery', 'other']).withMessage('Invalid return reason'),
        body('items.*.returnCondition').isIn(['new', 'used', 'damaged', 'defective']).withMessage('Invalid return condition'),
        body('returnType').isIn(['refund', 'exchange', 'store_credit']).withMessage('Invalid return type'),
        body('returnReason').isIn(['defective', 'damaged', 'wrong_item', 'size_issue', 'color_issue', 'not_as_described', 'quality_issue', 'changed_mind', 'duplicate_order', 'late_delivery', 'other']).withMessage('Invalid return reason'),
        body('pickupAddress.name').notEmpty().withMessage('Pickup address name is required'),
        body('pickupAddress.phone').notEmpty().withMessage('Pickup address phone is required'),
        body('pickupAddress.addressLine1').notEmpty().withMessage('Pickup address line 1 is required'),
        body('pickupAddress.city').notEmpty().withMessage('Pickup address city is required'),
        body('pickupAddress.state').notEmpty().withMessage('Pickup address state is required'),
        body('pickupAddress.postalCode').notEmpty().withMessage('Pickup address postal code is required')
    ],
    validateRequest,
    returnController.createReturnRequest
);

router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('status').optional().isString().withMessage('Status must be string'),
        query('returnType').optional().isIn(['refund', 'exchange', 'store_credit']).withMessage('Invalid return type')
    ],
    validateRequest,
    returnController.getUserReturns
);

router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid return ID')
    ],
    validateRequest,
    returnController.getReturn
);

// Admin return routes
router.use(adminMiddleware);

router.get('/admin/all',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isString().withMessage('Status must be string'),
        query('returnType').optional().isIn(['refund', 'exchange', 'store_credit']).withMessage('Invalid return type'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('search').optional().isString().withMessage('Search must be string')
    ],
    validateRequest,
    returnController.getAllReturns
);

router.patch('/:id/approve',
    [
        param('id').isMongoId().withMessage('Invalid return ID'),
        body('notes').optional().isString().withMessage('Notes must be string')
    ],
    validateRequest,
    returnController.approveReturn
);

router.patch('/:id/reject',
    [
        param('id').isMongoId().withMessage('Invalid return ID'),
        body('reason').notEmpty().withMessage('Rejection reason is required')
    ],
    validateRequest,
    returnController.rejectReturn
);

router.patch('/:id/schedule-pickup',
    [
        param('id').isMongoId().withMessage('Invalid return ID'),
        body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
        body('scheduledTimeSlot').notEmpty().withMessage('Time slot is required')
    ],
    validateRequest,
    returnController.schedulePickup
);

router.patch('/:id/complete',
    [
        param('id').isMongoId().withMessage('Invalid return ID'),
        body('refundData.method').isIn(['original_payment', 'wallet', 'bank_transfer', 'store_credit']).withMessage('Invalid refund method'),
        body('refundData.transactionId').optional().isString().withMessage('Transaction ID must be string')
    ],
    validateRequest,
    returnController.completeReturn
);

router.get('/admin/statistics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    returnController.getReturnStatistics
);

module.exports = router;
