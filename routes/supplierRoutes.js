const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// All supplier routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all suppliers
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('search').optional().isString().withMessage('Search must be string'),
        query('status').optional().isIn(['active', 'inactive', 'blocked', 'pending_approval']).withMessage('Invalid status'),
        query('type').optional().isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'service_provider']).withMessage('Invalid type'),
        query('sortBy').optional().isIn(['name', 'code', 'createdAt', 'performance.rating']).withMessage('Invalid sort field'),
        query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
        query('isApproved').optional().isBoolean().withMessage('isApproved must be boolean')
    ],
    validateRequest,
    supplierController.getAllSuppliers
);

// Get active suppliers
router.get('/active',
    [
        query('category').optional().isMongoId().withMessage('Invalid category ID'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ],
    validateRequest,
    supplierController.getActiveSuppliers
);

// Get supplier performance report
router.get('/performance-report',
    supplierController.getSupplierPerformanceReport
);

// Export suppliers to Excel
router.get('/export/excel',
    [
        query('status').optional().isIn(['active', 'inactive', 'blocked', 'pending_approval']).withMessage('Invalid status'),
        query('type').optional().isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'service_provider']).withMessage('Invalid type'),
        query('format').optional().isIn(['detailed', 'summary']).withMessage('Format must be detailed or summary')
    ],
    validateRequest,
    supplierController.exportSuppliersToExcel
);

// Get supplier analytics
router.get('/analytics',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    supplierController.getSupplierAnalytics
);

// Create new supplier
router.post('/',
    [
        body('name').notEmpty().withMessage('Supplier name is required'),
        body('type').isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'service_provider']).withMessage('Invalid supplier type'),
        body('contactInfo.primaryContact.name').optional().isString().withMessage('Primary contact name must be string'),
        body('contactInfo.primaryContact.phone').optional().isString().withMessage('Primary contact phone must be string'),
        body('contactInfo.primaryContact.email').optional().isEmail().withMessage('Invalid primary contact email'),
        body('contactInfo.companyEmail').optional().isEmail().withMessage('Invalid company email'),
        body('businessInfo.gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
        body('businessInfo.pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
        body('addresses').isArray({ min: 1 }).withMessage('At least one address is required'),
        body('addresses.*.type').isIn(['billing', 'shipping', 'office']).withMessage('Invalid address type'),
        body('addresses.*.street').notEmpty().withMessage('Street is required'),
        body('addresses.*.city').notEmpty().withMessage('City is required'),
        body('addresses.*.state').notEmpty().withMessage('State is required'),
        body('addresses.*.postalCode').notEmpty().withMessage('Postal code is required')
    ],
    validateRequest,
    supplierController.createSupplier
);

// Get single supplier
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid supplier ID')
    ],
    validateRequest,
    supplierController.getSupplier
);

// Update supplier
router.put('/:id',
    [
        param('id').isMongoId().withMessage('Invalid supplier ID'),
        body('name').optional().isString().withMessage('Supplier name must be string'),
        body('type').optional().isIn(['manufacturer', 'distributor', 'wholesaler', 'retailer', 'service_provider']).withMessage('Invalid supplier type'),
        body('contactInfo.companyEmail').optional().isEmail().withMessage('Invalid company email'),
        body('businessInfo.gstin').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GSTIN format'),
        body('businessInfo.pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format')
    ],
    validateRequest,
    supplierController.updateSupplier
);

// Delete supplier
router.delete('/:id',
    [
        param('id').isMongoId().withMessage('Invalid supplier ID')
    ],
    validateRequest,
    supplierController.deleteSupplier
);

// Approve supplier
router.patch('/:id/approve',
    [
        param('id').isMongoId().withMessage('Invalid supplier ID')
    ],
    validateRequest,
    supplierController.approveSupplier
);

// Update supplier performance
router.patch('/:id/performance',
    [
        param('id').isMongoId().withMessage('Invalid supplier ID'),
        body('orderData.isCompleted').isBoolean().withMessage('isCompleted must be boolean'),
        body('orderData.isCancelled').optional().isBoolean().withMessage('isCancelled must be boolean'),
        body('orderData.isOnTime').optional().isBoolean().withMessage('isOnTime must be boolean'),
        body('orderData.deliveryDays').optional().isInt({ min: 0 }).withMessage('Delivery days must be positive integer'),
        body('orderData.qualityRating').optional().isFloat({ min: 1, max: 5 }).withMessage('Quality rating must be between 1 and 5')
    ],
    validateRequest,
    supplierController.updateSupplierPerformance
);

// Update supplier financials
router.patch('/:id/financials',
    [
        param('id').isMongoId().withMessage('Invalid supplier ID'),
        body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive number'),
        body('type').isIn(['purchase', 'payment']).withMessage('Type must be purchase or payment')
    ],
    validateRequest,
    supplierController.updateSupplierFinancials
);

module.exports = router;
