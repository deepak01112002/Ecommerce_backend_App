const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
    // Application Status
    isApplicationActive: {
        type: Boolean,
        default: true,
        required: true
    },
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    
    // Maintenance/Inactive Messages
    inactiveMessage: {
        title: {
            type: String,
            default: 'Application Temporarily Unavailable',
            maxlength: 100
        },
        message: {
            type: String,
            default: 'We are currently updating our services. Please check back later.',
            maxlength: 500
        },
        showContactInfo: {
            type: Boolean,
            default: true
        }
    },
    
    // Business Hours
    businessHours: {
        enabled: {
            type: Boolean,
            default: false
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata'
        },
        schedule: {
            monday: {
                open: { type: String, default: '09:00' },
                close: { type: String, default: '18:00' },
                isOpen: { type: Boolean, default: true }
            },
            tuesday: {
                open: { type: String, default: '09:00' },
                close: { type: String, default: '18:00' },
                isOpen: { type: Boolean, default: true }
            },
            wednesday: {
                open: { type: String, default: '09:00' },
                close: { type: String, default: '18:00' },
                isOpen: { type: Boolean, default: true }
            },
            thursday: {
                open: { type: String, default: '09:00' },
                close: { type: String, default: '18:00' },
                isOpen: { type: Boolean, default: true }
            },
            friday: {
                open: { type: String, default: '09:00' },
                close: { type: String, default: '18:00' },
                isOpen: { type: Boolean, default: true }
            },
            saturday: {
                open: { type: String, default: '09:00' },
                close: { type: String, default: '18:00' },
                isOpen: { type: Boolean, default: true }
            },
            sunday: {
                open: { type: String, default: '10:00' },
                close: { type: String, default: '17:00' },
                isOpen: { type: Boolean, default: false }
            }
        },
        outsideHoursMessage: {
            type: String,
            default: 'We are currently closed. Please visit us during business hours.'
        }
    },
    
    // Order Settings
    orderSettings: {
        allowOrders: {
            type: Boolean,
            default: true
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        maxOrderAmount: {
            type: Number,
            default: 50000,
            min: 0
        },
        allowCOD: {
            type: Boolean,
            default: true
        },
        allowOnlinePayment: {
            type: Boolean,
            default: true
        }
    },
    
    // Delivery Settings
    deliverySettings: {
        allowDelivery: {
            type: Boolean,
            default: true
        },
        freeDeliveryThreshold: {
            type: Number,
            default: 500,
            min: 0
        },
        deliveryCharges: {
            type: Number,
            default: 50,
            min: 0
        },
        estimatedDeliveryDays: {
            min: { type: Number, default: 2 },
            max: { type: Number, default: 7 }
        }
    },
    
    // Contact Information
    contactInfo: {
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        whatsapp: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    
    // App Version Control
    appVersion: {
        current: {
            type: String,
            default: '1.0.0'
        },
        minimum: {
            type: String,
            default: '1.0.0'
        },
        forceUpdate: {
            type: Boolean,
            default: false
        },
        updateMessage: {
            type: String,
            default: 'Please update your app to the latest version for better experience.'
        }
    },
    
    // Feature Flags
    features: {
        enableWishlist: { type: Boolean, default: true },
        enableReviews: { type: Boolean, default: true },
        enableReferral: { type: Boolean, default: false },
        enableLoyaltyPoints: { type: Boolean, default: false },
        enableChat: { type: Boolean, default: false },
        enableNotifications: { type: Boolean, default: true }
    },
    
    // Admin Info
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Singleton pattern - only one settings document
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId('000000000000000000000001')
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure only one settings document exists
appSettingsSchema.index({ _id: 1 }, { unique: true });

// Virtual for current status
appSettingsSchema.virtual('currentStatus').get(function() {
    if (this.maintenanceMode) return 'maintenance';
    if (!this.isApplicationActive) return 'inactive';
    
    // Check business hours if enabled
    if (this.businessHours.enabled) {
        const now = new Date();
        const day = now.toLocaleLowerCase().substring(0, 3) + 
                   now.toLocaleLowerCase().substring(3);
        const daySchedule = this.businessHours.schedule[day];
        
        if (daySchedule && daySchedule.isOpen) {
            const currentTime = now.toTimeString().substring(0, 5);
            if (currentTime < daySchedule.open || currentTime > daySchedule.close) {
                return 'closed';
            }
        } else {
            return 'closed';
        }
    }
    
    return 'active';
});

// Static methods
appSettingsSchema.statics.getSettings = function() {
    return this.findById('000000000000000000000001')
        .populate('lastUpdatedBy', 'firstName lastName')
        .then(settings => {
            if (!settings) {
                // Create default settings if none exist
                return this.create({
                    _id: '000000000000000000000001'
                });
            }
            return settings;
        });
};

appSettingsSchema.statics.updateSettings = function(updates, updatedBy) {
    return this.findByIdAndUpdate(
        '000000000000000000000001',
        { ...updates, lastUpdatedBy: updatedBy },
        { new: true, upsert: true, runValidators: true }
    ).populate('lastUpdatedBy', 'firstName lastName');
};

// Instance methods
appSettingsSchema.methods.canPlaceOrder = function() {
    return this.isApplicationActive && 
           !this.maintenanceMode && 
           this.orderSettings.allowOrders &&
           this.currentStatus === 'active';
};

appSettingsSchema.methods.getInactivePopupData = function() {
    const status = this.currentStatus;
    
    if (status === 'active') return null;
    
    let title, message;
    
    switch (status) {
        case 'maintenance':
            title = 'Under Maintenance';
            message = 'We are currently updating our services. Please check back later.';
            break;
        case 'inactive':
            title = this.inactiveMessage.title;
            message = this.inactiveMessage.message;
            break;
        case 'closed':
            title = 'Currently Closed';
            message = this.businessHours.outsideHoursMessage;
            break;
        default:
            return null;
    }
    
    return {
        title,
        message,
        showContactInfo: this.inactiveMessage.showContactInfo,
        contactInfo: this.inactiveMessage.showContactInfo ? this.contactInfo : null,
        canBrowse: status !== 'maintenance',
        canOrder: false
    };
};

module.exports = mongoose.model('AppSettings', appSettingsSchema);
