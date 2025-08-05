const express = require('express');
const router = express.Router();
const {
    getDeliveryOptions,
    assignDeliveryMethod,
    getPendingOrders,
    getDeliveryAssignments,
    updateDeliveryAssignment,
    trackDelhiveryShipment,
    checkDelhiveryServiceability
} = require('../controllers/deliveryManagementController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validation');

// Validation middleware
const validateDeliveryAssignment = [
    body('deliveryMethod')
        .isIn(['manual', 'delivery_company', 'delhivery', 'shiprocket'])
        .withMessage('Invalid delivery method'),
    body('deliveryCompanyId')
        .optional()
        .isMongoId()
        .withMessage('Invalid delivery company ID'),
    body('adminNotes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Admin notes must be less than 500 characters'),
    handleValidationErrors
];

const validateOrderId = [
    param('orderId')
        .isMongoId()
        .withMessage('Invalid order ID'),
    handleValidationErrors
];

const validateLocationQuery = [
    query('state')
        .notEmpty()
        .withMessage('State is required'),
    query('city')
        .notEmpty()
        .withMessage('City is required'),
    query('postalCode')
        .optional()
        .isLength({ min: 6, max: 6 })
        .withMessage('Postal code must be 6 digits'),
    handleValidationErrors
];

// Test route to verify the routes are working
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Delivery management routes are working!' });
});

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminMiddleware);

// @desc    Get delivery options for admin dropdown
// @route   GET /api/delivery-management/options
// @access  Admin
router.get('/options', validateLocationQuery, getDeliveryOptions);

// @desc    Get orders pending delivery assignment
// @route   GET /api/delivery-management/orders/pending
// @access  Admin
router.get('/orders/pending', getPendingOrders);

// @desc    Get delivery assignments history
// @route   GET /api/delivery-management/assignments
// @access  Admin
router.get('/assignments', getDeliveryAssignments);

// @desc    Assign delivery method to order
// @route   POST /api/delivery-management/orders/:orderId/assign
// @access  Admin
router.post('/orders/:orderId/assign', 
    validateOrderId, 
    validateDeliveryAssignment, 
    assignDeliveryMethod
);

// @desc    Update delivery assignment
// @route   PUT /api/delivery-management/orders/:orderId/assignment
// @access  Admin
router.put('/orders/:orderId/assignment',
    validateOrderId,
    validateDeliveryAssignment,
    updateDeliveryAssignment
);

// @desc    Track Delhivery shipment
// @route   GET /api/delivery-management/track/:waybill
// @access  Admin
router.get('/track/:waybill', trackDelhiveryShipment);

// @desc    Check Delhivery serviceability
// @route   GET /api/delivery-management/serviceability/:pincode
// @access  Admin
router.get('/serviceability/:pincode', checkDelhiveryServiceability);

module.exports = router;
