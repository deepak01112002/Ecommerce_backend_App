const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all users (admin)
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const totalUsers = await User.countDocuments(filter);

        res.json({
            users,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get user by ID (admin)
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update user (admin)
exports.updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Remove password from update data if present (use separate endpoint for password)
        delete updateData.password;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete user (admin)
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Add address to user profile
exports.addAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user._id;
        const { street, city, state, postalCode, country, isDefault } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If this is set as default, unset other default addresses
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push({
            street,
            city,
            state,
            postalCode,
            country,
            isDefault: isDefault || user.addresses.length === 0 // First address is default
        });

        await user.save();

        res.json({
            message: 'Address added successfully',
            addresses: user.addresses
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update address
exports.updateAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user._id;
        const { addressId } = req.params;
        const { street, city, state, postalCode, country, isDefault } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If this is set as default, unset other default addresses
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        address.street = street;
        address.city = city;
        address.state = state;
        address.postalCode = postalCode;
        address.country = country;
        address.isDefault = isDefault;

        await user.save();

        res.json({
            message: 'Address updated successfully',
            addresses: user.addresses
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete address
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        user.addresses.pull(addressId);

        // If deleted address was default, make first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({
            message: 'Address deleted successfully',
            addresses: user.addresses
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get user addresses
exports.getAddresses = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const user = await User.findById(userId).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Change user password
exports.changePassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword) {
            return res.status(400).json({ message: 'Current password is required' });
        }
        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        const user = await User.findById(userId).select('+password'); // Include password field
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
