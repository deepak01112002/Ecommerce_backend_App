const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, query, param } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');
const auth = require('../middlewares/authMiddleware');
const adminAuth = require('../middlewares/adminMiddleware');

// Cache middleware for production
const { cache } = require('../middleware/cache');

/**
 * @route   GET /api/categories
 * @desc    Get all categories with advanced filtering
 * @access  Public
 * @cache   5 minutes
 */
router.get('/',
    [
        query('level').optional().isInt({ min: 0, max: 3 }).withMessage('Level must be between 0 and 3'),
        query('parent').optional().isMongoId().withMessage('Parent must be a valid MongoDB ID'),
        query('featured').optional().isBoolean().withMessage('Featured must be boolean'),
        query('include_products').optional().isBoolean().withMessage('include_products must be boolean'),
        query('include_children').optional().isBoolean().withMessage('include_children must be boolean'),
        query('sort').optional().isIn(['name', 'sort_order', 'created_at', 'product_count']).withMessage('Invalid sort field'),
        query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer')
    ],
    validateRequest,
    cache(300), // 5 minutes cache
    asyncHandler(async (req, res) => {
        const {
            level,
            parent,
            featured,
            include_products = 'false',
            include_children = 'false',
            sort = 'sort_order',
            order = 'asc',
            limit = 50,
            page = 1
        } = req.query;

        // Build filter
        const filter = { isActive: true };
        
        if (level !== undefined) filter.level = parseInt(level);
        if (parent) filter.parent = parent;
        if (featured === 'true') filter.isFeatured = true;

        // Build sort object
        const sortObj = {};
        sortObj[sort] = order === 'desc' ? -1 : 1;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        let query = Category.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        // Populate parent if needed
        if (level > 0) {
            query = query.populate('parent', 'name slug');
        }

        const categories = await query;
        const total = await Category.countDocuments(filter);

        // Format response
        const formattedCategories = await Promise.all(categories.map(async (category) => {
            const categoryObj = {
                _id: category._id,
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                image: category.image,
                icon: category.icon,
                color: category.color,
                level: category.level,
                path: category.path,
                parent: category.parent,
                is_featured: category.isFeatured,
                sort_order: category.sortOrder,
                created_at: category.createdAt,
                updated_at: category.updatedAt
            };

            // Include product count if requested
            if (include_products === 'true') {
                categoryObj.product_count = await Product.countDocuments({
                    category: category._id,
                    isActive: true
                });
            }

            // Include children if requested
            if (include_children === 'true') {
                const children = await Category.find({
                    parent: category._id,
                    isActive: true
                }).select('_id name slug level').sort({ sortOrder: 1 });
                categoryObj.children = children;
                categoryObj.has_children = children.length > 0;
            }

            return categoryObj;
        }));

        res.success({
            categories: formattedCategories,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total,
                total_pages: Math.ceil(total / parseInt(limit)),
                has_next_page: skip + parseInt(limit) < total,
                has_prev_page: parseInt(page) > 1
            },
            filters: {
                level: level ? parseInt(level) : null,
                parent,
                featured: featured === 'true',
                sort,
                order
            }
        }, 'Categories retrieved successfully');
    })
);

/**
 * @route   GET /api/categories/tree
 * @desc    Get hierarchical category tree
 * @access  Public
 * @cache   10 minutes
 */
router.get('/tree',
    [
        query('max_depth').optional().isInt({ min: 1, max: 5 }).withMessage('max_depth must be between 1 and 5'),
        query('featured_only').optional().isBoolean().withMessage('featured_only must be boolean'),
        query('include_products').optional().isBoolean().withMessage('include_products must be boolean'),
        query('min_product_count').optional().isInt({ min: 0 }).withMessage('min_product_count must be non-negative')
    ],
    validateRequest,
    cache(600), // 10 minutes cache
    asyncHandler(async (req, res) => {
        const {
            max_depth = 3,
            featured_only = 'false',
            include_products = 'false',
            min_product_count = 0
        } = req.query;

        const tree = await Category.getCategoryTree();
        
        // Filter and enhance tree
        const enhancedTree = await Promise.all(tree.map(async (category) => {
            // Calculate total products including subcategories
            const allCategoryIds = [category._id];
            if (category.subcategories) {
                allCategoryIds.push(...category.subcategories.map(sub => sub._id));
            }
            
            const totalProducts = await Product.countDocuments({
                category: { $in: allCategoryIds },
                isActive: true
            });

            // Skip if doesn't meet minimum product count
            if (totalProducts < parseInt(min_product_count)) {
                return null;
            }

            // Skip if featured_only is true and category is not featured
            if (featured_only === 'true' && !category.isFeatured) {
                return null;
            }

            const enhancedCategory = {
                ...category,
                total_products: totalProducts
            };

            // Include featured products if requested
            if (include_products === 'true') {
                const featuredProducts = await Product.find({
                    category: { $in: allCategoryIds },
                    isActive: true,
                    isFeatured: true
                })
                .limit(3)
                .select('name price originalPrice images rating slug')
                .sort({ rating: -1, salesCount: -1 });

                enhancedCategory.featured_products = featuredProducts.map(product => ({
                    _id: product._id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    original_price: product.originalPrice,
                    discount_percentage: product.calculatedDiscountPercentage,
                    image: product.images?.[0] || null,
                    rating: product.rating || 0
                }));
            }

            return enhancedCategory;
        }));

        const filteredTree = enhancedTree.filter(Boolean);

        res.success({
            categories: filteredTree,
            meta: {
                total_categories: await Category.countDocuments({ isActive: true }),
                total_products: await Product.countDocuments({ isActive: true }),
                max_depth: parseInt(max_depth),
                featured_only: featured_only === 'true',
                includes_products: include_products === 'true',
                min_product_count: parseInt(min_product_count)
            }
        }, 'Category tree retrieved successfully');
    })
);

