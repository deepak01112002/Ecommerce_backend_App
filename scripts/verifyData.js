const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Coupon = require('../models/Coupon');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Verify all data
const verifyData = async () => {
    try {
        console.log('🔍 Verifying seeded data...\n');
        
        // Count documents in each collection
        const userCount = await User.countDocuments();
        const categoryCount = await Category.countDocuments();
        const productCount = await Product.countDocuments();
        const reviewCount = await Review.countDocuments();
        const couponCount = await Coupon.countDocuments();
        const cartCount = await Cart.countDocuments();
        const wishlistCount = await Wishlist.countDocuments();
        const orderCount = await Order.countDocuments();
        
        console.log('📊 Document Counts:');
        console.log(`- Users: ${userCount}`);
        console.log(`- Categories: ${categoryCount}`);
        console.log(`- Products: ${productCount}`);
        console.log(`- Reviews: ${reviewCount}`);
        console.log(`- Coupons: ${couponCount}`);
        console.log(`- Carts: ${cartCount}`);
        console.log(`- Wishlists: ${wishlistCount}`);
        console.log(`- Orders: ${orderCount}\n`);
        
        // Sample data from each collection
        console.log('📋 Sample Data:\n');
        
        // Users
        const sampleUsers = await User.find().limit(2).select('name email role');
        console.log('👥 Sample Users:');
        sampleUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
        console.log();
        
        // Categories
        const sampleCategories = await Category.find().limit(3).select('name slug isActive');
        console.log('📂 Sample Categories:');
        sampleCategories.forEach(category => {
            console.log(`  - ${category.name} (${category.slug}) - Active: ${category.isActive}`);
        });
        console.log();
        
        // Products with categories
        const sampleProducts = await Product.find().limit(3).populate('category', 'name').select('name price category rating reviewCount');
        console.log('🛍️ Sample Products:');
        sampleProducts.forEach(product => {
            console.log(`  - ${product.name} - ₹${product.price} - Category: ${product.category.name} - Rating: ${product.rating} (${product.reviewCount} reviews)`);
        });
        console.log();
        
        // Reviews with user and product info
        const sampleReviews = await Review.find().limit(3)
            .populate('user', 'name')
            .populate('product', 'name')
            .select('rating comment user product isVerifiedPurchase');
        console.log('⭐ Sample Reviews:');
        sampleReviews.forEach(review => {
            console.log(`  - ${review.user.name} rated ${review.product.name}: ${review.rating}/5 - "${review.comment.substring(0, 50)}..." (Verified: ${review.isVerifiedPurchase})`);
        });
        console.log();
        
        // Orders with user info
        const sampleOrders = await Order.find().limit(2)
            .populate('user', 'name')
            .populate('items.product', 'name')
            .select('user total status items createdAt');
        console.log('📦 Sample Orders:');
        sampleOrders.forEach(order => {
            const userName = order.user ? order.user.name : 'Guest';
            console.log(`  - ${userName} - ₹${order.total} - Status: ${order.status} - Items: ${order.items.length} - Date: ${order.createdAt.toDateString()}`);
        });
        console.log();
        
        // Coupons
        const sampleCoupons = await Coupon.find().limit(3).select('code discountType discountValue isActive usedCount');
        console.log('🎟️ Sample Coupons:');
        sampleCoupons.forEach(coupon => {
            console.log(`  - ${coupon.code} - ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '₹' + coupon.discountValue} off - Active: ${coupon.isActive} - Used: ${coupon.usedCount} times`);
        });
        console.log();
        
        console.log('✅ Data verification completed successfully!');
        console.log('🎉 All models have been seeded with comprehensive dummy data!');
        
    } catch (error) {
        console.error('❌ Error verifying data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run verification
const main = async () => {
    await connectDB();
    await verifyData();
};

if (require.main === module) {
    main();
}

module.exports = { verifyData };
