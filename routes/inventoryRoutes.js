const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All inventory routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get inventory dashboard
router.get('/dashboard',
    inventoryController.getInventoryDashboard
);

// Get all inventory items
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isString().withMessage('Search must be string'),
        query('stockStatus').optional().isIn(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).withMessage('Invalid stock status'),
        query('category').optional().isMongoId().withMessage('Invalid category ID'),
        query('supplier').optional().isMongoId().withMessage('Invalid supplier ID'),
        query('sortBy').optional().isIn(['updatedAt', 'currentStock', 'stockStatus', 'totalStockValue']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
        query('lowStock').optional().isBoolean().withMessage('Low stock must be boolean'),
        query('needsReorder').optional().isBoolean().withMessage('Needs reorder must be boolean')
    ],
    validateRequest,
    inventoryController.getAllInventory
);

// Get low stock items
router.get('/low-stock',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validateRequest,
    inventoryController.getLowStockItems
);

// Get items needing reorder
router.get('/reorder-items',
    inventoryController.getReorderItems
);

// Generate reorder suggestions
router.get('/reorder-suggestions',
    inventoryController.generateReorderSuggestions
);

// Export inventory to Excel
router.get('/export/excel',
    [
        query('stockStatus').optional().isIn(['in_stock', 'low_stock', 'out_of_stock', 'discontinued']).withMessage('Invalid stock status'),
        query('category').optional().isMongoId().withMessage('Invalid category ID'),
        query('format').optional().isIn(['detailed', 'summary']).withMessage('Format must be detailed or summary')
    ],
    validateRequest,
    inventoryController.exportInventoryToExcel
);

// Get inventory analytics
router.get('/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    inventoryController.getInventoryAnalytics
);

// Get single inventory item
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid inventory ID')
    ],
    validateRequest,
    inventoryController.getInventoryItem
);

// Update inventory item
router.put('/:id',
    [
        param('id').isMongoId().withMessage('Invalid inventory ID'),
        body('minStockLevel').optional().isInt({ min: 0 }).withMessage('Min stock level must be positive integer'),
        body('maxStockLevel').optional().isInt({ min: 0 }).withMessage('Max stock level must be positive integer'),
        body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be positive integer'),
        body('reorderQuantity').optional().isInt({ min: 0 }).withMessage('Reorder quantity must be positive integer'),
        body('location.warehouse').optional().isString().withMessage('Warehouse must be string'),
        body('location.section').optional().isString().withMessage('Section must be string'),
        body('location.shelf').optional().isString().withMessage('Shelf must be string'),
        body('location.bin').optional().isString().withMessage('Bin must be string'),
        body('primarySupplier').optional().isMongoId().withMessage('Invalid supplier ID'),
        body('notes').optional().isString().withMessage('Notes must be string')
    ],
    validateRequest,
    inventoryController.updateInventoryItem
);

// Update stock (Stock In/Out)
router.patch('/:id/update-stock',
    [
        param('id').isMongoId().withMessage('Invalid inventory ID'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
        body('type').isIn(['in', 'out']).withMessage('Type must be in or out'),
        body('reference').notEmpty().withMessage('Reference is required'),
        body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be positive number'),
        body('reason').optional().isString().withMessage('Reason must be string')
    ],
    validateRequest,
    inventoryController.updateStock
);

// Reserve stock
router.patch('/:id/reserve-stock',
    [
        param('id').isMongoId().withMessage('Invalid inventory ID'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer')
    ],
    validateRequest,
    inventoryController.reserveStock
);

// Release reserved stock
router.patch('/:id/release-stock',
    [
        param('id').isMongoId().withMessage('Invalid inventory ID'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer')
    ],
    validateRequest,
    inventoryController.releaseReservedStock
);

// Perform stock count
router.patch('/:id/stock-count',
    [
        param('id').isMongoId().withMessage('Invalid inventory ID'),
        body('countedStock').isInt({ min: 0 }).withMessage('Counted stock must be non-negative integer')
    ],
    validateRequest,
    inventoryController.performStockCount
);

module.exports = router;
