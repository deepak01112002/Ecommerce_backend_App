const Product = require('../models/Product');
const Category = require('../models/Category');
const Wishlist = require('../models/Wishlist');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');

// Get all products with advanced filtering and pagination
exports.getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        category,
        search,
        min_price,
        max_price,
        sort_by = 'created_at',
        sort_order = 'desc',
        is_featured,
        is_on_sale,
        in_stock = true
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) {
        filter.category = category;
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $in: [new RegExp(search, 'i')] } }
        ];
    }

    if (min_price || max_price) {
        filter.price = {};
        if (min_price) filter.price.$gte = parseFloat(min_price);
        if (max_price) filter.price.$lte = parseFloat(max_price);
    }

    if (is_featured === 'true') {
        filter.isFeatured = true;
    }

    if (is_on_sale === 'true') {
        filter.$expr = { $lt: ['$price', '$originalPrice'] };
    }

    if (in_stock === 'true') {
        filter.stock = { $gt: 0 };
    }

    // Build sort object
    const sortObj = {};
    const sortField = sort_by === 'created_at' ? 'createdAt' : sort_by;
    sortObj[sortField] = sort_order === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
        .populate('category', 'name slug')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Check if user is authenticated to get wishlist
    let userWishlist = [];
    if (req.user) {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        userWishlist = wishlist ? wishlist.items.map(item => item.product.toString()) : [];
    }

    // Format products
    const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        discount_percentage: product.originalPrice ?
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
        images: product.images || [],
        category: product.category ? {
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug
        } : null,
        rating: product.rating || 0,
        review_count: product.reviewCount || 0,
        stock: product.stock,
        is_in_stock: product.stock > 0,
        is_featured: product.isFeatured || false,
        is_favorite: userWishlist.includes(product._id.toString()),
        variants: product.variants || [],
        tags: product.tags || [],
        created_at: product.createdAt,
        updated_at: product.updatedAt
    }));

    // Pagination info
    const pagination = {
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

    res.paginated(formattedProducts, pagination, 'Products retrieved successfully');
});

// Get product by ID with detailed information
exports.getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
        .populate('category', 'name slug description')
        .populate({
            path: 'reviews',
            populate: {
                path: 'user',
                select: 'name'
            },
            options: { limit: 5, sort: { createdAt: -1 } }
        });

    if (!product) {
        return res.error('Product not found', [], 404);
    }

    if (!product.isActive) {
        return res.error('Product is not available', [], 404);
    }

    // Check if user has this in wishlist
    let isInWishlist = false;
    if (req.user) {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        isInWishlist = wishlist ? wishlist.items.some(item =>
            item.product.toString() === product._id.toString()
        ) : false;
    }

    // Get related products
    const relatedProducts = await Product.find({
        category: product.category._id,
        _id: { $ne: product._id },
        isActive: true
    }).limit(4).select('name price originalPrice images rating reviewCount');

    const formattedProduct = {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        discount_percentage: product.originalPrice ?
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
        images: product.images || [],
        category: {
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description
        },
        rating: product.rating || 0,
        review_count: product.reviewCount || 0,
        stock: product.stock,
        is_in_stock: product.stock > 0,
        is_featured: product.isFeatured || false,
        is_favorite: isInWishlist,
        variants: product.variants || [],
        tags: product.tags || [],
        specifications: product.specifications || {},
        shipping_info: product.shippingInfo || {},
        return_policy: product.returnPolicy || '',
        warranty: product.warranty || '',
        created_at: product.createdAt,
        updated_at: product.updatedAt,
        related_products: relatedProducts.map(p => ({
            id: p._id,
            name: p.name,
            price: p.price,
            original_price: p.originalPrice,
            image: p.images && p.images.length > 0 ? p.images[0] : null,
            rating: p.rating || 0,
            review_count: p.reviewCount || 0
        }))
    };

    res.success(formattedProduct, 'Product details retrieved successfully');
});

// Create product (admin)
exports.createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        originalPrice,
        category,
        stock,
        isActive = true,
        isFeatured = false,
        variants,
        tags,
        specifications,
        shippingInfo,
        returnPolicy,
        warranty
    } = req.body;

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        return res.error('Category not found', [], 404);
    }

    // Handle image uploads
    const images = req.files ? req.files.map(f => f.path) : [];

    // Parse variants if provided as string
    let parsedVariants = [];
    if (variants) {
        try {
            parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        } catch (error) {
            return res.error('Invalid variants format', [], 400);
        }
    }

    // Parse other JSON fields
    let parsedSpecifications = {};
    let parsedShippingInfo = {};
    let parsedTags = [];

    try {
        if (specifications) {
            parsedSpecifications = typeof specifications === 'string' ?
                JSON.parse(specifications) : specifications;
        }
        if (shippingInfo) {
            parsedShippingInfo = typeof shippingInfo === 'string' ?
                JSON.parse(shippingInfo) : shippingInfo;
        }
        if (tags) {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
    } catch (error) {
        return res.error('Invalid JSON format in request', [], 400);
    }

    // Create product
    const product = new Product({
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
        category,
        stock: parseInt(stock),
        isActive,
        isFeatured,
        images,
        variants: parsedVariants,
        tags: parsedTags,
        specifications: parsedSpecifications,
        shippingInfo: parsedShippingInfo,
        returnPolicy,
        warranty
    });

    await product.save();
    await product.populate('category', 'name slug');

    const formattedProduct = {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        category: {
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug
        },
        stock: product.stock,
        is_active: product.isActive,
        is_featured: product.isFeatured,
        images: product.images,
        variants: product.variants,
        tags: product.tags,
        specifications: product.specifications,
        shipping_info: product.shippingInfo,
        return_policy: product.returnPolicy,
        warranty: product.warranty,
        created_at: product.createdAt,
        updated_at: product.updatedAt
    };

    res.success(formattedProduct, 'Product created successfully', 201);
});

