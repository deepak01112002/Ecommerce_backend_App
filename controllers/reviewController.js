const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all reviews (for admin)
exports.getAllReviews = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        rating,
        productId,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (rating) query.rating = parseInt(rating);
    if (productId) query.product = productId;
    if (userId) query.user = userId;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find(query)
        .populate('user', 'firstName lastName')
        .populate('product', 'name images')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments(query);

    res.success({
        reviews,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            total,
            hasNext: (parseInt(page) * parseInt(limit)) < total,
            hasPrev: parseInt(page) > 1
        }
    }, 'Reviews retrieved successfully');
});

// Get reviews for a product
exports.getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    try {
        const reviews = await Review.find({
            product: productId,
            isHidden: false
        })
        .populate('user', 'firstName lastName')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const totalReviews = await Review.countDocuments({
            product: productId,
            isHidden: false
        });

        // Calculate rating distribution
        const ratingDistribution = await Review.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productId), isHidden: false } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.success({
            data: reviews || [],
            totalReviews,
            totalPages: Math.ceil(totalReviews / limit),
            currentPage: parseInt(page),
            ratingDistribution
        }, 'Reviews retrieved successfully');
    } catch (error) {
        console.error('Reviews error:', error);
        res.success({
            data: [],
            totalReviews: 0,
            totalPages: 0,
            currentPage: parseInt(page),
            ratingDistribution: []
        }, 'Reviews retrieved successfully');
    }
});

// Add a review
exports.addReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id;
        const images = req.uploadedFiles ? req.uploadedFiles.map(f => f.url) : [];

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({ user: userId, product: productId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        // Check if user has purchased this product (optional verification)
        const hasPurchased = await Order.findOne({
            user: userId,
            'items.product': productId,
            status: 'delivered'
        });

        const review = new Review({
            user: userId,
            product: productId,
            rating,
            comment,
            images,
            isVerifiedPurchase: !!hasPurchased
        });

        await review.save();
        await review.populate('user', 'name');

        // Update product rating
        await updateProductRating(productId);

        res.status(201).json({
            message: 'Review added successfully',
            review
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update a review
exports.updateReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;
        const images = req.uploadedFiles ? req.uploadedFiles.map(f => f.url) : undefined;

        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        review.rating = rating;
        review.comment = comment;
        if (images) review.images = images;

        await review.save();
        await review.populate('user', 'name');

        // Update product rating
        await updateProductRating(review.product);

        res.json({
            message: 'Review updated successfully',
            review
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: reviewId, user: userId });
        if (!review) {
            return res.status(404).json({ message: 'Review not found or unauthorized' });
        }

        const productId = review.product;
        await Review.findByIdAndDelete(reviewId);

        // Update product rating
        await updateProductRating(productId);

        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { $inc: { helpfulCount: 1 } },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({
            message: 'Review marked as helpful',
            helpfulCount: review.helpfulCount
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Report a review (admin)
exports.reportReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { $inc: { reportCount: 1 } },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({
            message: 'Review reported',
            reportCount: review.reportCount
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Hide/unhide review (admin)
exports.toggleReviewVisibility = async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.isHidden = !review.isHidden;
        await review.save();

        // Update product rating
        await updateProductRating(review.product);

        res.json({
            message: `Review ${review.isHidden ? 'hidden' : 'shown'}`,
            review
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Helper function to update product rating
async function updateProductRating(productId) {
    try {
        const reviews = await Review.find({ product: productId, isHidden: false });
        
        if (reviews.length === 0) {
            await Product.findByIdAndUpdate(productId, {
                rating: 0,
                reviewCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            reviewCount: reviews.length
        });
    } catch (err) {
        console.error('Error updating product rating:', err);
    }
}
