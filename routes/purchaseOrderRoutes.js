const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const purchaseOrderController = require('../controllers/purchaseOrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All purchase order routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all purchase orders
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isString().withMessage('Search must be string'),
        query('status').optional().isIn(['draft', 'sent', 'acknowledged', 'partial', 'completed', 'cancelled', 'closed']).withMessage('Invalid status'),
        query('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('sortBy').optional().isIn(['poDate', 'expectedDeliveryDate', 'grandTotal', 'status']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
        query('approvalStatus').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid approval status')
    ],
    validateRequest,
    purchaseOrderController.getAllPurchaseOrders
);

// Get overdue purchase orders
router.get('/overdue',
    purchaseOrderController.getOverduePurchaseOrders
);

// Get POs needing approval
router.get('/pending-approval',
    purchaseOrderController.getPOsNeedingApproval
);

// Get PO summary
router.get('/summary',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    purchaseOrderController.getPOSummary
);

// Export POs to Excel
router.get('/export/excel',
    [
        query('status').optional().isIn(['draft', 'sent', 'acknowledged', 'partial', 'completed', 'cancelled', 'closed']).withMessage('Invalid status'),
        query('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
        query('format').optional().isIn(['detailed', 'summary']).withMessage('Format must be detailed or summary')
    ],
    validateRequest,
    purchaseOrderController.exportPOsToExcel
);

// Get PO analytics
router.get('/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    purchaseOrderController.getPOAnalytics
);

// Create new purchase order
router.post('/',
    [
        body('supplier').isMongoId().withMessage('Valid supplier ID is required'),
        body('expectedDeliveryDate').isISO8601().withMessage('Valid expected delivery date is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
        body('items.*.productName').notEmpty().withMessage('Product name is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
        body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive number'),
        body('items.*.gstRate').optional().isFloat({ min: 0, max: 100 }).withMessage('GST rate must be between 0 and 100'),
        body('deliveryAddress.street').notEmpty().withMessage('Delivery street is required'),
        body('deliveryAddress.city').notEmpty().withMessage('Delivery city is required'),
        body('deliveryAddress.state').notEmpty().withMessage('Delivery state is required'),
        body('deliveryAddress.postalCode').notEmpty().withMessage('Delivery postal code is required'),
        body('paymentInfo.paymentTerms').optional().isIn(['cash', 'credit', 'advance', 'cod']).withMessage('Invalid payment terms'),
        body('paymentInfo.creditDays').optional().isInt({ min: 0 }).withMessage('Credit days must be non-negative integer'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
    ],
    validateRequest,
    purchaseOrderController.createPurchaseOrder
);

// Get single purchase order
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID')
    ],
    validateRequest,
    purchaseOrderController.getPurchaseOrder
);

// Update purchase order
router.put('/:id',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID'),
        body('expectedDeliveryDate').optional().isISO8601().withMessage('Invalid expected delivery date format'),
        body('items').optional().isArray({ min: 1 }).withMessage('Items must be array with at least one item'),
        body('items.*.quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
        body('items.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price must be positive number'),
        body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
    ],
    validateRequest,
    purchaseOrderController.updatePurchaseOrder
);

// Approve purchase order
router.patch('/:id/approve',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID')
    ],
    validateRequest,
    purchaseOrderController.approvePurchaseOrder
);

// Reject purchase order
router.patch('/:id/reject',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID'),
        body('reason').notEmpty().withMessage('Rejection reason is required')
    ],
    validateRequest,
    purchaseOrderController.rejectPurchaseOrder
);

// Receive items
router.patch('/:id/receive-items',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID'),
        body('receivedItems').isArray({ min: 1 }).withMessage('Received items must be array with at least one item'),
        body('receivedItems.*.itemId').isMongoId().withMessage('Valid item ID is required'),
        body('receivedItems.*.quantity').isInt({ min: 1 }).withMessage('Received quantity must be positive integer')
    ],
    validateRequest,
    purchaseOrderController.receiveItems
);

// Cancel purchase order
router.patch('/:id/cancel',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID'),
        body('reason').notEmpty().withMessage('Cancellation reason is required')
    ],
    validateRequest,
    purchaseOrderController.cancelPurchaseOrder
);

// Generate PO PDF
router.get('/:id/pdf',
    [
        param('id').isMongoId().withMessage('Invalid purchase order ID')
    ],
    validateRequest,
    purchaseOrderController.generatePOPDF
);

module.exports = router;
