const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');

/**
 * Complete Order Flow Service
 * Handles the entire order lifecycle from creation to delivery
 */
class OrderService {
    
    /**
     * Step 1: Validate Cart and Calculate Totals
     */
    static async validateCartAndCalculateTotals(userId, cartItems, couponCode = null) {
        try {
            const validationResult = {
                isValid: true,
                errors: [],
                items: [],
                pricing: {
                    subtotal: 0,
                    tax: 0,
                    taxRate: 0.18, // 18% GST
                    shipping: 0,
                    discount: 0,
                    total: 0
                },
                coupon: null
            };

            // Validate each cart item
            for (const cartItem of cartItems) {
                const product = await Product.findById(cartItem.productId);
                
                if (!product || !product.isActive) {
                    validationResult.errors.push(`Product ${cartItem.productId} is not available`);
                    continue;
                }

                if (product.stock < cartItem.quantity) {
                    validationResult.errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`);
                    continue;
                }

                if (cartItem.quantity < product.minOrderQuantity) {
                    validationResult.errors.push(`Minimum order quantity for ${product.name} is ${product.minOrderQuantity}`);
                    continue;
                }

                if (cartItem.quantity > product.maxOrderQuantity) {
                    validationResult.errors.push(`Maximum order quantity for ${product.name} is ${product.maxOrderQuantity}`);
                    continue;
                }

                // Create validated item
                const validatedItem = {
                    product: product._id,
                    productSnapshot: {
                        name: product.name,
                        description: product.description,
                        images: product.images,
                        category: product.category
                    },
                    variant: cartItem.variant || 'Standard',
                    quantity: cartItem.quantity,
                    unitPrice: product.price,
                    totalPrice: product.price * cartItem.quantity,
                    discount: 0
                };

                validationResult.items.push(validatedItem);
                validationResult.pricing.subtotal += validatedItem.totalPrice;
            }

            // Validate coupon if provided
            if (couponCode) {
                const coupon = await Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true,
                    validFrom: { $lte: new Date() },
                    validUntil: { $gte: new Date() },
                    usedCount: { $lt: '$usageLimit' }
                });

                if (!coupon) {
                    validationResult.errors.push('Invalid or expired coupon code');
                } else if (validationResult.pricing.subtotal < coupon.minOrderAmount) {
                    validationResult.errors.push(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`);
                } else {
                    // Apply coupon discount
                    let discountAmount = 0;
                    if (coupon.discountType === 'percentage') {
                        discountAmount = (validationResult.pricing.subtotal * coupon.discountValue) / 100;
                        if (coupon.maxDiscountAmount) {
                            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
                        }
                    } else {
                        discountAmount = coupon.discountValue;
                    }

                    validationResult.pricing.discount = discountAmount;
                    validationResult.coupon = {
                        code: coupon.code,
                        discountAmount,
                        discountType: coupon.discountType
                    };
                }
            }

            // Calculate shipping
            const subtotalAfterDiscount = validationResult.pricing.subtotal - validationResult.pricing.discount;
            if (subtotalAfterDiscount < 1999) { // Free shipping above ₹1999
                validationResult.pricing.shipping = 99;
            }

            // Calculate tax (on subtotal after discount)
            validationResult.pricing.tax = Math.round((subtotalAfterDiscount * validationResult.pricing.taxRate) * 100) / 100;

            // Calculate final total
            validationResult.pricing.total = subtotalAfterDiscount + validationResult.pricing.tax + validationResult.pricing.shipping;

            // Set validation status
            validationResult.isValid = validationResult.errors.length === 0;

            return validationResult;

        } catch (error) {
            throw new Error(`Cart validation failed: ${error.message}`);
        }
    }

    /**
     * Step 2: Create Order
     */
    static async createOrder(userId, orderData) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { items, pricing, shippingAddress, billingAddress, paymentMethod, coupon, notes } = orderData;

            // Create order
            const order = new Order({
                user: userId,
                items,
                pricing,
                shippingAddress,
                billingAddress: billingAddress || shippingAddress,
                status: 'pending',
                paymentInfo: {
                    method: paymentMethod,
                    status: 'pending'
                },
                coupon,
                notes: {
                    customer: notes?.customer || '',
                    internal: ''
                },
                source: 'web'
            });

            await order.save({ session });

            // Reserve stock for each item
            for (const item of items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: -item.quantity } },
                    { session }
                );
            }

            // Update coupon usage if applied
            if (coupon) {
                await Coupon.findOneAndUpdate(
                    { code: coupon.code },
                    { $inc: { usedCount: 1 } },
                    { session }
                );
            }

            // Clear user's cart
            await Cart.findOneAndUpdate(
                { user: userId },
                { $set: { items: [] } },
                { session }
            );

            await session.commitTransaction();
            return order;

        } catch (error) {
            await session.abortTransaction();
            throw new Error(`Order creation failed: ${error.message}`);
        } finally {
            session.endSession();
        }
    }

    /**
     * Step 3: Process Payment
     */
    static async processPayment(orderId, paymentData) {
        try {
            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            // Simulate payment processing based on method
            let paymentResult = { success: false, transactionId: null };

            switch (paymentData.method) {
                case 'razorpay':
                    paymentResult = await this.processRazorpayPayment(order, paymentData);
                    break;
                case 'upi':
                    paymentResult = await this.processUPIPayment(order, paymentData);
                    break;
                case 'credit_card':
                case 'debit_card':
                    paymentResult = await this.processCardPayment(order, paymentData);
                    break;
                case 'net_banking':
                    paymentResult = await this.processNetBankingPayment(order, paymentData);
                    break;
                case 'cod':
                    paymentResult = { success: true, transactionId: `COD-${Date.now()}` };
                    break;
                default:
                    throw new Error('Unsupported payment method');
            }

            // Update order with payment result
            if (paymentResult.success) {
                order.paymentInfo.status = 'completed';
                order.paymentInfo.transactionId = paymentResult.transactionId;
                order.paymentInfo.paidAt = new Date();
                order.status = 'confirmed';
                
                // Add status history
                order.statusHistory.push({
                    status: 'confirmed',
                    timestamp: new Date(),
                    note: `Payment completed via ${paymentData.method}`
                });

                await order.save();

                // Update user's purchase stats
                const user = await User.findById(order.user);
                if (user) {
                    await user.updatePurchaseStats(order.pricing.total);
                }

                return { success: true, order };
            } else {
                order.paymentInfo.status = 'failed';
                order.status = 'cancelled';
                
                // Add status history
                order.statusHistory.push({
                    status: 'cancelled',
                    timestamp: new Date(),
                    note: 'Payment failed'
                });

                await order.save();

                // Restore stock
                await this.restoreStock(order);

                return { success: false, error: 'Payment failed' };
            }

        } catch (error) {
            throw new Error(`Payment processing failed: ${error.message}`);
        }
    }

    /**
     * Step 4: Update Order Status
     */
    static async updateOrderStatus(orderId, newStatus, note = '', updatedBy = null) {
        try {
            const order = await Order.findById(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'];
            if (!validStatuses.includes(newStatus)) {
                throw new Error('Invalid order status');
            }

            // Update status
            const oldStatus = order.status;
            order.status = newStatus;

            // Add to status history
            order.statusHistory.push({
                status: newStatus,
                timestamp: new Date(),
                note: note || `Status updated from ${oldStatus} to ${newStatus}`,
                updatedBy
            });

            // Handle specific status changes
            switch (newStatus) {
                case 'shipped':
                    // Generate tracking number if not exists
                    if (!order.shipping.trackingNumber) {
                        order.shipping.trackingNumber = `TRK${Date.now()}`;
                        order.shipping.carrier = 'BlueDart';
                        order.shipping.estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
                    }
                    break;
                    
                case 'delivered':
                    order.shipping.actualDelivery = new Date();
                    break;
                    
                case 'cancelled':
                    // Restore stock
                    await this.restoreStock(order);
                    break;
                    
                case 'refunded':
                    order.paymentInfo.refundedAt = new Date();
                    order.paymentInfo.refundAmount = order.pricing.total;
                    break;
            }

            await order.save();
            return order;

        } catch (error) {
            throw new Error(`Status update failed: ${error.message}`);
        }
    }

    /**
     * Helper: Restore Stock
     */
    static async restoreStock(order) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Payment Processing Methods (Simulated)
     */
    static async processRazorpayPayment(order, paymentData) {
        // Simulate Razorpay payment processing
        return {
            success: Math.random() > 0.1, // 90% success rate
            transactionId: `rzp_${Date.now()}`
        };
    }

    static async processUPIPayment(order, paymentData) {
        // Simulate UPI payment processing
        return {
            success: Math.random() > 0.05, // 95% success rate
            transactionId: `upi_${Date.now()}`
        };
    }

    static async processCardPayment(order, paymentData) {
        // Simulate card payment processing
        return {
            success: Math.random() > 0.15, // 85% success rate
            transactionId: `card_${Date.now()}`
        };
    }

    static async processNetBankingPayment(order, paymentData) {
        // Simulate net banking payment processing
        return {
            success: Math.random() > 0.2, // 80% success rate
            transactionId: `nb_${Date.now()}`
        };
    }

    /**
     * Get Order Analytics
     */
    static async getOrderAnalytics(startDate, endDate) {
        try {
            const pipeline = [
                {
                    $match: {
                        createdAt: { $gte: startDate, $lte: endDate },
                        status: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalRevenue: { $sum: '$pricing.total' },
                        averageOrderValue: { $avg: '$pricing.total' },
                        totalItems: { $sum: { $sum: '$items.quantity' } }
                    }
                }
            ];

            const result = await Order.aggregate(pipeline);
            return result[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                totalItems: 0
            };
        } catch (error) {
            throw new Error(`Analytics calculation failed: ${error.message}`);
        }
    }
}

module.exports = OrderService;
