const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
    platform: {
        type: String,
        required: true,
        enum: ['youtube', 'facebook', 'whatsapp', 'instagram', 'twitter', 'linkedin', 'telegram', 'website', 'custom'],
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    url: {
        type: String,
        required: function() {
            // URL is not required for WhatsApp as it will be auto-generated
            return this.platform !== 'whatsapp';
        },
        trim: true,
        validate: {
            validator: function(v) {
                // Skip validation if empty and platform is whatsapp
                if (!v && this.platform === 'whatsapp') return true;

                // More flexible URL validation
                const httpRegex = /^https?:\/\/.+/i;
                const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}.*$/;
                const specialRegex = /^(tel:|mailto:|whatsapp:)/;

                return httpRegex.test(v) || domainRegex.test(v) || specialRegex.test(v);
            },
            message: 'Please enter a valid URL'
        }
    },
    icon: {
        type: String,
        trim: true,
        default: function() {
            // Return empty string to let frontend handle platform-specific icons
            return '';
        }
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    displayOrder: {
        type: Number,
        default: 0,
        index: true
    },
    openInNewTab: {
        type: Boolean,
        default: true
    },
    showOnMobile: {
        type: Boolean,
        default: true
    },
    showOnWeb: {
        type: Boolean,
        default: true
    },
    // Special fields for WhatsApp Business
    whatsappConfig: {
        phoneNumber: {
            type: String,
            trim: true
        },
        defaultMessage: {
            type: String,
            trim: true,
            maxlength: 500,
            default: 'Hello! I am interested in your products.'
        }
    },
    // Analytics tracking
    clickCount: {
        type: Number,
        default: 0
    },
    lastClicked: {
        type: Date
    },
    // Admin info
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
socialMediaSchema.index({ platform: 1, isActive: 1 });
socialMediaSchema.index({ displayOrder: 1, isActive: 1 });
socialMediaSchema.index({ createdAt: -1 });

// Virtual for formatted WhatsApp URL
socialMediaSchema.virtual('formattedWhatsappUrl').get(function() {
    if (this.platform === 'whatsapp' && this.whatsappConfig?.phoneNumber) {
        const phone = this.whatsappConfig.phoneNumber.replace(/[^\d]/g, '');
        const message = encodeURIComponent(this.whatsappConfig.defaultMessage || '');
        return `https://wa.me/${phone}?text=${message}`;
    }
    return this.url;
});

// Pre-save middleware
socialMediaSchema.pre('save', function(next) {
    // Auto-generate WhatsApp URL if platform is whatsapp
    if (this.platform === 'whatsapp' && this.whatsappConfig?.phoneNumber) {
        const phone = this.whatsappConfig.phoneNumber.replace(/[^\d]/g, '');
        const message = encodeURIComponent(this.whatsappConfig.defaultMessage || '');
        this.url = `https://wa.me/${phone}?text=${message}`;
    }
    
    // Ensure unique display order per active status
    if (this.isNew || this.isModified('displayOrder')) {
        this.constructor.findOne({
            _id: { $ne: this._id },
            displayOrder: this.displayOrder,
            isActive: this.isActive
        }).then(existing => {
            if (existing) {
                this.displayOrder = Date.now(); // Use timestamp as fallback
            }
        });
    }
    
    next();
});

// Static methods
socialMediaSchema.statics.getActiveSocialMedia = function() {
    return this.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: 1 })
        .populate('createdBy updatedBy', 'firstName lastName');
};

socialMediaSchema.statics.incrementClickCount = function(id) {
    return this.findByIdAndUpdate(id, {
        $inc: { clickCount: 1 },
        $set: { lastClicked: new Date() }
    });
};

// Instance methods
socialMediaSchema.methods.getDisplayUrl = function() {
    if (this.platform === 'whatsapp') {
        return this.formattedWhatsappUrl;
    }
    return this.url;
};

module.exports = mongoose.model('SocialMedia', socialMediaSchema);
