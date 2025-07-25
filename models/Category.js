const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true
    },
    level: {
        type: Number,
        default: 0,
        index: true
    },
    path: {
        type: String,
        index: true
    },
    image: {
        type: String
    },
    icon: {
        type: String
    },
    color: {
        type: String,
        default: '#000000'
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
    sortOrder: {
        type: Number,
        default: 0,
        index: true
    },
    productCount: {
        type: Number,
        default: 0
    },
    seoTitle: {
        type: String
    },
    seoDescription: {
        type: String
    },
    metaKeywords: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Virtual for products count
categorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// Generate slug and path before saving
categorySchema.pre('save', async function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name.toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    // Set level and path based on parent
    if (this.parent) {
        const parent = await mongoose.model('Category').findById(this.parent);
        if (parent) {
            this.level = parent.level + 1;
            this.path = parent.path ? `${parent.path}/${this.slug}` : this.slug;
        }
    } else {
        this.level = 0;
        this.path = this.slug;
    }

    next();
});

// Update product count after save
categorySchema.post('save', async function() {
    const productCount = await mongoose.model('Product').countDocuments({ category: this._id });
    await mongoose.model('Category').findByIdAndUpdate(this._id, { productCount });
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
    const categories = await this.find({ isActive: true })
        .populate('subcategories')
        .sort({ sortOrder: 1, name: 1 });

    const categoryMap = {};
    const rootCategories = [];

    // Create a map of all categories
    categories.forEach(category => {
        categoryMap[category._id] = {
            ...category.toObject(),
            subcategories: []
        };
    });

    // Build the tree structure
    categories.forEach(category => {
        if (category.parent) {
            if (categoryMap[category.parent]) {
                categoryMap[category.parent].subcategories.push(categoryMap[category._id]);
            }
        } else {
            rootCategories.push(categoryMap[category._id]);
        }
    });

    return rootCategories;
};

// Static method to get category with full path
categorySchema.statics.getCategoryWithPath = async function(slug) {
    const category = await this.findOne({ slug, isActive: true })
        .populate('parent')
        .populate('subcategories');

    if (!category) return null;

    const path = [];
    let current = category;

    while (current) {
        path.unshift({
            _id: current._id,
            name: current.name,
            slug: current.slug
        });
        current = current.parent;
    }

    return {
        ...category.toObject(),
        breadcrumb: path
    };
};

// Compound indexes for better performance
categorySchema.index({ parent: 1, isActive: 1, sortOrder: 1 });
categorySchema.index({ slug: 1, isActive: 1 });
categorySchema.index({ name: 1, isActive: 1 });
categorySchema.index({ level: 1, isActive: 1 });
categorySchema.index({ isFeatured: 1, isActive: 1 });
categorySchema.index({ path: 1 });

module.exports = mongoose.model('Category', categorySchema);