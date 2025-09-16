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
            gstNumber: address.gstNumber,
            panNumber: address.panNumber,
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
            gstNumber: address.gstNumber,
            panNumber: address.panNumber,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt
        }
    }, 'Address retrieved successfully');
});

// Add new address
exports.addAddress = asyncHandler(async (req, res) => {
    console.log('🔍 [DEBUG] addAddress called');
    console.log('📋 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 [DEBUG] User ID:', req.user._id);
    
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
        coordinates,
        gstNumber,
        panNumber
    } = req.body;

    // Debug GST and PAN numbers
    console.log('🏢 [DEBUG] GST Number received:', gstNumber);
    console.log('🏢 [DEBUG] GST Number type:', typeof gstNumber);
    console.log('🏢 [DEBUG] GST Number length:', gstNumber ? gstNumber.length : 'null/undefined');
    console.log('📄 [DEBUG] PAN Number received:', panNumber);
    console.log('📄 [DEBUG] PAN Number type:', typeof panNumber);
    console.log('📄 [DEBUG] PAN Number length:', panNumber ? panNumber.length : 'null/undefined');

    // Create new address
    console.log('🏗️ [DEBUG] Creating address object...');
    const addressData = {
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
        coordinates,
        gstNumber,
        panNumber
    };
    
    console.log('📝 [DEBUG] Address data to create:', JSON.stringify(addressData, null, 2));
    
    const address = new Address(addressData);
    console.log('✅ [DEBUG] Address object created successfully');

    console.log('💾 [DEBUG] Attempting to save address...');
    try {
        await address.save();
        console.log('✅ [DEBUG] Address saved successfully');
        console.log('🆔 [DEBUG] Saved address ID:', address._id);
        console.log('🏢 [DEBUG] Saved GST Number:', address.gstNumber);
        console.log('📄 [DEBUG] Saved PAN Number:', address.panNumber);
    } catch (saveError) {
        console.error('❌ [DEBUG] Error saving address:', saveError);
        console.error('❌ [DEBUG] Save error message:', saveError.message);
        console.error('❌ [DEBUG] Save error name:', saveError.name);
        if (saveError.errors) {
            console.error('❌ [DEBUG] Validation errors:', saveError.errors);
        }
        throw saveError;
    }

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
    console.log('🔍 [DEBUG] updateAddress called');
    console.log('📋 [DEBUG] Address ID:', req.params.id);
    console.log('📋 [DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 [DEBUG] User ID:', req.user._id);
    
    const { id } = req.params;
    const userId = req.user._id;

    const address = await Address.findOne({ _id: id, user: userId, isActive: true });

    if (!address) {
        console.log('❌ [DEBUG] Address not found');
        return res.error('Address not found', [], 404);
    }

    console.log('✅ [DEBUG] Address found:', address._id);
    console.log('🏢 [DEBUG] Current GST Number:', address.gstNumber);
    console.log('📄 [DEBUG] Current PAN Number:', address.panNumber);

    // Debug GST and PAN updates
    console.log('🏢 [DEBUG] New GST Number:', req.body.gstNumber);
    console.log('🏢 [DEBUG] New GST Number type:', typeof req.body.gstNumber);
    console.log('🏢 [DEBUG] New GST Number length:', req.body.gstNumber ? req.body.gstNumber.length : 'null/undefined');
    console.log('📄 [DEBUG] New PAN Number:', req.body.panNumber);
    console.log('📄 [DEBUG] New PAN Number type:', typeof req.body.panNumber);
    console.log('📄 [DEBUG] New PAN Number length:', req.body.panNumber ? req.body.panNumber.length : 'null/undefined');

    // Update fields
    const updateFields = [
        'type', 'label', 'firstName', 'lastName', 'phone', 'alternatePhone',
        'addressLine1', 'addressLine2', 'landmark', 'city', 'state', 'country',
        'postalCode', 'deliveryInstructions', 'addressType', 'coordinates',
        'gstNumber', 'panNumber'
    ];

    console.log('🔄 [DEBUG] Updating fields...');
    updateFields.forEach(field => {
        if (req.body[field] !== undefined) {
            console.log(`📝 [DEBUG] Updating ${field}: ${address[field]} → ${req.body[field]}`);
            address[field] = req.body[field];
        }
    });

    // Handle default address change
    if (req.body.isDefault === true) {
        console.log('⭐ [DEBUG] Setting as default address');
        await address.setAsDefault();
    }

    console.log('💾 [DEBUG] Attempting to save updated address...');
    try {
        await address.save();
        console.log('✅ [DEBUG] Address updated successfully');
        console.log('🆔 [DEBUG] Updated address ID:', address._id);
        console.log('🏢 [DEBUG] Updated GST Number:', address.gstNumber);
        console.log('📄 [DEBUG] Updated PAN Number:', address.panNumber);
    } catch (saveError) {
        console.error('❌ [DEBUG] Error updating address:', saveError);
        console.error('❌ [DEBUG] Update error message:', saveError.message);
        console.error('❌ [DEBUG] Update error name:', saveError.name);
        if (saveError.errors) {
            console.error('❌ [DEBUG] Validation errors:', saveError.errors);
        }
        throw saveError;
    }

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
