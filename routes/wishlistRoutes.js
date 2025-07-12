const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middlewares/authMiddleware');

// All wishlist routes require authentication
router.use(authMiddleware);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Add item to wishlist
router.post('/add',
    [
        body('productId').isMongoId().withMessage('Valid product ID is required')
    ],
    wishlistController.addToWishlist
);

// Remove item from wishlist
router.delete('/remove/:productId', wishlistController.removeFromWishlist);

// Clear wishlist
router.delete('/clear', wishlistController.clearWishlist);

// Check if product is in wishlist
router.get('/check/:productId', wishlistController.isInWishlist);

module.exports = router;
