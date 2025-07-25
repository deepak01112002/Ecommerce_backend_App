const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { query, param } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');
const auth = require('../middlewares/authMiddleware');
const { cache } = require('../middleware/cache');

/**
 * @route   GET /api/products
 * @desc    Get products with advanced filtering and search
 * @access  Public
 * @cache   2 minutes for general queries, 5 minutes for specific filters
 */
router.get('/',
    [
        // Pagination
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        
        // Category filtering
        query('category').optional().notEmpty().withMessage('Category cannot be empty'),
        query('subcategory').optional().notEmpty().withMessage('Subcategory cannot be empty'),
        query('include_subcategories').optional().isBoolean().withMessage('include_subcategories must be boolean'),
        
        // Search and filtering
        query('search').optional().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
        query('min_price').optional().isFloat({ min: 0 }).withMessage('min_price must be non-negative'),
        query('max_price').optional().isFloat({ min: 0 }).withMessage('max_price must be non-negative'),
        query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
        query('brand').optional().notEmpty().withMessage('Brand cannot be empty'),
        query('tags').optional().notEmpty().withMessage('Tags cannot be empty'),
        
        // Sorting
        query('sort_by').optional().isIn([
            'name', 'price', 'rating', 'created_at', 'updated_at', 'sales_count', 
            'view_count', 'newest', 'oldest', 'price_low_high', 'price_high_low', 
            'rating_high_low', 'best_selling', 'popularity', 'relevance'
        ]).withMessage('Invalid sort field'),
        query('sort_order').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
        
        // Feature flags
        query('featured').optional().isBoolean().withMessage('featured must be boolean'),
        query('bestseller').optional().isBoolean().withMessage('bestseller must be boolean'),
        query('new_arrival').optional().isBoolean().withMessage('new_arrival must be boolean'),
        query('on_sale').optional().isBoolean().withMessage('on_sale must be boolean'),
        query('in_stock').optional().isBoolean().withMessage('in_stock must be boolean'),
        query('availability').optional().isIn(['in_stock', 'out_of_stock', 'pre_order', 'discontinued']).withMessage('Invalid availability status'),
        
        // Response options
        query('include_variants').optional().isBoolean().withMessage('include_variants must be boolean'),
        query('include_reviews').optional().isBoolean().withMessage('include_reviews must be boolean'),
        query('include_category_path').optional().isBoolean().withMessage('include_category_path must be boolean')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const {
            page = 1,
            limit = 12,
            category,
            subcategory,
            include_subcategories = 'true',
            search,
            min_price,
            max_price,
            rating,
            brand,
            tags,
            sort_by = 'created_at',
            sort_order = 'desc',
            featured,
            bestseller,
            new_arrival,
            on_sale,
            in_stock = 'true',
            availability,
            include_variants = 'false',
            include_reviews = 'false',
            include_category_path = 'true'
        } = req.query;

        // Build filter object
        const filter = { isActive: true };

        // Category filtering with smart subcategory inclusion
        if (category || subcategory) {
            let categoryIds = [];
            
            if (subcategory) {
                // Direct subcategory filtering
                const subCategoryDoc = await Category.findOne({
                    $or: [
                        { _id: mongoose.Types.ObjectId.isValid(subcategory) ? subcategory : null },
                        { slug: subcategory }
                    ],
                    isActive: true
                });
                
                if (subCategoryDoc) {
                    categoryIds.push(subCategoryDoc._id);
                }
            } else if (category) {
                // Main category filtering
                const categoryDoc = await Category.findOne({
                    $or: [
                        { _id: mongoose.Types.ObjectId.isValid(category) ? category : null },
                        { slug: category }
                    ],
                    isActive: true
                });
                
                if (categoryDoc) {
                    categoryIds.push(categoryDoc._id);
                    
                    // Include subcategories if requested (default true)
                    if (include_subcategories === 'true') {
                        const subcategories = await Category.find({
                            parent: categoryDoc._id,
                            isActive: true
                        });
                        categoryIds.push(...subcategories.map(sub => sub._id));
                    }
                }
            }
            
            if (categoryIds.length > 0) {
                filter.category = { $in: categoryIds };
            }
        }

        // Text search with scoring
        if (search) {
            filter.$text = { $search: search };
        }

        // Price range filtering
        if (min_price || max_price) {
            filter.price = {};
            if (min_price) filter.price.$gte = parseFloat(min_price);
            if (max_price) filter.price.$lte = parseFloat(max_price);
        }

        // Rating filtering
        if (rating) {
            filter.rating = { $gte: parseFloat(rating) };
        }

        // Brand filtering
        if (brand) {
            filter.brand = { $regex: brand, $options: 'i' };
        }

        // Tags filtering
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            filter.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
        }

        // Feature flags
        if (featured === 'true') filter.isFeatured = true;
        if (bestseller === 'true') filter.isBestseller = true;
        if (new_arrival === 'true') filter.isNewArrival = true;
        if (on_sale === 'true') filter.$expr = { $lt: ['$price', '$originalPrice'] };

        // Stock and availability
        if (in_stock === 'true') filter.stock = { $gt: 0 };
        if (availability) filter.availability = availability;

        // Build sort object with advanced options
        const sortObj = {};
        let sortField = sort_by;
        
        const sortFieldMap = {
            'newest': 'createdAt',
            'oldest': 'createdAt',
            'price_low_high': 'price',
            'price_high_low': 'price',
            'rating_high_low': 'rating',
            'best_selling': 'salesCount',
            'popularity': 'viewCount',
            'relevance': search ? 'score' : 'createdAt'
        };
        
        if (sortFieldMap[sort_by]) {
            sortField = sortFieldMap[sort_by];
        }
        
        // Handle special sorting cases
        if (sort_by === 'price_low_high' || sort_by === 'oldest') {
            sortObj[sortField] = 1;
        } else if (['price_high_low', 'rating_high_low', 'best_selling', 'popularity'].includes(sort_by)) {
            sortObj[sortField] = -1;
        } else {
            sortObj[sortField] = sort_order === 'desc' ? -1 : 1;
        }
        
        // Add text search score sorting if search is present
        if (search) {
            sortObj.score = { $meta: 'textScore' };
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let query = Product.find(filter);
        
        // Add text search projection if searching
        if (search) {
            query = query.select({ score: { $meta: 'textScore' } });
        }
        
        // Populate category with conditional path
        if (include_category_path === 'true') {
            query = query.populate('category', 'name slug path parent');
        } else {
            query = query.populate('category', 'name slug');
        }
        
        const products = await query
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        // Get user wishlist if authenticated
        let userWishlist = [];
        if (req.user) {
            const wishlist = await Wishlist.findOne({ user: req.user._id });
            userWishlist = wishlist ? wishlist.items.map(item => item.product.toString()) : [];
        }

        // Format products with enhanced data
        const formattedProducts = await Promise.all(products.map(async (product) => {
            const baseProduct = {
                _id: product._id,
                id: product._id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                short_description: product.shortDescription,
                price: product.price,
                original_price: product.originalPrice,
                discount_percentage: product.calculatedDiscountPercentage,
                discount_amount: product.discountAmount,
                images: product.images || [],
                category: product.category,
                brand: product.brand,
                sku: product.sku,
                rating: product.rating || 0,
                review_count: product.reviewCount || 0,
                stock: product.stock,
                min_order_quantity: product.minOrderQuantity,
                max_order_quantity: product.maxOrderQuantity,
                availability: product.availability,
                stock_status: product.stockStatus,
                is_featured: product.isFeatured,
                is_bestseller: product.isBestseller,
                is_new_arrival: product.isNewArrival,
                is_favorite: userWishlist.includes(product._id.toString()),
                view_count: product.viewCount || 0,
                sales_count: product.salesCount || 0,
                tags: product.tags || [],
                created_at: product.createdAt,
                updated_at: product.updatedAt
            };
            
            // Include variants if requested
            if (include_variants === 'true') {
                baseProduct.variants = product.variants || [];
                baseProduct.specifications = product.specifications || {};
                baseProduct.shipping_info = product.shippingInfo || {};
            }
            
            // Include recent reviews if requested
            if (include_reviews === 'true') {
                const recentReviews = await Review.find({
                    product: product._id
                })
                .populate('user', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(3);
                
                baseProduct.recent_reviews = recentReviews.map(review => ({
                    _id: review._id,
                    rating: review.rating,
                    comment: review.comment,
                    user_name: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
                    created_at: review.createdAt,
                    is_verified: review.isVerifiedPurchase
                }));
            }
            
            // Include search score if available
            if (product.score) {
                baseProduct.search_score = product.score;
            }
            
            return baseProduct;
        }));

        // Enhanced pagination info
        const pagination = {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total,
            total_pages: Math.ceil(total / parseInt(limit)),
            has_next_page: skip + parseInt(limit) < total,
            has_prev_page: parseInt(page) > 1,
            showing_from: skip + 1,
            showing_to: Math.min(skip + parseInt(limit), total)
        };
        
        // Applied filters summary
        const appliedFilters = {
            category: category || null,
            subcategory: subcategory || null,
            include_subcategories: include_subcategories === 'true',
            search: search || null,
            price_range: (min_price || max_price) ? { 
                min: min_price ? parseFloat(min_price) : null, 
                max: max_price ? parseFloat(max_price) : null 
            } : null,
            rating: rating ? parseFloat(rating) : null,
            brand: brand || null,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : null,
            sort_by,
            sort_order,
            features: {
                featured: featured === 'true',
                bestseller: bestseller === 'true',
                new_arrival: new_arrival === 'true',
                on_sale: on_sale === 'true',
                in_stock: in_stock === 'true'
            },
            availability: availability || null
        };

        res.success({
            products: formattedProducts,
            pagination,
            filters: appliedFilters,
            meta: {
                total_found: total,
                showing: formattedProducts.length,
                search_query: search || null,
                has_filters: Object.values(appliedFilters).some(v => v !== null && v !== false),
                cache_duration: search ? 120 : 300 // 2 min for search, 5 min for filters
            }
        }, 'Products retrieved successfully');
    })
);

