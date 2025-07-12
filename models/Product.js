const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    name: String, // e.g., 'Size', 'Color'
    value: String, // e.g., 'M', 'Red'
    stock: { type: Number, default: 0 },
    price: Number // optional, for variant-specific pricing
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    images: [{ type: String }], // file paths or URLs
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    variants: [variantSchema],
    stock: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [{ type: String }],
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    shippingInfo: {
        weight: { type: Number },
        dimensions: {
            length: { type: Number },
            width: { type: Number },
            height: { type: Number }
        },
        shippingCost: { type: Number, default: 0 },
        freeShippingThreshold: { type: Number },
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
    seoTitle: { type: String },
    seoDescription: { type: String },
    slug: { type: String, unique: true }
}, { timestamps: true });

// Generate slug before saving
productSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', productSchema);