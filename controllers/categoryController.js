const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');

// Get all categories with hierarchy and product counts
exports.getCategories = asyncHandler(async (req, res) => {
    const { include_products = false, parent_only = false } = req.query;

    let filter = {};
    if (parent_only === 'true') {
        filter.parent = null;
    }

    const categories = await Category.find(filter)
        .populate('parent', 'name slug')
        .sort({ name: 1 });

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
            const productCount = await Product.countDocuments({
                category: category._id,
                isActive: true
            });

            // Get subcategories
            const subcategories = await Category.find({ parent: category._id })
                .select('name slug');

            const formattedCategory = {
                _id: category._id,
                id: category._id,
                name: category.name,
                description: category.description,
                slug: category.slug,
                image: category.image,
                parent: category.parent ? {
                    _id: category.parent._id,
                    id: category.parent._id,
                    name: category.parent.name,
                    slug: category.parent.slug
                } : null,
                product_count: productCount,
                subcategories: subcategories.map(sub => ({
                    _id: sub._id,
                    id: sub._id,
                    name: sub.name,
                    slug: sub.slug
                })),
                created_at: category.createdAt,
                updated_at: category.updatedAt
            };

            // Include products if requested
            if (include_products === 'true') {
                const products = await Product.find({
                    category: category._id,
                    isActive: true
                }).limit(5).select('name price images rating reviewCount');

                formattedCategory.featured_products = products.map(product => ({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images && product.images.length > 0 ? product.images[0] : null,
                    rating: product.rating || 0,
                    review_count: product.reviewCount || 0
                }));
            }

            return formattedCategory;
        })
    );

    res.success(categoriesWithCounts, 'Categories retrieved successfully');
});

// Get single category by ID
exports.getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id)
        .populate('parent', 'name slug');

    if (!category) {
        return res.error('Category not found', [], 404);
    }

    // Get product count
    const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true
    });

    // Get subcategories
    const subcategories = await Category.find({ parent: category._id })
        .select('name slug');

    const formattedCategory = {
        _id: category._id,
        id: category._id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        image: category.image,
        parent: category.parent ? {
            _id: category.parent._id,
            id: category.parent._id,
            name: category.parent.name,
            slug: category.parent.slug
        } : null,
        product_count: productCount,
        subcategories: subcategories.map(sub => ({
            _id: sub._id,
            id: sub._id,
            name: sub.name,
            slug: sub.slug
        })),
        created_at: category.createdAt,
        updated_at: category.updatedAt
    };

    res.success(formattedCategory, 'Category retrieved successfully');
});

// Create category (admin)
exports.createCategory = asyncHandler(async (req, res) => {
    const { name, description, parent } = req.body;

    // Check if parent category exists
    if (parent) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
            return res.error('Parent category not found', [], 404);
        }
    }

    // Handle image upload from Contabo storage
    const image = req.uploadedFile ? req.uploadedFile.url : undefined;

    // Create category
    const category = new Category({
        name,
        description,
        parent: parent || null,
        image
    });

    await category.save();
    await category.populate('parent', 'name slug');

    const formattedCategory = {
        id: category._id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        image: category.image,
        parent: category.parent ? {
            id: category.parent._id,
            name: category.parent.name,
            slug: category.parent.slug
        } : null,
        product_count: 0,
        subcategories: [],
        created_at: category.createdAt,
        updated_at: category.updatedAt
    };

    res.success(formattedCategory, 'Category created successfully', 201);
});

// Update category (admin)
exports.updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, parent } = req.body;

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
        return res.error('Category not found', [], 404);
    }

    // Check if parent category exists (if provided)
    if (parent && parent !== existingCategory.parent?.toString()) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
            return res.error('Parent category not found', [], 404);
        }

        // Prevent circular reference
        if (parent === id) {
            return res.error('Category cannot be its own parent', [], 400);
        }
    }

    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (parent !== undefined) updateData.parent = parent || null;

    // Handle image upload from Contabo storage
    if (req.uploadedFile) {
        updateData.image = req.uploadedFile.url;
    }

    // Update category
    const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('parent', 'name slug');

    // Get product count
    const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true
    });

    // Get subcategories
    const subcategories = await Category.find({ parent: category._id })
        .select('name slug');

    const formattedCategory = {
        id: category._id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        image: category.image,
        parent: category.parent ? {
            id: category.parent._id,
            name: category.parent.name,
            slug: category.parent.slug
        } : null,
        product_count: productCount,
        subcategories: subcategories.map(sub => ({
            id: sub._id,
            name: sub.name,
            slug: sub.slug
        })),
        created_at: category.createdAt,
        updated_at: category.updatedAt
    };

    res.success(formattedCategory, 'Category updated successfully');
});

