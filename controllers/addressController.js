const Address = require('../models/Address');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get all user addresses
exports.getUserAddresses = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { type, limit = 10 } = req.query;

    const addresses = await Address.getUserAddresses(userId, { type, limit: parseInt(limit) });

    res.success({
        addresses: addresses.map(address => ({
            _id: address._id,
            type: address.type,
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            alternatePhone: address.alternatePhone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            completeAddress: address.completeAddress,
            isDefault: address.isDefault,
            isActive: address.isActive,
            deliveryInstructions: address.deliveryInstructions,
            addressType: address.addressType,
            createdAt: address.createdAt
        })),
        total: addresses.length
    }, 'Addresses retrieved successfully');
});

// Get single address
exports.getAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, user: userId, isActive: true });

    if (!address) {
        return res.error('Address not found', [], 404);
    }

    res.success({
        address: {
            _id: address._id,
            type: address.type,
            label: address.label,
            firstName: address.firstName,
            lastName: address.lastName,
            fullName: address.fullName,
            phone: address.phone,
            alternatePhone: address.alternatePhone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            completeAddress: address.completeAddress,
            isDefault: address.isDefault,
            deliveryInstructions: address.deliveryInstructions,
            addressType: address.addressType,
            coordinates: address.coordinates,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt
        }
    }, 'Address retrieved successfully');
});

// Add new address
exports.addAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const {
        type = 'home',
        label,
        firstName,
        lastName,
        phone,
        alternatePhone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        country = 'India',
        postalCode,
        isDefault = false,
        deliveryInstructions,
        addressType = 'house',
        coordinates
    } = req.body;

    // Create new address
    const address = new Address({
        user: userId,
        type,
        label: label || `${type.charAt(0).toUpperCase() + type.slice(1)} Address`,
        firstName,
        lastName,
        phone,
        alternatePhone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        country,
        postalCode,
        isDefault,
        deliveryInstructions,
        addressType,
        coordinates
    });

    await address.save();

    res.success({
        address: {
            _id: address._id,
            type: address.type,
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            completeAddress: address.completeAddress,
            isDefault: address.isDefault,
            createdAt: address.createdAt
        }
    }, 'Address added successfully', 201);
});

// Update address
exports.updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, user: userId, isActive: true });

    if (!address) {
        return res.error('Address not found', [], 404);
    }

    // Update fields
    const updateFields = [
        'type', 'label', 'firstName', 'lastName', 'phone', 'alternatePhone',
        'addressLine1', 'addressLine2', 'landmark', 'city', 'state', 'country',
        'postalCode', 'deliveryInstructions', 'addressType', 'coordinates'
    ];

    updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
            address[field] = req.body[field];
        }
    });

    // Handle default address change
    if (req.body.isDefault === true) {
        await address.setAsDefault();
    }

    await address.save();

    res.success({
        address: {
            _id: address._id,
            type: address.type,
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            completeAddress: address.completeAddress,
            isDefault: address.isDefault,
            updatedAt: address.updatedAt
        }
    }, 'Address updated successfully');
});

// Set address as default
exports.setDefaultAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, user: userId, isActive: true });

    if (!address) {
        return res.error('Address not found', [], 404);
    }

    await address.setAsDefault();

    res.success({
        address: {
            _id: address._id,
            label: address.label,
            isDefault: address.isDefault
        }
    }, 'Default address updated successfully');
});

// Delete address (soft delete)
exports.deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, user: userId, isActive: true });

    if (!address) {
        return res.error('Address not found', [], 404);
    }

    // Check if it's the default address
    if (address.isDefault) {
        const otherAddresses = await Address.find({
            user: userId,
            _id: { $ne: id },
            isActive: true
        }).limit(1);

        if (otherAddresses.length > 0) {
            // Set another address as default
            await otherAddresses[0].setAsDefault();
        }
    }

    // Soft delete
    address.isActive = false;
    await address.save();

    res.success({
        message: 'Address deleted successfully'
    }, 'Address deleted successfully');
});

// Get default address
exports.getDefaultAddress = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const address = await Address.getDefaultAddress(userId);

    if (!address) {
        return res.error('No default address found', [], 404);
    }

    res.success({
        address: address.formattedAddress
    }, 'Default address retrieved successfully');
});

// Validate address
exports.validateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, user: userId, isActive: true });

    if (!address) {
        return res.error('Address not found', [], 404);
    }

    const isComplete = address.isComplete();
    const validation = {
        isValid: isComplete,
        address: address.formattedAddress,
        issues: []
    };

    if (!isComplete) {
        const requiredFields = ['firstName', 'lastName', 'phone', 'addressLine1', 'city', 'state', 'country', 'postalCode'];
        requiredFields.forEach(field => {
            if (!address[field] || !address[field].toString().trim()) {
                validation.issues.push(`${field} is required`);
            }
        });
    }

    res.success({
        validation
    }, isComplete ? 'Address is valid' : 'Address validation failed');
});
