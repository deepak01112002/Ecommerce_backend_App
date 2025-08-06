const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/orderController');
const adminOrderController = require('../controllers/adminOrderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

console.log('🚨🚨🚨 ORDER ROUTES FILE LOADED 🚨🚨🚨');

// Optional auth middleware for guest orders
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        authMiddleware(req, res, next);
    } else {
        next();
    }
};

// Create order from cart
router.post('/',
    authMiddleware,
    [
        body('address.street').notEmpty().withMessage('Street address is required'),
        body('address.city').notEmpty().withMessage('City is required'),
        body('address.state').notEmpty().withMessage('State is required'),
        body('address.postalCode').notEmpty().withMessage('Postal code is required'),
        body('address.country').notEmpty().withMessage('Country is required'),
        body('paymentInfo.method').notEmpty().withMessage('Payment method is required')
    ],
    orderController.createOrder
);

// Get user's orders (authenticated users only)
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/my-orders', authMiddleware, orderController.getUserOrders);

// Test route (must be before /:orderId)
router.get('/test', (req, res) => {
    console.log('🚨🚨🚨 TEST ROUTE HIT 🚨🚨🚨');
    res.json({ message: 'Test route working' });
});

// Admin routes (protected) - must be before /:orderId
router.get('/admin/all', (req, res, next) => {
    console.log('🚨🚨🚨 ROUTE /admin/all HIT 🚨🚨🚨');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    next();
}, authMiddleware, adminMiddleware, orderController.getOrders);

// Admin delivery method management routes - must be before /:orderId
router.get('/admin/delivery-options', authMiddleware, adminMiddleware, adminOrderController.getDeliveryMethodOptions);
router.get('/admin/by-delivery-method', authMiddleware, adminMiddleware, adminOrderController.getOrdersByDeliveryMethod);
router.get('/admin/pending-delivery-assignment', authMiddleware, adminMiddleware, adminOrderController.getOrdersPendingDeliveryAssignment);
router.put('/admin/bulk-delivery-method', authMiddleware, adminMiddleware, adminOrderController.bulkUpdateDeliveryMethod);

// Admin routes with specific orderId - must be before generic /:orderId
router.put('/admin/:orderId/delivery-method', authMiddleware, adminMiddleware, adminOrderController.updateOrderDeliveryMethod);
router.put('/admin/:id', authMiddleware, adminMiddleware, orderController.updateOrder);
router.patch('/admin/:id/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);

// Get single order details (must be after specific routes)
router.get('/:orderId', optionalAuth, orderController.getOrderById);

// Track order
router.get('/:orderId/track', optionalAuth, orderController.trackOrder);

// Download order invoice (authenticated users only)
router.get('/:orderId/invoice/download', authMiddleware, orderController.downloadOrderInvoice);

// Cancel order (authenticated users only)
router.patch('/:orderId/cancel', authMiddleware, orderController.cancelOrder);

module.exports = router;