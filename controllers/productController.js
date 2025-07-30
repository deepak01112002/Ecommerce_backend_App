const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Wishlist = require('../models/Wishlist');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');
const contaboStorage = require('../services/contaboStorage');

// Get all products with advanced filtering and pagination
exports.getProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        category,
        subcategory,
        search,
        min_price,
        max_price,
        rating,
        brand,
        tags,
        sort_by = 'createdAt',
        sort_order = 'desc',
        is_featured,
        is_bestseller,
        is_new_arrival,
        is_on_sale,
        in_stock = true,
        availability,
        include_variants = false
    } = req.query;

    // Build advanced filter object
    const filter = { isActive: true };

    // Category filtering (including subcategories)
    if (category) {
        if (subcategory) {
            // Handle subcategory by ID or slug
            if (mongoose.Types.ObjectId.isValid(subcategory)) {
                filter.category = subcategory;
            } else {
                const subCategoryDoc = await Category.findOne({ slug: subcategory });
                if (subCategoryDoc) {
                    filter.category = subCategoryDoc._id;
                }
            }
        } else {
            // Handle category by ID or slug
            let categoryDoc;
            if (mongoose.Types.ObjectId.isValid(category)) {
                categoryDoc = await Category.findById(category);
            } else {
                categoryDoc = await Category.findOne({ slug: category });
            }

            if (categoryDoc) {
                if (categoryDoc.level === 0) {
                    // Main category - include all subcategories
                    const subcategories = await Category.find({ parent: categoryDoc._id });
                    const categoryIds = [categoryDoc._id, ...subcategories.map(sub => sub._id)];
                    filter.category = { $in: categoryIds };
                } else {
                    // Subcategory - filter by this category only
                    filter.category = categoryDoc._id;
                }
            }
        }
    }

    // Advanced text search with scoring
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
        filter.tags = { $in: tagArray };
    }

    // Feature flags
    if (is_featured === 'true') {
        filter.isFeatured = true;
    }

    if (is_bestseller === 'true') {
        filter.isBestseller = true;
    }

    if (is_new_arrival === 'true') {
        filter.isNewArrival = true;
    }

    if (is_on_sale === 'true') {
        filter.$expr = { $lt: ['$price', '$originalPrice'] };
    }

    // Stock and availability filtering
    if (in_stock === 'true') {
        filter.stock = { $gt: 0 };
    }

    if (availability) {
        filter.availability = availability;
    }

    // Advanced sorting options
    const sortObj = {};
    let sortField = sort_by;

    // Map sort fields to actual database fields
    const sortFieldMap = {
        'created_at': 'createdAt',
        'updated_at': 'updatedAt',
        'name': 'name',
        'price': 'price',
        'rating': 'rating',
        'popularity': 'salesCount',
        'views': 'viewCount',
        'newest': 'createdAt',
        'oldest': 'createdAt',
        'price_low_high': 'price',
        'price_high_low': 'price',
        'rating_high_low': 'rating',
        'best_selling': 'salesCount'
    };

    if (sortFieldMap[sort_by]) {
        sortField = sortFieldMap[sort_by];
    }

    // Handle special sorting cases
    if (sort_by === 'price_low_high') {
        sortObj[sortField] = 1;
    } else if (sort_by === 'price_high_low' || sort_by === 'rating_high_low' || sort_by === 'best_selling') {
        sortObj[sortField] = -1;
    } else if (sort_by === 'oldest') {
        sortObj[sortField] = 1;
    } else {
        sortObj[sortField] = sort_order === 'desc' ? -1 : 1;
    }

    // Add text search score sorting if search is present
    if (search) {
        sortObj.score = { $meta: 'textScore' };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    let query = Product.find(filter)
        .populate('category', 'name slug path')
        .populate('subcategory', 'name slug');

    // Add text search projection if searching
    if (search) {
        query = query.select({ score: { $meta: 'textScore' } });
    }

    const products = await query
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

    // Format products with enhanced data
    const formattedProducts = products.map(product => {
        const discountPercentage = product.originalPrice && product.originalPrice > product.price ?
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

        const baseProduct = {
            _id: product._id,
            id: product._id,
            name: product.name,
            description: product.description,
            short_description: product.shortDescription,
            slug: product.slug,
            sku: product.sku,
            price: product.price,
            original_price: product.originalPrice,
            discount_percentage: discountPercentage,
            discount_amount: product.originalPrice ? product.originalPrice - product.price : 0,
            images: product.images || [],
            category: product.category ? {
                _id: product.category._id,
                id: product.category._id,
                name: product.category.name,
                slug: product.category.slug,
                path: product.category.path
            } : null,
            brand: product.brand,
            rating: product.rating || 0,
            review_count: product.reviewCount || 0,
            stock: product.stock,
            min_order_quantity: product.minOrderQuantity,
            max_order_quantity: product.maxOrderQuantity,
            availability: product.availability,
            stock_status: product.stockStatus,
            is_in_stock: product.stock > 0,
            is_active: product.isActive,
            is_featured: product.isFeatured || false,
            is_bestseller: product.isBestseller || false,
            is_new_arrival: product.isNewArrival || false,
            is_favorite: userWishlist.includes(product._id.toString()),
            view_count: product.viewCount || 0,
            sales_count: product.salesCount || 0,
            tags: product.tags || [],
            specifications: product.specifications || {},
            created_at: product.createdAt,
            updated_at: product.updatedAt
        };

        // Include variants if requested
        if (include_variants === 'true') {
            baseProduct.variants = product.variants || [];
        }

        // Include search score if available
        if (product.score) {
            baseProduct.search_score = product.score;
        }

        return baseProduct;
    });

    // Enhanced pagination info with filters summary
    const pagination = {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
    };

    // Add filter summary
    const appliedFilters = {
        category: category || null,
        subcategory: subcategory || null,
        search: search || null,
        price_range: (min_price || max_price) ? { min: min_price, max: max_price } : null,
        rating: rating || null,
        brand: brand || null,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : null,
        sort_by,
        sort_order,
        features: {
            featured: is_featured === 'true',
            bestseller: is_bestseller === 'true',
            new_arrival: is_new_arrival === 'true',
            on_sale: is_on_sale === 'true',
            in_stock: in_stock === 'true'
        }
    };

    res.success({
        products: formattedProducts,
        pagination,
        filters: appliedFilters,
        meta: {
            total_found: total,
            showing: formattedProducts.length,
            search_query: search || null
        }
    }, 'Products retrieved successfully');
});

