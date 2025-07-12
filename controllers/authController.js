const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');

// Helper to generate JWT
function generateToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}

// Signup
exports.signup = asyncHandler(async (req, res) => {
    const { name, email, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.error('Email already exists', [], 409);
    }

    // Create new user
    const user = new User({ name, email, password, role });
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return success response
    res.success({
        user: {
            id: user._id,
            name: user.name,
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
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            last_login: user.lastLogin
        },
        token,
        expires_in: '7d'
    }, 'Login successful');
});

// Get current user profile
exports.profile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('addresses');

    res.success({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            addresses: user.addresses,
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