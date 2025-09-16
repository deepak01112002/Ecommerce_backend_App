const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home',
        required: true
    },
    label: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
    },
    alternatePhone: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, 'Please enter a valid alternate phone number']
    },
    addressLine1: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    addressLine2: {
        type: String,
        trim: true,
        maxlength: 100
    },
    landmark: {
        type: String,
        trim: true,
        maxlength: 100
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: 'India',
        maxlength: 50
    },
    postalCode: {
        type: String,
        required: true,
        trim: true,
        match: [/^[1-9][0-9]{5}$/, 'Please enter a valid postal code']
    },
    coordinates: {
        latitude: {
            type: Number,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180
        }
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deliveryInstructions: {
        type: String,
        trim: true,
        maxlength: 200
    },
    addressType: {
        type: String,
        enum: ['apartment', 'house', 'office', 'other'],
        default: 'house'
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/, 'Please enter a valid GST number']
    },
    panNumber: {
        type: String,
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ user: 1, isActive: 1 });
addressSchema.index({ user: 1, type: 1 });

// Virtual for full name
addressSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for complete address
addressSchema.virtual('completeAddress').get(function() {
    let address = this.addressLine1;
    if (this.addressLine2) address += `, ${this.addressLine2}`;
    if (this.landmark) address += `, ${this.landmark}`;
    address += `, ${this.city}, ${this.state} - ${this.postalCode}, ${this.country}`;
    return address;
});

// Virtual for formatted address (for display)
addressSchema.virtual('formattedAddress').get(function() {
    return {
        name: this.fullName,
        phone: this.phone,
        address: this.completeAddress,
        type: this.type,
        label: this.label
    };
});

// Pre-save middleware to ensure only one default address per user
addressSchema.pre('save', async function(next) {
    if (this.isDefault && this.isModified('isDefault')) {
        // Remove default flag from other addresses of the same user
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
    
    // If this is the first address for the user, make it default
    if (this.isNew) {
        const addressCount = await this.constructor.countDocuments({ 
            user: this.user, 
            isActive: true 
        });
        if (addressCount === 0) {
            this.isDefault = true;
        }
    }
    
    next();
});

// Static method to get user's default address
addressSchema.statics.getDefaultAddress = function(userId) {
    return this.findOne({ 
        user: userId, 
        isDefault: true, 
        isActive: true 
    });
};

// Static method to get all user addresses
addressSchema.statics.getUserAddresses = function(userId, options = {}) {
    const query = { user: userId, isActive: true };
    
    if (options.type) {
        query.type = options.type;
    }
    
    return this.find(query)
        .sort({ isDefault: -1, createdAt: -1 })
        .limit(options.limit || 10);
};

// Instance method to set as default
addressSchema.methods.setAsDefault = async function() {
    // Remove default flag from other addresses
    await this.constructor.updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
    );
    
    // Set this address as default
    this.isDefault = true;
    return this.save();
};

// Instance method to validate address completeness
addressSchema.methods.isComplete = function() {
    const requiredFields = [
        'firstName', 'lastName', 'phone', 'addressLine1', 
        'city', 'state', 'country', 'postalCode'
    ];
    
    return requiredFields.every(field => this[field] && this[field].toString().trim());
};

// Instance method to format for order
addressSchema.methods.toOrderFormat = function() {
    return {
        addressId: this._id,
        firstName: this.firstName,
        lastName: this.lastName,
        fullName: this.fullName,
        phone: this.phone,
        alternatePhone: this.alternatePhone,
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        landmark: this.landmark,
        city: this.city,
        state: this.state,
        country: this.country,
        postalCode: this.postalCode,
        completeAddress: this.completeAddress,
        deliveryInstructions: this.deliveryInstructions,
        coordinates: this.coordinates,
        gstNumber: this.gstNumber,
        panNumber: this.panNumber
    };
};

module.exports = mongoose.model('Address', addressSchema);