/**
 * @route   GET /api/categories/main
 * @desc    Get only main categories (level 0)
 * @access  Public
 * @cache   15 minutes
 */
router.get('/main',
    [
        query('featured').optional().isBoolean().withMessage('featured must be boolean'),
        query('include_stats').optional().isBoolean().withMessage('include_stats must be boolean')
    ],
    validateRequest,
    cache(900), // 15 minutes cache
    asyncHandler(async (req, res) => {
        const { featured, include_stats = 'false' } = req.query;

        const filter = { level: 0, isActive: true };
        if (featured === 'true') filter.isFeatured = true;

        const mainCategories = await Category.find(filter)
            .sort({ sortOrder: 1, name: 1 });

        const formattedCategories = await Promise.all(mainCategories.map(async (category) => {
            const categoryObj = {
                _id: category._id,
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                image: category.image,
                icon: category.icon,
                color: category.color,
                is_featured: category.isFeatured,
                sort_order: category.sortOrder
            };

            if (include_stats === 'true') {
                // Get subcategories
                const subcategories = await Category.find({
                    parent: category._id,
                    isActive: true
                });

                // Get total products in this category and all subcategories
                const allCategoryIds = [category._id, ...subcategories.map(sub => sub._id)];
                const totalProducts = await Product.countDocuments({
                    category: { $in: allCategoryIds },
                    isActive: true
                });

                categoryObj.subcategory_count = subcategories.length;
                categoryObj.total_products = totalProducts;
                categoryObj.subcategories = subcategories.map(sub => ({
                    _id: sub._id,
                    name: sub.name,
                    slug: sub.slug
                }));
            }

            return categoryObj;
        }));

        res.success({
            categories: formattedCategories,
            total: formattedCategories.length
        }, 'Main categories retrieved successfully');
    })
);

/**
 * @route   GET /api/categories/:identifier/subcategories
 * @desc    Get subcategories of a specific category
 * @access  Public
 * @cache   10 minutes
 */
router.get('/:identifier/subcategories',
    [
        param('identifier').notEmpty().withMessage('Category identifier is required'),
        query('include_products').optional().isBoolean().withMessage('include_products must be boolean'),
        query('featured').optional().isBoolean().withMessage('featured must be boolean')
    ],
    validateRequest,
    cache(600),
    asyncHandler(async (req, res) => {
        const { identifier } = req.params;
        const { include_products = 'false', featured } = req.query;

        // Find parent category by ID or slug
        const parentCategory = await Category.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
                { slug: identifier }
            ],
            isActive: true
        });

        if (!parentCategory) {
            return res.error('Category not found', [], 404);
        }

        // Build filter for subcategories
        const filter = { parent: parentCategory._id, isActive: true };
        if (featured === 'true') filter.isFeatured = true;

        const subcategories = await Category.find(filter)
            .sort({ sortOrder: 1, name: 1 });

        const formattedSubcategories = await Promise.all(subcategories.map(async (subcategory) => {
            const subObj = {
                _id: subcategory._id,
                id: subcategory._id,
                name: subcategory.name,
                slug: subcategory.slug,
                description: subcategory.description,
                image: subcategory.image,
                icon: subcategory.icon,
                color: subcategory.color,
                is_featured: subcategory.isFeatured,
                sort_order: subcategory.sortOrder,
                parent: {
                    _id: parentCategory._id,
                    name: parentCategory.name,
                    slug: parentCategory.slug
                }
            };

            if (include_products === 'true') {
                subObj.product_count = await Product.countDocuments({
                    category: subcategory._id,
                    isActive: true
                });
            }

            return subObj;
        }));

        res.success({
            parent_category: {
                _id: parentCategory._id,
                name: parentCategory.name,
                slug: parentCategory.slug
            },
            subcategories: formattedSubcategories,
            total: formattedSubcategories.length
        }, 'Subcategories retrieved successfully');
    })
);