// Get product by ID with detailed information
exports.getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(id)
        .populate('category', 'name slug description');

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
        _id: product._id,
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        discount_percentage: product.originalPrice ?
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0,
        images: product.images || [],
        category: {
            _id: product.category._id,
            id: product.category._id,
            name: product.category.name,
            slug: product.category.slug,
            description: product.category.description
        },
        rating: product.rating || 0,
        review_count: product.reviewCount || 0,
        stock: product.stock,
        is_in_stock: product.stock > 0,
        is_active: product.isActive,
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
            _id: p._id,
            id: p._id,
            name: p.name,
            price: p.price,
            original_price: p.originalPrice,
            image: p.images && p.images.length > 0 ? p.images[0] : null,
            rating: p.rating || 0,
            review_count: p.reviewCount || 0
        }))
    };

    res.success({
        product: formattedProduct
    }, 'Product details retrieved successfully');
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
        warranty,
        // Individual specification fields
        material,
        height,
        width,
        weight,
        finish,
        origin,
        color,
        style,
        occasion,
        careInstructions
    } = req.body;

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
        return res.error('Category not found', [], 404);
    }

    // Handle image uploads from Contabo storage
    const images = req.uploadedFiles ? req.uploadedFiles.map(f => f.url) : [];

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
        } else {
            // Build specifications from individual fields
            parsedSpecifications = {
                material: material || '',
                height: height || '',
                width: width || '',
                weight: weight || '',
                finish: finish || '',
                origin: origin || '',
                color: color || '',
                style: style || '',
                occasion: occasion || '',
                careInstructions: careInstructions || ''
            };
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
        _id: product._id,
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        category: {
            _id: product.category._id,
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
        warranty,
        // Individual specification fields
        material,
        height,
        width,
        weight,
        finish,
        origin,
        color,
        style,
        occasion,
        careInstructions
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

    // Handle image updates and deletions
    let updatedImages = [...existingProduct.images]; // Start with existing images

    // Handle image deletions
    if (req.body.imagesToDelete) {
        try {
            const imagesToDelete = typeof req.body.imagesToDelete === 'string'
                ? JSON.parse(req.body.imagesToDelete)
                : req.body.imagesToDelete;

            if (Array.isArray(imagesToDelete)) {
                // Remove deleted images from the array
                updatedImages = updatedImages.filter(img => !imagesToDelete.includes(img));

                // Delete images from S3 storage
                for (const imageUrl of imagesToDelete) {
                    try {
                        // Extract S3 key from URL for deletion
                        const s3Key = contaboStorage.extractS3KeyFromUrl(imageUrl);
                        if (s3Key) {
                            await contaboStorage.deleteFile(s3Key);
                            console.log(`Deleted image from S3: ${s3Key}`);
                        }
                    } catch (deleteError) {
                        console.error(`Failed to delete image from S3: ${imageUrl}`, deleteError);
                        // Continue with other deletions even if one fails
                    }
                }
            }
        } catch (error) {
            console.error('Error processing imagesToDelete:', error);
            return res.error('Invalid imagesToDelete format', [], 400);
        }
    }

    // Handle new file uploads from Contabo storage
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
        const newImageUrls = req.uploadedFiles.map(f => f.url);
        updatedImages = [...updatedImages, ...newImageUrls]; // Add new images to existing ones
    }

    // Update images array
    updateData.images = updatedImages;

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
        } else if (material || height || width || weight || finish || origin || color || style || occasion || careInstructions) {
            // Build specifications from individual fields
            updateData.specifications = {
                material: material || '',
                height: height || '',
                width: width || '',
                weight: weight || '',
                finish: finish || '',
                origin: origin || '',
                color: color || '',
                style: style || '',
                occasion: occasion || '',
                careInstructions: careInstructions || ''
            };
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
        _id: product._id,
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: product.originalPrice,
        category: {
            _id: product.category._id,
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
        images : product.images && product.images.length > 0 ? product.images : null,
        rating: product.rating || 0,
        review_count: product.reviewCount || 0,
        category: product.category ? {
            id: product.category._id,
            name: product.category.name
        } : null,
        specifications: product.specifications || {}
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
        } : null,
        specifications: product.specifications || {}
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

// Get product recommendations
exports.getProductRecommendations = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 6, type = 'related' } = req.query;

    const product = await Product.findById(id).populate('category');
    if (!product) {
        return res.error('Product not found', [], 404);
    }

    let recommendations = [];

    switch (type) {
        case 'related':
            // Products from same category with similar price range
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
            .sort({ rating: -1, salesCount: -1 });
            break;

        case 'similar':
            // Products with similar tags
            recommendations = await Product.find({
                _id: { $ne: id },
                tags: { $in: product.tags },
                isActive: true
            })
            .limit(parseInt(limit))
            .sort({ rating: -1 });
            break;

        case 'frequently_bought':
            // Most popular products from same category
            recommendations = await Product.find({
                _id: { $ne: id },
                category: product.category._id,
                isActive: true
            })
            .limit(parseInt(limit))
            .sort({ salesCount: -1, rating: -1 });
            break;

        case 'trending':
            // Trending products (high view count, recent)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            recommendations = await Product.find({
                _id: { $ne: id },
                createdAt: { $gte: thirtyDaysAgo },
                isActive: true
            })
            .limit(parseInt(limit))
            .sort({ viewCount: -1, salesCount: -1 });
            break;

        default:
            recommendations = await Product.find({
                _id: { $ne: id },
                category: product.category._id,
                isActive: true
            })
            .limit(parseInt(limit))
            .sort({ rating: -1 });
    }

    const formattedRecommendations = recommendations.map(rec => ({
        _id: rec._id,
        id: rec._id,
        name: rec.name,
        slug: rec.slug,
        price: rec.price,
        original_price: rec.originalPrice,
        discount_percentage: rec.calculatedDiscountPercentage,
        image: rec.images && rec.images.length > 0 ? rec.images[0] : null,
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
        }
    }, `${type} recommendations retrieved successfully`);
});