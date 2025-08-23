const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { asyncHandler } = require('../middlewares/errorHandler');

// Get user's cart
exports.getCart = asyncHandler(async (req, res) => {
    if (!req.user) {
        // Return empty cart for guest users
        return res.success({
            cart: {
                _id: null,
                items: [],
                summary: {
                    totalItems: 0,
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    total: 0
                }
            }
        }, 'Guest cart retrieved');
    }

    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;
    let totalTax = 0;

    const formattedItems = cart.items.map(item => {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        totalItems += item.quantity;

        // Calculate tax based on product's GST rate
        const gstRate = item.product.gstRate || 18; // Default to 18% if not set
        const itemTax = Math.round((itemTotal * (gstRate / 100)) * 100) / 100;
        totalTax += itemTax;

        return {
            _id: item._id,
            product: {
                _id: item.product._id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.images?.[0] || null,
                gstRate: gstRate
            },
            quantity: item.quantity,
            variant: item.variant,
            totalPrice: itemTotal,
            tax: itemTax
        };
    });

    const shipping = subtotal >= 1999 ? 0 : 99;
    const total = subtotal + shipping + totalTax;

    res.success({
        cart: {
            _id: cart._id,
            items: formattedItems,
            summary: {
                totalItems,
                subtotal,
                tax: totalTax,
                shipping,
                total
            }
        }
    }, 'Cart retrieved successfully');
});

// Add item to cart
exports.addToCart = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const { productId, quantity = 1, variant } = req.body;
    const userId = req.user ? req.user._id : null;
    const guestId = req.headers['guest-id'];

    if (!userId && !guestId) {
        return res.error('User ID or Guest ID required', [], 400);
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
        return res.error('Product not found or inactive', [], 404);
    }

    // Check stock availability
    if (product.stock < quantity) {
        return res.error('Insufficient stock', [], 400);
    }

        const query = userId ? { user: userId } : { guestId: guestId };
        let cart = await Cart.findOne(query);

        if (!cart) {
            cart = new Cart(userId ? { user: userId, items: [] } : { guestId: guestId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId && item.variant === variant
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({ product: productId, quantity, variant });
        }

    cart.updatedAt = new Date();
    await cart.save();
    await cart.populate('items.product');

    res.success({
        cart: cart
    }, 'Item added to cart successfully');
});

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user ? req.user._id : null;
        const guestId = req.headers['guest-id'];

        if (!userId && !guestId) {
            return res.status(400).json({ message: 'User ID or Guest ID required' });
        }

        const query = userId ? { user: userId } : { guestId: guestId };
        const cart = await Cart.findOne(query);

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        cart.updatedAt = new Date();
        await cart.save();
        await cart.populate('items.product');

        res.json({
            message: 'Cart updated',
            cart: cart
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user ? req.user._id : null;
        const guestId = req.headers['guest-id'];

        if (!userId && !guestId) {
            return res.status(400).json({ message: 'User ID or Guest ID required' });
        }

        const query = userId ? { user: userId } : { guestId: guestId };
        const cart = await Cart.findOne(query);

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.updatedAt = new Date();
        await cart.save();

        res.json({
            message: 'Item removed from cart',
            cart: cart
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        const guestId = req.headers['guest-id'];

        if (!userId && !guestId) {
            return res.status(400).json({ message: 'User ID or Guest ID required' });
        }

        const query = userId ? { user: userId } : { guestId: guestId };
        await Cart.findOneAndDelete(query);

        res.json({ message: 'Cart cleared' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Merge guest cart with user cart (for login)
exports.mergeCart = async (req, res) => {
    try {
        const { guestId } = req.body;
        const userId = req.user._id;

        if (!guestId) {
            return res.status(400).json({ message: 'Guest ID required' });
        }

        const guestCart = await Cart.findOne({ guestId: guestId });
        if (!guestCart || guestCart.items.length === 0) {
            return res.json({ message: 'No guest cart to merge' });
        }

        let userCart = await Cart.findOne({ user: userId });
        if (!userCart) {
            // Convert guest cart to user cart
            guestCart.user = userId;
            guestCart.guestId = undefined;
            await guestCart.save();
            userCart = guestCart;
        } else {
            // Merge items
            for (const guestItem of guestCart.items) {
                const existingItemIndex = userCart.items.findIndex(item => 
                    item.product.toString() === guestItem.product.toString() && 
                    item.variant === guestItem.variant
                );

                if (existingItemIndex > -1) {
                    userCart.items[existingItemIndex].quantity += guestItem.quantity;
                } else {
                    userCart.items.push(guestItem);
                }
            }
            await userCart.save();
            await Cart.findOneAndDelete({ guestId: guestId });
        }

        await userCart.populate('items.product');
        res.json({
            message: 'Cart merged successfully',
            cart: userCart
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update cart item by product ID
exports.updateCartByProductId = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.error('Validation failed', errors.array(), 400);
    }

    const userId = req.user._id;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        return res.error('Cart not found', [], 404);
    }

    // Find the cart item with the specified product
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex === -1) {
        return res.error('Product not found in cart', [], 404);
    }

    if (quantity === 0) {
        // Remove item if quantity is 0
        cart.items.splice(itemIndex, 1);
    } else {
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    // Populate and return updated cart
    cart = await Cart.findOne({ user: userId }).populate('items.product');

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;
    let totalTax = 0;

    const formattedItems = cart.items.map(item => {
        const itemTotal = item.product.price * item.quantity;
        subtotal += itemTotal;
        totalItems += item.quantity;

        // Calculate tax based on product's GST rate
        const gstRate = item.product.gstRate || 18; // Default to 18% if not set
        const itemTax = Math.round((itemTotal * (gstRate / 100)) * 100) / 100;
        totalTax += itemTax;

        return {
            _id: item._id,
            product: {
                _id: item.product._id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.images?.[0] || null,
                gstRate: gstRate
            },
            quantity: item.quantity,
            variant: item.variant,
            totalPrice: itemTotal,
            tax: itemTax
        };
    });

    const shipping = subtotal >= 1999 ? 0 : 99;
    const total = subtotal + shipping + totalTax;

    res.success({
        cart: {
            _id: cart._id,
            items: formattedItems,
            summary: {
                totalItems,
                subtotal,
                tax: totalTax,
                shipping,
                total
            }
        }
    }, 'Cart updated successfully');
});