// Delete category (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
        return res.error('Category not found', [], 404);
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
        return res.error('Cannot delete category with existing products', [], 400);
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parent: id });
    if (subcategoryCount > 0) {
        return res.error('Cannot delete category with subcategories', [], 400);
    }

    await Category.findByIdAndDelete(id);

    res.success(null, 'Category deleted successfully');
});

// Get category tree structure with advanced features
exports.getCategoryTree = asyncHandler(async (req, res) => {
    const {
        featured = false,
        includeProducts = false,
        maxDepth = 3,
        minProductCount = 0
    } = req.query;

    let filter = { parent: null, isActive: true };
    if (featured === 'true') {
        filter.isFeatured = true;
    }

    const categories = await Category.find(filter)
        .sort({ sortOrder: 1, name: 1 });

    const buildTree = async (parentCategories, currentDepth = 0) => {
        if (currentDepth >= maxDepth) return [];

        return Promise.all(
            parentCategories.map(async (category) => {
                const subcategories = await Category.find({
                    parent: category._id,
                    isActive: true
                }).sort({ sortOrder: 1, name: 1 });

                const productCount = await Product.countDocuments({
                    category: category._id,
                    isActive: true
                });

                // Skip categories with insufficient products if filter is set
                if (productCount < minProductCount) {
                    return null;
                }

                const categoryData = {
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
                    is_featured: category.isFeatured,
                    sort_order: category.sortOrder,
                    product_count: productCount,
                    has_children: subcategories.length > 0,
                    children: subcategories.length > 0 ?
                        (await buildTree(subcategories, currentDepth + 1)).filter(Boolean) : []
                };

                // Include featured products if requested
                if (includeProducts === 'true') {
                    const featuredProducts = await Product.find({
                        category: category._id,
                        isActive: true,
                        isFeatured: true
                    })
                    .limit(3)
                    .select('name price originalPrice images rating reviewCount slug')
                    .sort({ rating: -1, salesCount: -1 });

                    categoryData.featured_products = featuredProducts.map(product => ({
                        _id: product._id,
                        id: product._id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        original_price: product.originalPrice,
                        discount_percentage: product.calculatedDiscountPercentage,
                        image: product.images && product.images.length > 0 ? product.images[0] : null,
                        rating: product.rating || 0,
                        review_count: product.reviewCount || 0
                    }));
                }

                return categoryData;
            })
        );
    };

    const tree = (await buildTree(categories)).filter(Boolean);

    // Calculate total categories and products
    const totalCategories = await Category.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });

    res.success({
        categories: tree,
        meta: {
            total_categories: totalCategories,
            total_products: totalProducts,
            tree_depth: maxDepth,
            featured_only: featured === 'true',
            includes_products: includeProducts === 'true'
        }
    }, 'Category tree retrieved successfully');
});

// Get category breadcrumb
exports.getCategoryBreadcrumb = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const category = await Category.getCategoryWithPath(slug);
    if (!category) {
        return res.error('Category not found', [], 404);
    }

    res.success({
        category: {
            _id: category._id,
            name: category.name,
            slug: category.slug,
            description: category.description
        },
        breadcrumb: category.breadcrumb
    }, 'Category breadcrumb retrieved successfully');
});

// Get featured categories
exports.getFeaturedCategories = asyncHandler(async (req, res) => {
    const { limit = 6 } = req.query;

    const categories = await Category.find({
        isFeatured: true,
        isActive: true
    })
    .limit(parseInt(limit))
    .sort({ sortOrder: 1, name: 1 });

    const formattedCategories = await Promise.all(
        categories.map(async (category) => {
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
                icon: category.icon,
                color: category.color,
                product_count: productCount,
                sort_order: category.sortOrder
            };
        })
    );

    res.success(formattedCategories, 'Featured categories retrieved successfully');
});

// Search categories
exports.searchCategories = asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
        return res.error('Search query must be at least 2 characters long', [], 400);
    }

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
    .limit(parseInt(limit))
    .select('name slug description image level')
    .sort({ name: 1 });

    const results = await Promise.all(
        categories.map(async (category) => {
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
                product_count: productCount
            };
        })
    );

    res.success({
        categories: results,
        query: q,
        total: results.length
    }, 'Category search completed successfully');
});