/**
 * @route   GET /api/products/:identifier
 * @desc    Get single product by ID or slug
 * @access  Public
 * @cache   10 minutes
 */
router.get('/:identifier',
    [
        param('identifier').notEmpty().withMessage('Product identifier is required'),
        query('include_variants').optional().isBoolean().withMessage('include_variants must be boolean'),
        query('include_reviews').optional().isBoolean().withMessage('include_reviews must be boolean'),
        query('include_related').optional().isBoolean().withMessage('include_related must be boolean')
    ],
    validateRequest,
    cache(600), // 10 minutes cache
    asyncHandler(async (req, res) => {
        const { identifier } = req.params;
        const {
            include_variants = 'true',
            include_reviews = 'true',
            include_related = 'true'
        } = req.query;

        // Find product by ID or slug
        const product = await Product.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
                { slug: identifier }
            ],
            isActive: true
        }).populate('category', 'name slug path parent');

        if (!product) {
            return res.error('Product not found', [], 404);
        }

        // Increment view count (async, don't wait)
        Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

        // Check if user has this in wishlist
        let isInWishlist = false;
        if (req.user) {
            const wishlist = await Wishlist.findOne({
                user: req.user._id,
                'items.product': product._id
            });
            isInWishlist = !!wishlist;
        }

        // Format product
        const formattedProduct = {
            _id: product._id,
            id: product._id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            short_description: product.shortDescription,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: product.calculatedDiscountPercentage,
            discount_amount: product.discountAmount,
            images: product.images || [],
            category: product.category,
            brand: product.brand,
            sku: product.sku,
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            stock: product.stock,
            min_order_quantity: product.minOrderQuantity,
            max_order_quantity: product.maxOrderQuantity,
            availability: product.availability,
            stock_status: product.stockStatus,
            is_featured: product.isFeatured,
            is_bestseller: product.isBestseller,
            is_new_arrival: product.isNewArrival,
            is_favorite: isInWishlist,
            view_count: product.viewCount || 0,
            sales_count: product.salesCount || 0,
            tags: product.tags || [],
            specifications: product.specifications || {},
            shipping_info: product.shippingInfo || {},
            return_policy: product.returnPolicy,
            warranty: product.warranty,
            seo_title: product.seoTitle,
            seo_description: product.seoDescription,
            created_at: product.createdAt,
            updated_at: product.updatedAt
        };

        // Include variants if requested
        if (include_variants === 'true') {
            formattedProduct.variants = product.variants || [];
        }

        // Include reviews if requested
        if (include_reviews === 'true') {
            const reviews = await Review.find({ product: product._id })
                .populate('user', 'firstName lastName')
                .sort({ createdAt: -1 })
                .limit(10);

            formattedProduct.reviews = reviews.map(review => ({
                _id: review._id,
                rating: review.rating,
                comment: review.comment,
                user_name: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
                created_at: review.createdAt,
                is_verified: review.isVerifiedPurchase,
                helpful_count: review.helpfulCount || 0,
                images: review.images || []
            }));

            // Review statistics
            const reviewStats = await Review.aggregate([
                { $match: { product: product._id } },
                {
                    $group: {
                        _id: '$rating',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reviewStats.forEach(stat => {
                ratingDistribution[stat._id] = stat.count;
            });

            formattedProduct.review_stats = {
                total_reviews: reviews.length,
                average_rating: product.rating || 0,
                rating_distribution: ratingDistribution
            };
        }

        // Include related products if requested
        if (include_related === 'true') {
            const relatedProducts = await Product.find({
                _id: { $ne: product._id },
                category: product.category._id,
                isActive: true
            })
            .limit(6)
            .select('name slug price originalPrice images rating reviewCount isFeatured')
            .sort({ rating: -1, salesCount: -1 });

            formattedProduct.related_products = relatedProducts.map(related => ({
                _id: related._id,
                name: related.name,
                slug: related.slug,
                price: related.price,
                original_price: related.originalPrice,
                discount_percentage: related.calculatedDiscountPercentage,
                image: related.images?.[0] || null,
                rating: related.rating || 0,
                review_count: related.reviewCount || 0,
                is_featured: related.isFeatured
            }));
        }

        res.success({
            product: formattedProduct
        }, 'Product retrieved successfully');
    })
);

/**
 * @route   GET /api/products/:id/recommendations
 * @desc    Get product recommendations
 * @access  Public
 * @cache   15 minutes
 */
router.get('/:id/recommendations',
    [
        param('id').isMongoId().withMessage('Invalid product ID'),
        query('type').optional().isIn(['related', 'similar', 'frequently_bought', 'trending']).withMessage('Invalid recommendation type'),
        query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
    ],
    validateRequest,
    cache(900), // 15 minutes cache
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { type = 'related', limit = 6 } = req.query;

        const product = await Product.findById(id).populate('category');
        if (!product) {
            return res.error('Product not found', [], 404);
        }

        let recommendations = [];

        switch (type) {
            case 'related':
                recommendations = await Product.find({
                    _id: { $ne: id },
                    category: product.category._id,
                    price: {
                        $gte: product.price * 0.7,
                        $lte: product.price * 1.3
                    },
                    isActive: true
                })
                .limit(parseInt(limit))
                .select('name slug price originalPrice images rating reviewCount isFeatured isBestseller')
                .sort({ rating: -1, salesCount: -1 });
                break;

            case 'similar':
                recommendations = await Product.find({
                    _id: { $ne: id },
                    tags: { $in: product.tags },
                    isActive: true
                })
                .limit(parseInt(limit))
                .select('name slug price originalPrice images rating reviewCount isFeatured isBestseller')
                .sort({ rating: -1 });
                break;

            case 'frequently_bought':
                recommendations = await Product.find({
                    _id: { $ne: id },
                    category: product.category._id,
                    isActive: true
                })
                .limit(parseInt(limit))
                .select('name slug price originalPrice images rating reviewCount isFeatured isBestseller')
                .sort({ salesCount: -1, rating: -1 });
                break;

            case 'trending':
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                recommendations = await Product.find({
                    _id: { $ne: id },
                    createdAt: { $gte: thirtyDaysAgo },
                    isActive: true
                })
                .limit(parseInt(limit))
                .select('name slug price originalPrice images rating reviewCount isFeatured isBestseller')
                .sort({ viewCount: -1, salesCount: -1 });
                break;
        }

        const formattedRecommendations = recommendations.map(rec => ({
            _id: rec._id,
            id: rec._id,
            name: rec.name,
            slug: rec.slug,
            price: rec.price,
            original_price: rec.originalPrice,
            discount_percentage: rec.calculatedDiscountPercentage,
            image: rec.images?.[0] || null,
            rating: rec.rating || 0,
            review_count: rec.reviewCount || 0,
            is_featured: rec.isFeatured,
            is_bestseller: rec.isBestseller
        }));

        res.success({
            recommendations: formattedRecommendations,
            type,
            based_on: {
                product_id: product._id,
                product_name: product.name,
                category: product.category.name
            },
            total: formattedRecommendations.length
        }, `${type} recommendations retrieved successfully`);
    })
);

module.exports = router;