// Update product (admin)
exports.updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        price,
        originalPrice,
        category,
        stock,
        isActive,
        isFeatured,
        variants,
        tags,
        specifications,
        shippingInfo,
        returnPolicy,
        warranty
    } = req.body;

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        return res.error('Product not found', [], 404);
    }

    // Validate category if provided
    if (category && category !== existingProduct.category.toString()) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.error('Category not found', [], 404);
        }
    }

    // Prepare update object
    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (originalPrice) updateData.originalPrice = parseFloat(originalPrice);
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (returnPolicy) updateData.returnPolicy = returnPolicy;
    if (warranty) updateData.warranty = warranty;

    // Handle file uploads
    if (req.files && req.files.length > 0) {
        updateData.images = req.files.map(f => f.path);
    }

    // Parse JSON fields
    try {
        if (variants) {
            updateData.variants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        }
        if (tags) {
            updateData.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        }
        if (specifications) {
            updateData.specifications = typeof specifications === 'string' ?
                JSON.parse(specifications) : specifications;
        }
        if (shippingInfo) {
            updateData.shippingInfo = typeof shippingInfo === 'string' ?
                JSON.parse(shippingInfo) : shippingInfo;
        }
    } catch (error) {
        return res.error('Invalid JSON format in request', [], 400);
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate('category', 'name slug');

    const formattedProduct = {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        category: {
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug
        },
        stock: product.stock,
        is_active: product.isActive,
        is_featured: product.isFeatured,
        images: product.images,
        variants: product.variants,
        tags: product.tags,
        specifications: product.specifications,
        shipping_info: product.shippingInfo,
        return_policy: product.returnPolicy,
        warranty: product.warranty,
        created_at: product.createdAt,
        updated_at: product.updatedAt
    };

    res.success(formattedProduct, 'Product updated successfully');
});

// Delete product (admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        return res.error('Product not found', [], 404);
    }

    // Soft delete - just mark as inactive
    await Product.findByIdAndUpdate(id, { isActive: false });

    res.success(null, 'Product deleted successfully');
});

// Permanently delete product (admin)
exports.permanentDeleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
        return res.error('Product not found', [], 404);
    }

    res.success(null, 'Product permanently deleted');
});

// Update inventory (admin)
exports.updateInventory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock, operation = 'set' } = req.body;

    const product = await Product.findById(id);
    if (!product) {
        return res.error('Product not found', [], 404);
    }

    let newStock;
    switch (operation) {
        case 'add':
            newStock = product.stock + parseInt(stock);
            break;
        case 'subtract':
            newStock = Math.max(0, product.stock - parseInt(stock));
            break;
        case 'set':
        default:
            newStock = parseInt(stock);
            break;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { stock: newStock },
        { new: true }
    ).populate('category', 'name');

    res.success({
        id: updatedProduct._id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        previous_stock: product.stock,
        operation,
        updated_at: updatedProduct.updatedAt
    }, 'Inventory updated successfully');
});

// Get featured products
exports.getFeaturedProducts = asyncHandler(async (req, res) => {
    const { limit = 8 } = req.query;

    const products = await Product.find({
        isActive: true,
        isFeatured: true
    })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        price: product.price,
        original_price: product.originalPrice,
        discount_percentage: product.originalPrice ?
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        rating: product.rating || 0,
        review_count: product.reviewCount || 0,
        category: product.category ? {
            id: product.category._id,
            name: product.category.name
        } : null
    }));

    res.success(formattedProducts, 'Featured products retrieved successfully');
});

// Search products
exports.searchProducts = asyncHandler(async (req, res) => {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
        return res.error('Search query is required', [], 400);
    }

    const searchRegex = new RegExp(q, 'i');
    const filter = {
        isActive: true,
        $or: [
            { name: searchRegex },
            { description: searchRegex },
            { tags: { $in: [searchRegex] } }
        ]
    };

    const skip = (page - 1) * limit;
    const products = await Product.find(filter)
        .populate('category', 'name')
        .sort({ rating: -1, reviewCount: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const formattedProducts = products.map(product => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        rating: product.rating || 0,
        review_count: product.reviewCount || 0,
        category: product.category ? {
            id: product.category._id,
            name: product.category.name
        } : null
    }));

    const pagination = {
        currentPage: parseInt(page),
        perPage: parseInt(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

    res.paginated(formattedProducts, pagination, `Search results for "${q}"`);
});