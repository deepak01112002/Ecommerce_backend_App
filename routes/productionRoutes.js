/**
 * Production Routes Integration
 * Centralized route management for production-ready ecommerce system
 */

const express = require('express');
const router = express.Router();

// Import production route modules
const productionCategoryRoutes = require('./productionCategoryRoutes');
const productionProductRoutes = require('./productionProductRoutes');
const productionOrderRoutes = require('./productionOrderRoutes');
const productionCartRoutes = require('./productionCartRoutes');

// Import existing routes (enhanced)
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const reviewRoutes = require('./reviewRoutes');
const couponRoutes = require('./couponRoutes');
const wishlistRoutes = require('./wishlistRoutes');

// Import controllers for additional endpoints
const { asyncHandler } = require('../middlewares/errorHandler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');

// ==================== PRODUCTION ROUTES ====================

// Categories - Enhanced production routes
router.use('/categories', productionCategoryRoutes);

// Products - Enhanced production routes  
router.use('/products', productionProductRoutes);

// Orders - Complete order flow
router.use('/orders', productionOrderRoutes);

// Cart - Enhanced cart management
router.use('/cart', productionCartRoutes);

// ==================== EXISTING ENHANCED ROUTES ====================

// Authentication
router.use('/auth', authRoutes);

// User management
router.use('/users', userRoutes);

// Reviews
router.use('/reviews', reviewRoutes);

// Coupons
router.use('/coupons', couponRoutes);

// Wishlist
router.use('/wishlist', wishlistRoutes);

// ==================== GLOBAL SEARCH & DISCOVERY ====================

/**
 * @route   GET /api/search
 * @desc    Global search across products and categories
 * @access  Public
 */
router.get('/search',
    asyncHandler(async (req, res) => {
        const { q, type = 'all', limit = 10 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.error('Search query must be at least 2 characters long', [], 400);
        }

        const results = {
            query: q,
            products: [],
            categories: [],
            total: 0
        };

        // Search products
        if (type === 'all' || type === 'products') {
            const products = await Product.find({
                $text: { $search: q },
                isActive: true
            })
            .populate('category', 'name slug')
            .select('name slug price originalPrice images rating reviewCount')
            .sort({ score: { $meta: 'textScore' } })
            .limit(parseInt(limit));

            results.products = products.map(product => ({
                _id: product._id,
                type: 'product',
                name: product.name,
                slug: product.slug,
                price: product.price,
                original_price: product.originalPrice,
                discount_percentage: product.calculatedDiscountPercentage,
                image: product.images?.[0] || null,
                rating: product.rating || 0,
                review_count: product.reviewCount || 0,
                category: product.category
            }));
        }

        // Search categories
        if (type === 'all' || type === 'categories') {
            const categories = await Category.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } }
                ],
                isActive: true
            })
            .select('name slug description image level')
            .limit(parseInt(limit));

            results.categories = categories.map(category => ({
                _id: category._id,
                type: 'category',
                name: category.name,
                slug: category.slug,
                description: category.description,
                image: category.image,
                level: category.level
            }));
        }

        results.total = results.products.length + results.categories.length;

        res.success(results, 'Search completed successfully');
    })
);

/**
 * @route   GET /api/featured
 * @desc    Get featured content (products and categories)
 * @access  Public
 */
router.get('/featured',
    asyncHandler(async (req, res) => {
        const { limit = 6 } = req.query;

        // Get featured categories
        const featuredCategories = await Category.find({
            isFeatured: true,
            isActive: true
        })
        .limit(parseInt(limit))
        .sort({ sortOrder: 1 });

        // Get featured products
        const featuredProducts = await Product.find({
            isFeatured: true,
            isActive: true
        })
        .populate('category', 'name slug')
        .limit(parseInt(limit))
        .sort({ rating: -1, salesCount: -1 });

        const formattedProducts = featuredProducts.map(product => ({
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: product.calculatedDiscountPercentage,
            image: product.images?.[0] || null,
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            category: product.category
        }));

        const formattedCategories = featuredCategories.map(category => ({
            _id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            icon: category.icon,
            color: category.color
        }));

        res.success({
            featured_products: formattedProducts,
            featured_categories: formattedCategories,
            total: {
                products: formattedProducts.length,
                categories: formattedCategories.length
            }
        }, 'Featured content retrieved successfully');
    })
);

/**
 * @route   GET /api/trending
 * @desc    Get trending products
 * @access  Public
 */
router.get('/trending',
    asyncHandler(async (req, res) => {
        const { limit = 12, period = 'week' } = req.query;

        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'today':
                dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
                break;
            case 'week':
                dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
                break;
            case 'month':
                dateFilter = { createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
                break;
        }

        const trendingProducts = await Product.find({
            ...dateFilter,
            isActive: true
        })
        .populate('category', 'name slug')
        .sort({ viewCount: -1, salesCount: -1 })
        .limit(parseInt(limit));

        const formattedProducts = trendingProducts.map(product => ({
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: product.calculatedDiscountPercentage,
            image: product.images?.[0] || null,
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            view_count: product.viewCount || 0,
            sales_count: product.salesCount || 0,
            category: product.category
        }));

        res.success({
            trending_products: formattedProducts,
            period,
            total: formattedProducts.length
        }, 'Trending products retrieved successfully');
    })
);

/**
 * @route   GET /api/bestsellers
 * @desc    Get bestselling products
 * @access  Public
 */
router.get('/bestsellers',
    asyncHandler(async (req, res) => {
        const { limit = 12, category } = req.query;

        const filter = { isBestseller: true, isActive: true };
        if (category) {
            filter.category = category;
        }

        const bestsellers = await Product.find(filter)
            .populate('category', 'name slug')
            .sort({ salesCount: -1, rating: -1 })
            .limit(parseInt(limit));

        const formattedProducts = bestsellers.map(product => ({
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: product.calculatedDiscountPercentage,
            image: product.images?.[0] || null,
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            sales_count: product.salesCount || 0,
            category: product.category
        }));

        res.success({
            bestsellers: formattedProducts,
            category: category || 'all',
            total: formattedProducts.length
        }, 'Bestsellers retrieved successfully');
    })
);

/**
 * @route   GET /api/stats
 * @desc    Get general platform statistics
 * @access  Public
 */
router.get('/stats',
    asyncHandler(async (req, res) => {
        const [
            totalProducts,
            totalCategories,
            totalOrders,
            totalUsers
        ] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Category.countDocuments({ isActive: true }),
            Order.countDocuments({ status: { $ne: 'cancelled' } }),
            User.countDocuments({ isActive: true, role: 'user' })
        ]);

        // Get featured counts
        const [featuredProducts, featuredCategories] = await Promise.all([
            Product.countDocuments({ isFeatured: true, isActive: true }),
            Category.countDocuments({ isFeatured: true, isActive: true })
        ]);

        res.success({
            platform_stats: {
                total_products: totalProducts,
                total_categories: totalCategories,
                total_orders: totalOrders,
                total_users: totalUsers,
                featured_products: featuredProducts,
                featured_categories: featuredCategories
            },
            last_updated: new Date()
        }, 'Platform statistics retrieved successfully');
    })
);

module.exports = router;
