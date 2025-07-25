const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
// Import Contabo upload middleware (replaces multer)
const { uploadMultipleImages } = require('../middlewares/contaboUpload');

// Get all reviews (for admin)
router.get('/', authMiddleware, reviewController.getAllReviews);

// Get reviews for a product (public)
router.get('/product/:productId', reviewController.getProductReviews);

// Add a review (authenticated users only)
router.post('/',
    authMiddleware,
    uploadMultipleImages('images', 5, 'reviews'), // Allow up to 5 images
    [
        body('productId').isMongoId().withMessage('Valid product ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
    ],
    reviewController.addReview
);

// Update a review (authenticated users only)
router.put('/:reviewId',
    authMiddleware,
    uploadMultipleImages('images', 5, 'reviews'),
    [
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
    ],
    reviewController.updateReview
);

// Delete a review (authenticated users only)
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

// Mark review as helpful (public)
router.post('/:reviewId/helpful', reviewController.markHelpful);

// Report a review (public)
router.post('/:reviewId/report', reviewController.reportReview);

// Admin routes
// Hide/unhide review (admin only)
router.patch('/:reviewId/visibility', adminMiddleware, reviewController.toggleReviewVisibility);

module.exports = router;
