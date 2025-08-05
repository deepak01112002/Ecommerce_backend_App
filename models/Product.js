const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    value: { type: String, required: true, index: true },
    stock: { type: Number, default: 0, min: 0 },
    price: { type: Number, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true }
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        trim: true,
        index: 'text'
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: 200
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        index: true
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    images: [{
        type: String,
        required: true
    }],
    imageHashes: [{
        imageUrl: { type: String, required: true },
        hashes: {
            standard: { type: String },
            rotated_90: { type: String },
            rotated_180: { type: String },
            rotated_270: { type: String },
            flipped: { type: String },
            flopped: { type: String }
        },
        colorHistogram: {
            red: [{ type: Number }],
            green: [{ type: Number }],
            blue: [{ type: Number }]
        },
        metadata: {
            width: { type: Number },
            height: { type: Number },
            format: { type: String },
            aspectRatio: { type: Number }
        },
        createdAt: { type: Date, default: Date.now }
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        index: true
    },
    brand: {
        type: String,
        trim: true,
        index: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    variants: [variantSchema],
    stock: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    minOrderQuantity: {
        type: Number,
        default: 1,
        min: 1
    },
    maxOrderQuantity: {
        type: Number,
        default: 10
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        index: true
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    salesCount: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    isNewArrival: {
        type: Boolean,
        default: false,
        index: true
    },
    isBestseller: {
        type: Boolean,
        default: false,
        index: true
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        index: true
    }],

    // GST & Tax fields
    hsnCode: {
        type: String,
        default: '9999',
        trim: true
    },
    gstRate: {
        type: Number,
        default: 18,
        min: 0,
        max: 100
    },
    taxCategory: {
        type: String,
        enum: ['taxable', 'exempt', 'zero_rated'],
        default: 'taxable'
    },
    specifications: {
        material: { type: String, trim: true },
        height: { type: String, trim: true },
        width: { type: String, trim: true },
        weight: { type: String, trim: true },
        finish: { type: String, trim: true },
        origin: { type: String, trim: true },
        color: { type: String, trim: true },
        style: { type: String, trim: true },
        occasion: { type: String, trim: true },
        careInstructions: { type: String, trim: true },
        additionalInfo: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    shippingInfo: {
        weight: { type: Number, min: 0 },
        dimensions: {
            length: { type: Number, min: 0 },
            width: { type: Number, min: 0 },
            height: { type: Number, min: 0 }
        },
        shippingCost: { type: Number, default: 0, min: 0 },
        freeShippingThreshold: { type: Number, min: 0 },
        estimatedDelivery: { type: String }
    },
    returnPolicy: {
        type: String,
        default: '7 days return policy'
    },
    warranty: {
        type: String,
        default: '1 year manufacturer warranty'
    },
    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    metaKeywords: [{ type: String, trim: true }],
    slug: {
        type: String,
        unique: true,
        index: true
    },
    availability: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'pre_order', 'discontinued'],
        default: 'in_stock',
        index: true
    },
    launchDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for discount percentage calculation
productSchema.virtual('discountAmount').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return this.originalPrice - this.price;
    }
    return 0;
});

// Virtual for calculated discount percentage
productSchema.virtual('calculatedDiscountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
    if (this.stock <= 0) return 'out_of_stock';
    if (this.stock <= 5) return 'low_stock';
    return 'in_stock';
});

// Virtual for reviews
productSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product'
});

// Generate slug and SKU before saving
productSchema.pre('save', async function(next) {
    if (this.isModified('name') && !this.slug) {
        let baseSlug = this.name.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');

        // Ensure unique slug
        let slug = baseSlug;
        let counter = 1;
        while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        this.slug = slug;
    }

    // Generate SKU if not provided
    if (!this.sku) {
        const prefix = this.category ? 'PRD' : 'GEN';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.sku = `${prefix}-${timestamp}-${random}`;
    }

    // Calculate discount percentage
    if (this.originalPrice && this.originalPrice > this.price) {
        this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }

    // Update availability based on stock
    if (this.stock <= 0) {
        this.availability = 'out_of_stock';
    } else {
        this.availability = 'in_stock';
    }

    next();
});

// Update view count
productSchema.methods.incrementViewCount = function() {
    this.viewCount += 1;
    return this.save();
};

// Update sales count
productSchema.methods.incrementSalesCount = function(quantity = 1) {
    this.salesCount += quantity;
    return this.save();
};

// Static method for advanced search
productSchema.statics.advancedSearch = function(searchOptions = {}) {
    const {
        query,
        category,
        minPrice,
        maxPrice,
        rating,
        tags,
        sortBy = 'createdAt',
        sortOrder = -1,
        page = 1,
        limit = 12,
        isActive = true
    } = searchOptions;

    const filter = { isActive };

    // Text search
    if (query) {
        filter.$text = { $search: query };
    }

    // Category filter
    if (category) {
        filter.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Rating filter
    if (rating) {
        filter.rating = { $gte: rating };
    }

    // Tags filter
    if (tags && tags.length > 0) {
        filter.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;

    return this.find(filter)
        .populate('category', 'name slug')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);
};

// Comprehensive indexes for optimal performance
productSchema.index({ name: 'text', description: 'text', tags: 'text', shortDescription: 'text' });
productSchema.index({ category: 1, isActive: 1, isFeatured: -1 });
productSchema.index({ category: 1, price: 1, isActive: 1 });
productSchema.index({ category: 1, rating: -1, isActive: 1 });
productSchema.index({ category: 1, salesCount: -1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });
productSchema.index({ rating: -1, isActive: 1 });
productSchema.index({ createdAt: -1, isActive: 1 });
productSchema.index({ isFeatured: -1, isActive: 1 });
productSchema.index({ isBestseller: -1, isActive: 1 });
productSchema.index({ isNewArrival: -1, isActive: 1 });
productSchema.index({ tags: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ availability: 1, isActive: 1 });
productSchema.index({ stock: 1, isActive: 1 });
productSchema.index({ viewCount: -1, isActive: 1 });
productSchema.index({ salesCount: -1, isActive: 1 });
productSchema.index({ 'imageHashes.hashes.standard': 1, isActive: 1 });
productSchema.index({ 'imageHashes.imageUrl': 1 });

module.exports = mongoose.model('Product', productSchema);