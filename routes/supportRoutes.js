const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All support routes require authentication
router.use(authMiddleware);

// User support routes
router.post('/tickets',
    [
        body('subject').notEmpty().withMessage('Subject is required').isLength({ max: 200 }).withMessage('Subject must be less than 200 characters'),
        body('description').notEmpty().withMessage('Description is required'),
        body('category').isIn(['order_issue', 'payment_issue', 'shipping_issue', 'product_issue', 'return_refund', 'account_issue', 'technical_issue', 'billing_issue', 'complaint', 'suggestion', 'general_inquiry', 'other']).withMessage('Invalid category'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
        body('relatedEntity.entityType').optional().isIn(['order', 'product', 'payment', 'return', 'shipment', 'invoice']).withMessage('Invalid entity type'),
        body('relatedEntity.entityId').optional().isMongoId().withMessage('Invalid entity ID')
    ],
    validateRequest,
    supportController.createTicket
);

router.get('/tickets',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('status').optional().isString().withMessage('Status must be string'),
        query('category').optional().isString().withMessage('Category must be string')
    ],
    validateRequest,
    supportController.getUserTickets
);

router.get('/tickets/:id',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID')
    ],
    validateRequest,
    supportController.getTicket
);

router.post('/tickets/:id/messages',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID'),
        body('message').notEmpty().withMessage('Message is required')
    ],
    validateRequest,
    supportController.addMessage
);

// Admin support routes
router.use(adminMiddleware);

router.get('/admin/dashboard',
    supportController.getSupportDashboard
);

router.get('/admin/tickets',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isString().withMessage('Status must be string'),
        query('category').optional().isString().withMessage('Category must be string'),
        query('priority').optional().isString().withMessage('Priority must be string'),
        query('assignedTo').optional().isMongoId().withMessage('Invalid assigned to ID'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('search').optional().isString().withMessage('Search must be string')
    ],
    validateRequest,
    supportController.getAllTickets
);

router.patch('/admin/tickets/:id/assign',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID'),
        body('assignedTo').isMongoId().withMessage('Valid assigned to ID is required')
    ],
    validateRequest,
    supportController.assignTicket
);

router.post('/admin/tickets/:id/messages',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID'),
        body('message').notEmpty().withMessage('Message is required')
    ],
    validateRequest,
    supportController.addAgentMessage
);

router.patch('/admin/tickets/:id/resolve',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID'),
        body('notes').notEmpty().withMessage('Resolution notes are required'),
        body('type').optional().isIn(['solved', 'workaround', 'duplicate', 'not_reproducible', 'wont_fix']).withMessage('Invalid resolution type')
    ],
    validateRequest,
    supportController.resolveTicket
);

router.patch('/admin/tickets/:id/close',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID'),
        body('reason').optional().isString().withMessage('Reason must be string')
    ],
    validateRequest,
    supportController.closeTicket
);

router.patch('/admin/tickets/:id/escalate',
    [
        param('id').isMongoId().withMessage('Invalid ticket ID'),
        body('escalatedTo').isMongoId().withMessage('Valid escalated to ID is required'),
        body('reason').notEmpty().withMessage('Escalation reason is required')
    ],
    validateRequest,
    supportController.escalateTicket
);

router.get('/admin/statistics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    supportController.getTicketStatistics
);

module.exports = router;
