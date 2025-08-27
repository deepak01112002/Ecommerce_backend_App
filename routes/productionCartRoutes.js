const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, param } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler, validateRequest } = require('../middlewares/errorHandler');
const auth = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/',
    auth,
    asyncHandler(async (req, res) => {
        const userId = req.user._id;

        let cart = await Cart.findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name slug price originalPrice images stock isActive availability minOrderQuantity maxOrderQuantity',
                populate: {
                    path: 'category',
                    select: 'name slug'
                }
            });

        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        // Filter out inactive products and calculate totals
        const activeItems = cart.items.filter(item => 
            item.product && item.product.isActive
        );

        let subtotal = 0;
        let totalItems = 0;
        let hasOutOfStock = false;

        const formattedItems = activeItems.map(item => {
            const product = item.product;
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            totalItems += item.quantity;

            const isOutOfStock = product.stock < item.quantity;
            if (isOutOfStock) hasOutOfStock = true;

            return {
                _id: item._id,
                product: {
                    _id: product._id,
                    name: product.name,
                    slug: product.slug,
                    price: product.price,
                    original_price: product.originalPrice,
                    discount_percentage: product.calculatedDiscountPercentage,
                    image: product.images?.[0] || null,
                    stock: product.stock,
                    availability: product.availability,
                    min_order_quantity: product.minOrderQuantity,
                    max_order_quantity: product.maxOrderQuantity,
                    category: product.category
                },
                variant: item.variant,
                quantity: item.quantity,
                unit_price: product.price,
                total_price: itemTotal,
                is_out_of_stock: isOutOfStock,
                max_available: Math.min(product.stock, product.maxOrderQuantity),
                added_at: item.addedAt
            };
        });

        // Calculate shipping (set to 0)
        const shipping = 0;
        
        // Calculate tax (18% GST)
        const tax = Math.round((subtotal * 0.18) * 100) / 100;
        
        // Calculate total
        const total = subtotal + shipping + tax;

        res.success({
            cart: {
                _id: cart._id,
                items: formattedItems,
                summary: {
                    total_items: totalItems,
                    unique_items: formattedItems.length,
                    subtotal,
                    shipping,
                    tax,
                    tax_rate: 0.18,
                    total,
                    free_shipping_threshold: 1999,
                    free_shipping_remaining: subtotal < 1999 ? 1999 - subtotal : 0
                },
                status: {
                    has_out_of_stock: hasOutOfStock,
                    can_checkout: formattedItems.length > 0 && !hasOutOfStock,
                    is_empty: formattedItems.length === 0
                },
                updated_at: cart.updatedAt
            }
        }, 'Cart retrieved successfully');
    })
);

