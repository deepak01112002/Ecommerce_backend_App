const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const shippingController = require('../controllers/shippingController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateRequest } = require('../middlewares/errorHandler');

// Public webhook endpoint (no auth required)
router.post('/webhook/shiprocket', shippingController.handleWebhook);

// Check serviceability (public)
router.post('/check-serviceability',
    [
        body('pickupPostcode').notEmpty().withMessage('Pickup postcode is required'),
        body('deliveryPostcode').notEmpty().withMessage('Delivery postcode is required'),
        body('weight').isFloat({ min: 0.1 }).withMessage('Weight must be greater than 0'),
        body('codAmount').optional().isFloat({ min: 0 }).withMessage('COD amount must be positive')
    ],
    validateRequest,
    shippingController.checkServiceability
);

// Get delivery options (public)
router.get('/delivery-options',
    [
        query('state').notEmpty().withMessage('State is required'),
        query('city').notEmpty().withMessage('City is required'),
        query('postalCode').notEmpty().withMessage('Postal code is required'),
        query('weight').optional().isFloat({ min: 0.1 }).withMessage('Weight must be greater than 0'),
        query('codAmount').optional().isFloat({ min: 0 }).withMessage('COD amount must be positive'),
        query('orderValue').optional().isFloat({ min: 0 }).withMessage('Order value must be positive')
    ],
    validateRequest,
    shippingController.getDeliveryOptions
);

// Protected routes (require authentication)
router.use(authMiddleware);

// Get user's shipments
router.get('/my-shipments',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn([
            'pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery',
            'delivered', 'returned', 'cancelled', 'lost', 'damaged', 'rto_initiated', 'rto_delivered'
        ]).withMessage('Invalid status')
    ],
    validateRequest,
    (req, res, next) => {
        req.query.userId = req.user._id;
        next();
    },
    shippingController.getShipments
);

// Track shipment by AWB code
router.get('/track/:awbCode',
    [
        param('awbCode').notEmpty().withMessage('AWB code is required')
    ],
    validateRequest,
    shippingController.trackShipment
);

// Get single shipment details
router.get('/:id',
    [
        param('id').isMongoId().withMessage('Invalid shipment ID')
    ],
    validateRequest,
    shippingController.getShipment
);

// Admin routes (require admin privileges)
router.use(adminMiddleware);

// Get all shipments (admin)
router.get('/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn([
            'pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery',
            'delivered', 'returned', 'cancelled', 'lost', 'damaged', 'rto_initiated', 'rto_delivered'
        ]).withMessage('Invalid status'),
        query('courierName').optional().isString().withMessage('Courier name must be string'),
        query('userId').optional().isMongoId().withMessage('Invalid user ID'),
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    shippingController.getShipments
);

// Create shipment for order (admin)
router.post('/orders/:orderId/create-shipment',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('pickupLocation').optional().isString().withMessage('Pickup location must be string'),
        body('courierCompanyId').optional().isInt().withMessage('Courier company ID must be integer'),
        body('dimensions.length').optional().isFloat({ min: 1 }).withMessage('Length must be positive'),
        body('dimensions.breadth').optional().isFloat({ min: 1 }).withMessage('Breadth must be positive'),
        body('dimensions.height').optional().isFloat({ min: 1 }).withMessage('Height must be positive'),
        body('dimensions.weight').optional().isFloat({ min: 0.1 }).withMessage('Weight must be greater than 0')
    ],
    validateRequest,
    shippingController.createShipment
);

// Create shipment using new delivery service (admin)
router.post('/orders/:orderId/create-shipment-v2',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID'),
        body('deliveryOptionId').notEmpty().withMessage('Delivery option ID is required'),
        body('dimensions.length').optional().isFloat({ min: 1 }).withMessage('Length must be positive'),
        body('dimensions.breadth').optional().isFloat({ min: 1 }).withMessage('Breadth must be positive'),
        body('dimensions.height').optional().isFloat({ min: 1 }).withMessage('Height must be positive'),
        body('dimensions.weight').optional().isFloat({ min: 0.1 }).withMessage('Weight must be greater than 0')
    ],
    validateRequest,
    shippingController.createShipmentV2
);

// Cancel shipment (admin)
router.patch('/:id/cancel',
    [
        param('id').isMongoId().withMessage('Invalid shipment ID'),
        body('reason').optional().isString().withMessage('Reason must be string')
    ],
    validateRequest,
    shippingController.cancelShipment
);

// Generate pickup for shipments (admin)
router.post('/generate-pickup',
    [
        body('shipmentIds').isArray({ min: 1 }).withMessage('Shipment IDs array is required'),
        body('shipmentIds.*').isMongoId().withMessage('Invalid shipment ID'),
        body('pickupDate').optional().isISO8601().withMessage('Invalid pickup date format')
    ],
    validateRequest,
    shippingController.generatePickup
);

// Generate shipping labels (admin)
router.post('/generate-labels',
    [
        body('shipmentIds').isArray({ min: 1 }).withMessage('Shipment IDs array is required'),
        body('shipmentIds.*').isMongoId().withMessage('Invalid shipment ID')
    ],
    validateRequest,
    shippingController.generateLabels
);

// Get shipping analytics (admin)
router.get('/analytics/summary',
    [
        query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
        query('endDate').optional().isISO8601().withMessage('Invalid end date format')
    ],
    validateRequest,
    shippingController.getShippingAnalytics
);

module.exports = router;
