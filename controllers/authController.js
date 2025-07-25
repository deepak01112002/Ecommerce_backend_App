const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');

// Helper to generate JWT
function generateToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}

// Register (modern format)
exports.register = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, phone, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.error('Email already exists', [], 409);
    }

    // Create new user
    const user = new User({
        firstName,
        lastName,
        email,
        password,
        phone,
        role
    });
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return success response
    res.success({
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt
        },
        token,
        expires_in: '7d'
    }, 'User registered successfully', 201);
});

// Signup (legacy format)
exports.signup = asyncHandler(async (req, res) => {
    const { name, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.error('Email already exists', [], 409);
    }

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create new user
    const user = new User({ firstName, lastName, email, password, role });
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return success response
    res.success({
        user: {
            id: user._id,
            name: user.fullName,
            email: user.email,
            role: user.role,
            created_at: user.createdAt
        },
        token,
        expires_in: '7d'
    }, 'User registered successfully', 201);
});

// Login
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.error('Invalid credentials', [], 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.error('Invalid credentials', [], 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return success response
    res.success({
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            loyaltyPoints: user.loyaltyPoints,
            totalSpent: user.totalSpent,
            orderCount: user.orderCount,
            customerTier: user.customerTier,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        },
        token,
        expires_in: '7d'
    }, 'Login successful');
});

// Get current user profile
exports.profile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Get user addresses from separate Address model
    const Address = require('../models/Address');
    const addresses = await Address.find({ user: req.user._id, isActive: true });

    res.success({
        user: {
            id: user._id,
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            name: user.name,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            addresses: addresses,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
            last_login: user.lastLogin
        }
    }, 'Profile retrieved successfully');
});

// Update current user profile
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    // Check if new email is already taken
    if (email && email !== req.user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.error('Email already in use', [], 409);
        }
    }

    // Update user fields
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        updateFields,
        { new: true, runValidators: true }
    );

    res.success({
        user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            updated_at: updatedUser.updatedAt
        }
    }, 'Profile updated successfully');
});