/**
 * @route   POST /api/cart/add
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/add',
    auth,
    [
        body('productId').isMongoId().withMessage('Invalid product ID'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('variant').optional().isString().withMessage('Variant must be a string')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { productId, quantity, variant = 'Standard' } = req.body;
        const userId = req.user._id;

        // Validate product
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.error('Product not found or inactive', [], 404);
        }

        // Check stock availability
        if (product.stock < quantity) {
            return res.error(`Insufficient stock. Available: ${product.stock}`, [], 400);
        }

        // Check quantity limits
        if (quantity < product.minOrderQuantity) {
            return res.error(`Minimum order quantity is ${product.minOrderQuantity}`, [], 400);
        }

        if (quantity > product.maxOrderQuantity) {
            return res.error(`Maximum order quantity is ${product.maxOrderQuantity}`, [], 400);
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === productId && item.variant === variant
        );

        if (existingItemIndex > -1) {
            // Update existing item
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            
            // Check total quantity against limits
            if (newQuantity > product.maxOrderQuantity) {
                return res.error(`Cannot add more. Maximum order quantity is ${product.maxOrderQuantity}`, [], 400);
            }
            
            if (newQuantity > product.stock) {
                return res.error(`Cannot add more. Available stock: ${product.stock}`, [], 400);
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].addedAt = new Date();
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                variant,
                quantity,
                addedAt: new Date()
            });
        }

        await cart.save();

        // Populate and return updated cart item
        await cart.populate({
            path: 'items.product',
            select: 'name slug price originalPrice images stock',
            populate: {
                path: 'category',
                select: 'name slug'
            }
        });

        const addedItem = cart.items.find(item => 
            item.product._id.toString() === productId && item.variant === variant
        );

        res.success({
            message: 'Item added to cart successfully',
            item: {
                _id: addedItem._id,
                product: {
                    _id: addedItem.product._id,
                    name: addedItem.product.name,
                    slug: addedItem.product.slug,
                    price: addedItem.product.price,
                    image: addedItem.product.images?.[0] || null
                },
                variant: addedItem.variant,
                quantity: addedItem.quantity,
                total_price: addedItem.product.price * addedItem.quantity
            },
            cart_summary: {
                total_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                unique_items: cart.items.length
            }
        }, 'Item added to cart successfully');
    })
);

/**
 * @route   PUT /api/cart/update/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/update/:itemId',
    auth,
    [
        param('itemId').isMongoId().withMessage('Invalid item ID'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.error('Cart not found', [], 404);
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.error('Item not found in cart', [], 404);
        }

        // Validate product and quantity
        const product = await Product.findById(cart.items[itemIndex].product);
        if (!product || !product.isActive) {
            return res.error('Product not found or inactive', [], 404);
        }

        if (quantity < product.minOrderQuantity) {
            return res.error(`Minimum order quantity is ${product.minOrderQuantity}`, [], 400);
        }

        if (quantity > product.maxOrderQuantity) {
            return res.error(`Maximum order quantity is ${product.maxOrderQuantity}`, [], 400);
        }

        if (quantity > product.stock) {
            return res.error(`Insufficient stock. Available: ${product.stock}`, [], 400);
        }

        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].addedAt = new Date();

        await cart.save();

        res.success({
            message: 'Cart item updated successfully',
            item: {
                _id: cart.items[itemIndex]._id,
                quantity: cart.items[itemIndex].quantity,
                total_price: product.price * quantity
            }
        }, 'Cart item updated successfully');
    })
);

/**
 * @route   DELETE /api/cart/remove/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/remove/:itemId',
    auth,
    [
        param('itemId').isMongoId().withMessage('Invalid item ID')
    ],
    validateRequest,
    asyncHandler(async (req, res) => {
        const { itemId } = req.params;
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.error('Cart not found', [], 404);
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.error('Item not found in cart', [], 404);
        }

        // Remove item
        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.success({
            message: 'Item removed from cart successfully',
            cart_summary: {
                total_items: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                unique_items: cart.items.length
            }
        }, 'Item removed from cart successfully');
    })
);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/clear',
    auth,
    asyncHandler(async (req, res) => {
        const userId = req.user._id;

        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } },
            { upsert: true }
        );

        res.success({
            message: 'Cart cleared successfully'
        }, 'Cart cleared successfully');
    })
);

/**
 * @route   POST /api/cart/validate
 * @desc    Validate cart items before checkout
 * @access  Private
 */
router.post('/validate',
    auth,
    asyncHandler(async (req, res) => {
        const userId = req.user._id;

        const cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price stock isActive minOrderQuantity maxOrderQuantity');

        if (!cart || cart.items.length === 0) {
            return res.error('Cart is empty', [], 400);
        }

        const validation = {
            is_valid: true,
            errors: [],
            warnings: [],
            items: []
        };

        for (const item of cart.items) {
            const product = item.product;
            const itemValidation = {
                item_id: item._id,
                product_id: product._id,
                product_name: product.name,
                is_valid: true,
                issues: []
            };

            // Check if product is active
            if (!product.isActive) {
                itemValidation.is_valid = false;
                itemValidation.issues.push('Product is no longer available');
                validation.is_valid = false;
            }

            // Check stock
            if (product.stock < item.quantity) {
                itemValidation.is_valid = false;
                itemValidation.issues.push(`Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`);
                validation.is_valid = false;
            }

            // Check quantity limits
            if (item.quantity < product.minOrderQuantity) {
                itemValidation.is_valid = false;
                itemValidation.issues.push(`Minimum order quantity is ${product.minOrderQuantity}`);
                validation.is_valid = false;
            }

            if (item.quantity > product.maxOrderQuantity) {
                itemValidation.is_valid = false;
                itemValidation.issues.push(`Maximum order quantity is ${product.maxOrderQuantity}`);
                validation.is_valid = false;
            }

            // Check for low stock warning
            if (product.stock <= 5 && product.stock >= item.quantity) {
                validation.warnings.push(`Low stock for ${product.name}: Only ${product.stock} left`);
            }

            validation.items.push(itemValidation);
            if (!itemValidation.is_valid) {
                validation.errors.push(...itemValidation.issues);
            }
        }

        res.success({
            validation
        }, validation.is_valid ? 'Cart validation passed' : 'Cart validation failed');
    })
);

module.exports = router;
