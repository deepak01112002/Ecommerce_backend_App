const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');

// Optional auth middleware - allows both authenticated and guest users
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        // If token exists, use auth middleware
        authMiddleware(req, res, next);
    } else {
        // If no token, continue without user
        next();
    }
};

// Get cart
router.get('/', optionalAuth, cartController.getCart);

// Add item to cart
router.post('/add', 
    optionalAuth,
    [
        body('productId').isMongoId().withMessage('Valid product ID is required'),
        body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
        body('variant').optional().isString().withMessage('Variant must be a string')
    ],
    cartController.addToCart
);

// Update cart item quantity
router.put('/item/:itemId',
    optionalAuth,
    [
        body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
    ],
    cartController.updateCartItem
);

// Remove item from cart
router.delete('/item/:itemId', optionalAuth, cartController.removeFromCart);

// Clear cart
router.delete('/clear', optionalAuth, cartController.clearCart);

// Merge guest cart with user cart (for login)
router.post('/merge',
    authMiddleware,
    [
        body('guestId').notEmpty().withMessage('Guest ID is required')
    ],
    cartController.mergeCart
);

module.exports = router;
