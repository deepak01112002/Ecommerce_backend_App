const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Helper to generate JWT
function generateToken(user) {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}

// Signup
exports.signup = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        user = new User({ name, email, password, role });
        await user.save();
        const token = generateToken(user);
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Login
exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get current user profile
exports.profile = async (req, res) => {
    res.status(200).json({ user: req.user });
};

// Update current user profile
exports.updateProfile = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (email && email !== req.user.email) {
            // Check if new email is already taken
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }
        if (name) req.user.name = name;
        if (email) req.user.email = email;
        if (password) req.user.password = password;
        await req.user.save();
        res.status(200).json({
            message: 'Profile updated successfully',
            user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 