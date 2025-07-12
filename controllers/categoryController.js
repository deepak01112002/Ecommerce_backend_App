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

    // Handle image upload
    const image = req.file ? req.file.path : undefined;

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

    // Handle image upload
    if (req.file) {
        updateData.image = req.file.path;
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

// Get category tree structure
exports.getCategoryTree = asyncHandler(async (req, res) => {
    const categories = await Category.find({ parent: null })
        .sort({ name: 1 });

    const buildTree = async (parentCategories) => {
        return Promise.all(
            parentCategories.map(async (category) => {
                const subcategories = await Category.find({ parent: category._id })
                    .sort({ name: 1 });

                const productCount = await Product.countDocuments({
                    category: category._id,
                    isActive: true
                });

                return {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    image: category.image,
                    product_count: productCount,
                    children: subcategories.length > 0 ? await buildTree(subcategories) : []
                };
            })
        );
    };

    const tree = await buildTree(categories);

    res.success(tree, 'Category tree retrieved successfully');
});