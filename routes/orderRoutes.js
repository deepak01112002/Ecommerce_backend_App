const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

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
    optionalAuth,
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
router.get('/my-orders', authMiddleware, orderController.getUserOrders);

// Get single order details
router.get('/:orderId', optionalAuth, orderController.getOrderById);

// Cancel order (authenticated users only)
router.patch('/:orderId/cancel', authMiddleware, orderController.cancelOrder);

// Admin endpoints
router.get('/', adminMiddleware, orderController.getOrders);
router.put('/:id',
    adminMiddleware,
    [
        body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
            .withMessage('Invalid order status')
    ],
    orderController.updateOrder
);

module.exports = router;