/**
 * @route   GET /api/categories/:identifier/products
 * @desc    Get products in a specific category (including subcategories)
 * @access  Public
 */
router.get('/:identifier/products',
    [
        param('identifier').notEmpty().withMessage('Category identifier is required'),
        query('include_subcategories').optional().isBoolean().withMessage('include_subcategories must be boolean'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
        query('sort').optional().isIn(['name', 'price', 'rating', 'created_at', 'sales_count']).withMessage('Invalid sort field'),
        query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
        query('min_price').optional().isFloat({ min: 0 }).withMessage('min_price must be non-negative'),
        query('max_price').optional().isFloat({ min: 0 }).withMessage('max_price must be non-negative'),
        query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
        query('in_stock').optional().isBoolean().withMessage('in_stock must be boolean'),
        query('featured').optional().isBoolean().withMessage('featured must be boolean')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { identifier } = req.params;
        const {
            include_subcategories = 'true',
            page = 1,
            limit = 12,
            sort = 'created_at',
            order = 'desc',
            min_price,
            max_price,
            rating,
            in_stock,
            featured
        } = req.query;

        // Find category by ID or slug
        const category = await Category.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : null },
                { slug: identifier }
            ],
            isActive: true
        });

        if (!category) {
            return res.error('Category not found', [], 404);
        }

        // Build category filter
        let categoryIds = [category._id];

        if (include_subcategories === 'true') {
            const subcategories = await Category.find({
                parent: category._id,
                isActive: true
            });
            categoryIds.push(...subcategories.map(sub => sub._id));
        }

        // Build product filter
        const productFilter = {
            category: { $in: categoryIds },
            isActive: true
        };

        if (min_price || max_price) {
            productFilter.price = {};
            if (min_price) productFilter.price.$gte = parseFloat(min_price);
            if (max_price) productFilter.price.$lte = parseFloat(max_price);
        }

        if (rating) productFilter.rating = { $gte: parseFloat(rating) };
        if (in_stock === 'true') productFilter.stock = { $gt: 0 };
        if (featured === 'true') productFilter.isFeatured = true;

        // Build sort
        const sortObj = {};
        sortObj[sort] = order === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const products = await Product.find(productFilter)
            .populate('category', 'name slug')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(productFilter);

        // Format products
        const formattedProducts = products.map(product => ({
            _id: product._id,
            id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: product.calculatedDiscountPercentage,
            images: product.images,
            category: product.category,
            brand: product.brand,
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            stock: product.stock,
            is_featured: product.isFeatured,
            is_bestseller: product.isBestseller,
            created_at: product.createdAt
        }));

        res.success({
            category: {
                _id: category._id,
                name: category.name,
                slug: category.slug,
                level: category.level
            },
            products: formattedProducts,
            pagination: {
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total,
                total_pages: Math.ceil(total / parseInt(limit)),
                has_next_page: skip + parseInt(limit) < total,
                has_prev_page: parseInt(page) > 1
            },
            filters: {
                include_subcategories: include_subcategories === 'true',
                price_range: { min: min_price, max: max_price },
                rating: rating ? parseFloat(rating) : null,
                in_stock: in_stock === 'true',
                featured: featured === 'true',
                sort,
                order
            }
        }, `Products in ${category.name} retrieved successfully`);
    })
);

/**
 * @route   GET /api/categories/search
 * @desc    Search categories
 * @access  Public
 */
router.get('/search',
    [
        query('q').notEmpty().withMessage('Search query is required'),
        query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { q, limit = 10 } = req.query;

        const categories = await Category.find({
            $and: [
                { isActive: true },
                {
                    $or: [
                        { name: { $regex: q, $options: 'i' } },
                        { description: { $regex: q, $options: 'i' } },
                        { metaKeywords: { $in: [new RegExp(q, 'i')] } }
                    ]
                }
            ]
        })
        .populate('parent', 'name slug')
        .limit(parseInt(limit))
        .sort({ name: 1 });

        const formattedCategories = await Promise.all(categories.map(async (category) => {
            const productCount = await Product.countDocuments({
                category: category._id,
                isActive: true
            });

            return {
                _id: category._id,
                id: category._id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                image: category.image,
                level: category.level,
                parent: category.parent,
                product_count: productCount
            };
        }));

        res.success({
            categories: formattedCategories,
            query: q,
            total: formattedCategories.length
        }, 'Category search completed successfully');
    })
);

module.exports = router;
