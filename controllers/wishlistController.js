const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get user's wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    let wishlist = await Wishlist.findOne({ user: userId }).populate('items.product');

    if (!wishlist) {
        wishlist = await Wishlist.create({ user: userId, items: [] });
    }

    const formattedItems = (wishlist.items || []).map(item => ({
        _id: item._id,
        product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            images: item.product.images,
            rating: item.product.rating,
            isActive: item.product.isActive
        },
        addedAt: item.addedAt
    }));

    res.success({
        data: {
            items: formattedItems,
            count: formattedItems.length
        }
    }, 'Wishlist retrieved successfully');
});

// Add item to wishlist
exports.addToWishlist = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { productId } = req.body;
        const userId = req.user._id;

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ message: 'Product not found or inactive' });
        }

        let wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

        // Check if item already exists in wishlist
        const existingItem = wishlist.items.find(item => 
            item.product.toString() === productId
        );

        if (existingItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Add new item
        wishlist.items.push({ product: productId });
        await wishlist.save();
        await wishlist.populate('items.product');

        res.json({
            message: 'Item added to wishlist',
            wishlist: wishlist
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Remove item from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        wishlist.items = wishlist.items.filter(item => 
            item.product.toString() !== productId
        );
        
        await wishlist.save();

        res.json({
            message: 'Item removed from wishlist',
            wishlist: wishlist
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Clear wishlist
exports.clearWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Wishlist.findOneAndUpdate(
            { user: userId },
            { items: [] },
            { upsert: true }
        );

        res.json({ message: 'Wishlist cleared' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Check if product is in wishlist
exports.isInWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        const wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            return res.json({ isInWishlist: false });
        }

        const isInWishlist = wishlist.items.some(item => 
            item.product.toString() === productId
        );

        res.json({ isInWishlist });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
