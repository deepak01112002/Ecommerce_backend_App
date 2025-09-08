const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Clear all collections
const clearDatabase = async () => {
    try {
        await User.deleteMany({});
        await Category.deleteMany({});
        await Product.deleteMany({});
        await Cart.deleteMany({});
        await Order.deleteMany({});
        await Review.deleteMany({});
        await Wishlist.deleteMany({});
        await Coupon.deleteMany({});
        console.log('Database cleared successfully');
    } catch (error) {
        console.error('Error clearing database:', error);
    }
};

// Seed Users
const seedUsers = async () => {
    try {
        const users = [
            {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@ghanshyam.com',
                password: 'admin123',
                phone: '+91-9876543210',
                role: 'admin',
                status: 'active',
                emailVerified: true,
                phoneVerified: true,
                addresses: [{
                    type: 'work',
                    firstName: 'Admin',
                    lastName: 'User',
                    street: '123 Admin Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400001',
                    country: 'India',
                    phone: '+91-9876543210',
                    isDefault: true
                }],
                isActive: true,
                loyaltyPoints: 1000,
                totalSpent: 25000,
                orderCount: 15
            },
            {
                firstName: 'Rajesh',
                lastName: 'Kumar',
                email: 'rajesh@example.com',
                password: 'password123',
                phone: '+91-9876543211',
                role: 'user',
                status: 'active',
                emailVerified: true,
                phoneVerified: true,
                gender: 'male',
                addresses: [{
                    type: 'home',
                    firstName: 'Rajesh',
                    lastName: 'Kumar',
                    street: '456 Temple Road',
                    city: 'Delhi',
                    state: 'Delhi',
                    postalCode: '110001',
                    country: 'India',
                    phone: '+91-9876543211',
                    isDefault: true
                }],
                isActive: true,
                loyaltyPoints: 250,
                totalSpent: 8500,
                orderCount: 5
            },
            {
                firstName: 'Priya',
                lastName: 'Sharma',
                email: 'priya@example.com',
                password: 'password123',
                phone: '+91-9876543212',
                role: 'user',
                status: 'active',
                emailVerified: true,
                phoneVerified: false,
                gender: 'female',
                addresses: [{
                    type: 'home',
                    firstName: 'Priya',
                    lastName: 'Sharma',
                    street: '789 Devotee Lane',
                    city: 'Jaipur',
                    state: 'Rajasthan',
                    postalCode: '302001',
                    country: 'India',
                    phone: '+91-9876543212',
                    isDefault: true
                }],
                isActive: true,
                loyaltyPoints: 180,
                totalSpent: 12000,
                orderCount: 8
            },
            {
                firstName: 'Amit',
                lastName: 'Patel',
                email: 'amit@example.com',
                password: 'password123',
                phone: '+91-9876543213',
                role: 'user',
                status: 'active',
                emailVerified: true,
                phoneVerified: true,
                gender: 'male',
                addresses: [{
                    type: 'home',
                    firstName: 'Amit',
                    lastName: 'Patel',
                    street: '321 Spiritual Avenue',
                    city: 'Ahmedabad',
                    state: 'Gujarat',
                    postalCode: '380001',
                    country: 'India',
                    phone: '+91-9876543213',
                    isDefault: true
                }],
                isActive: true,
                loyaltyPoints: 320,
                totalSpent: 15500,
                orderCount: 10
            },
            {
                firstName: 'Sunita',
                lastName: 'Devi',
                email: 'sunita@example.com',
                password: 'password123',
                phone: '+91-9876543214',
                role: 'user',
                status: 'active',
                emailVerified: true,
                phoneVerified: true,
                gender: 'female',
                addresses: [{
                    type: 'home',
                    firstName: 'Sunita',
                    lastName: 'Devi',
                    street: '654 Bhakti Marg',
                    city: 'Varanasi',
                    state: 'Uttar Pradesh',
                    postalCode: '221001',
                    country: 'India',
                    phone: '+91-9876543214',
                    isDefault: true
                }],
                isActive: true,
                loyaltyPoints: 150,
                totalSpent: 6800,
                orderCount: 4
            }
        ];

        const createdUsers = await User.insertMany(users);
        console.log(`${createdUsers.length} users seeded successfully`);
        return createdUsers;
    } catch (error) {
        console.error('Error seeding users:', error);
        return [];
    }
};

// Seed Categories
const seedCategories = async () => {
    try {
        const categories = [
            {
                name: 'Ganesha Murtis',
                slug: 'ganesha-murtis',
                description: 'Beautiful handcrafted Ganesha idols in various sizes and materials',
                image: '/images/categories/ganesha.jpg',
                icon: 'fas fa-om',
                color: '#FF6B35',
                level: 0,
                isActive: true,
                isFeatured: true,
                sortOrder: 1,
                seoTitle: 'Ganesha Murtis - Handcrafted Hindu Idols',
                seoDescription: 'Shop authentic Ganesha murtis crafted by skilled artisans',
                metaKeywords: ['ganesha', 'murti', 'idol', 'hindu', 'religious', 'handcrafted']
            },
            {
                name: 'Krishna Murtis',
                slug: 'krishna-murtis',
                description: 'Divine Krishna idols and figurines for worship and decoration',
                image: '/images/categories/krishna.jpg',
                icon: 'fas fa-music',
                color: '#4ECDC4',
                level: 0,
                isActive: true,
                isFeatured: true,
                sortOrder: 2,
                seoTitle: 'Krishna Murtis - Divine Hindu Idols',
                seoDescription: 'Beautiful Krishna murtis for your home temple',
                metaKeywords: ['krishna', 'murti', 'idol', 'hindu', 'religious', 'divine']
            },
            {
                name: 'Shiva Murtis',
                slug: 'shiva-murtis',
                description: 'Sacred Shiva lingams and idols for spiritual worship',
                image: '/images/categories/shiva.jpg',
                icon: 'fas fa-fire',
                color: '#45B7D1',
                level: 0,
                isActive: true,
                isFeatured: true,
                sortOrder: 3,
                seoTitle: 'Shiva Murtis - Sacred Hindu Idols',
                seoDescription: 'Authentic Shiva murtis and lingams for devotion',
                metaKeywords: ['shiva', 'lingam', 'murti', 'idol', 'hindu', 'sacred']
            },
            {
                name: 'Durga Murtis',
                slug: 'durga-murtis',
                description: 'Powerful Durga Mata idols for strength and protection',
                image: '/images/categories/durga.jpg',
                icon: 'fas fa-shield-alt',
                color: '#F7DC6F',
                level: 0,
                isActive: true,
                isFeatured: false,
                sortOrder: 4,
                seoTitle: 'Durga Murtis - Divine Mother Idols',
                seoDescription: 'Sacred Durga Mata murtis for worship and blessings',
                metaKeywords: ['durga', 'mata', 'murti', 'idol', 'hindu', 'goddess']
            },
            {
                name: 'Hanuman Murtis',
                slug: 'hanuman-murtis',
                description: 'Devotional Hanuman idols for courage and devotion',
                image: '/images/categories/hanuman.jpg',
                icon: 'fas fa-fist-raised',
                color: '#E74C3C',
                level: 0,
                isActive: true,
                isFeatured: true,
                sortOrder: 5,
                seoTitle: 'Hanuman Murtis - Devotional Hindu Idols',
                seoDescription: 'Powerful Hanuman murtis for strength and protection',
                metaKeywords: ['hanuman', 'murti', 'idol', 'hindu', 'devotional', 'strength']
            },
            {
                name: 'Lakshmi Murtis',
                slug: 'lakshmi-murtis',
                description: 'Prosperity bringing Lakshmi idols for wealth and abundance',
                image: '/images/categories/lakshmi.jpg',
                icon: 'fas fa-coins',
                color: '#F39C12',
                level: 0,
                isActive: true,
                isFeatured: false,
                sortOrder: 6,
                seoTitle: 'Lakshmi Murtis - Prosperity Goddess Idols',
                seoDescription: 'Beautiful Lakshmi murtis for wealth and prosperity',
                metaKeywords: ['lakshmi', 'murti', 'idol', 'hindu', 'prosperity', 'wealth']
            },
            {
                name: 'Saraswati Murtis',
                slug: 'saraswati-murtis',
                description: 'Knowledge and wisdom bringing Saraswati idols',
                image: '/images/categories/saraswati.jpg',
                icon: 'fas fa-book',
                color: '#9B59B6',
                level: 0,
                isActive: true,
                isFeatured: false,
                sortOrder: 7,
                seoTitle: 'Saraswati Murtis - Goddess of Knowledge',
                seoDescription: 'Divine Saraswati murtis for wisdom and learning',
                metaKeywords: ['saraswati', 'murti', 'idol', 'hindu', 'knowledge', 'wisdom']
            },
            {
                name: 'Puja Items',
                slug: 'puja-items',
                description: 'Essential items for Hindu worship and rituals',
                image: '/images/categories/puja-items.jpg',
                icon: 'fas fa-pray',
                color: '#27AE60',
                level: 0,
                isActive: true,
                isFeatured: true,
                sortOrder: 8,
                seoTitle: 'Puja Items - Hindu Worship Essentials',
                seoDescription: 'Complete range of puja items for Hindu rituals',
                metaKeywords: ['puja', 'items', 'worship', 'hindu', 'ritual', 'essentials']
            }
        ];

        const createdCategories = await Category.insertMany(categories);
        console.log(`${createdCategories.length} categories seeded successfully`);
        return createdCategories;
    } catch (error) {
        console.error('Error seeding categories:', error);
        return [];
    }
};

// Seed Products
const seedProducts = async (categories) => {
    try {
        const products = [
            // Ganesha Murtis
            {
                name: 'Brass Ganesha Murti - Small',
                slug: 'brass-ganesha-murti-small',
                description: 'Beautiful small brass Ganesha idol perfect for home temples. Handcrafted with intricate details and traditional design.',
                shortDescription: 'Handcrafted brass Ganesha idol for home temples',
                price: 1299,
                originalPrice: 1599,
                images: ['/images/products/ganesha-brass-small-1.jpg', '/images/products/ganesha-brass-small-2.jpg'],
                category: categories.find(c => c.name === 'Ganesha Murtis')._id,
                brand: 'Divine Crafts',
                variants: [
                    { name: 'Size', value: 'Small (4 inch)', stock: 25, price: 1299 },
                    { name: 'Size', value: 'Medium (6 inch)', stock: 15, price: 1899 },
                    { name: 'Size', value: 'Large (8 inch)', stock: 10, price: 2499 }
                ],
                stock: 50,
                minOrderQuantity: 1,
                maxOrderQuantity: 5,
                rating: 4.5,
                reviewCount: 23,
                viewCount: 1250,
                salesCount: 89,
                isActive: true,
                isFeatured: true,
                isBestseller: true,
                isNewArrival: false,
                availability: 'in_stock',
                tags: ['ganesha', 'brass', 'handcrafted', 'traditional'],
                specifications: {
                    material: 'Brass',
                    weight: '500g',
                    height: '4 inches',
                    finish: 'Antique Gold'
                },
                shippingInfo: {
                    weight: 0.5,
                    dimensions: { length: 10, width: 8, height: 12 },
                    shippingCost: 0,
                    freeShippingThreshold: 999,
                    estimatedDelivery: '3-5 business days'
                },
                returnPolicy: '7 days return policy',
                warranty: '1 year manufacturer warranty',
                seoTitle: 'Brass Ganesha Murti Small - Handcrafted Hindu Idol',
                seoDescription: 'Buy authentic small brass Ganesha murti online. Perfect for home temple worship.',
                metaKeywords: ['brass ganesha', 'small murti', 'handcrafted idol', 'home temple', 'hindu religious']
            },
            {
                name: 'Marble Ganesha Statue - Premium',
                slug: 'marble-ganesha-statue-premium',
                description: 'Exquisite white marble Ganesha statue carved by master artisans. Perfect centerpiece for your prayer room.',
                price: 4999,
                originalPrice: 6999,
                images: ['/images/products/ganesha-marble-1.jpg', '/images/products/ganesha-marble-2.jpg'],
                category: categories.find(c => c.name === 'Ganesha Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Medium (8 inch)', stock: 8, price: 4999 },
                    { name: 'Size', value: 'Large (12 inch)', stock: 5, price: 7999 }
                ],
                stock: 13,
                rating: 4.8,
                reviewCount: 15,
                isActive: true,
                isFeatured: true,
                tags: ['ganesha', 'marble', 'premium', 'handcarved'],
                specifications: {
                    material: 'White Marble',
                    weight: '2kg',
                    height: '8 inches',
                    finish: 'Polished'
                },
                shippingInfo: {
                    weight: 2,
                    dimensions: { length: 15, width: 12, height: 18 },
                    shippingCost: 0,
                    freeShippingThreshold: 2999,
                    estimatedDelivery: '5-7 business days'
                }
            },
            // Krishna Murtis
            {
                name: 'Krishna with Flute - Bronze',
                slug: 'krishna-with-flute-bronze',
                description: 'Enchanting bronze Krishna murti playing flute. Captures the divine essence of Lord Krishna in his playful form.',
                price: 2299,
                originalPrice: 2899,
                images: ['/images/products/krishna-bronze-flute-1.jpg', '/images/products/krishna-bronze-flute-2.jpg'],
                category: categories.find(c => c.name === 'Krishna Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Small (5 inch)', stock: 20, price: 2299 },
                    { name: 'Size', value: 'Medium (7 inch)', stock: 12, price: 3299 }
                ],
                stock: 32,
                rating: 4.6,
                reviewCount: 18,
                isActive: true,
                isFeatured: false,
                tags: ['krishna', 'bronze', 'flute', 'divine'],
                specifications: {
                    material: 'Bronze',
                    weight: '800g',
                    height: '5 inches',
                    finish: 'Antique Bronze'
                },
                shippingInfo: {
                    weight: 0.8,
                    dimensions: { length: 12, width: 8, height: 15 },
                    shippingCost: 0,
                    freeShippingThreshold: 1999,
                    estimatedDelivery: '3-5 business days'
                }
            },
            {
                name: 'Radha Krishna Pair - Silver Plated',
                slug: 'radha-krishna-pair-silver-plated',
                description: 'Beautiful silver plated Radha Krishna pair murti. Symbol of divine love and devotion.',
                price: 3799,
                originalPrice: 4599,
                images: ['/images/products/radha-krishna-silver-1.jpg', '/images/products/radha-krishna-silver-2.jpg'],
                category: categories.find(c => c.name === 'Krishna Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Medium (6 inch)', stock: 15, price: 3799 },
                    { name: 'Size', value: 'Large (9 inch)', stock: 8, price: 5799 }
                ],
                stock: 23,
                rating: 4.7,
                reviewCount: 12,
                isActive: true,
                isFeatured: true,
                tags: ['radha', 'krishna', 'silver', 'pair', 'love'],
                specifications: {
                    material: 'Silver Plated Brass',
                    weight: '1.2kg',
                    height: '6 inches',
                    finish: 'Silver Plated'
                }
            },
            // Shiva Murtis
            {
                name: 'Shiva Lingam - Black Stone',
                slug: 'shiva-lingam-black-stone',
                description: 'Sacred black stone Shiva lingam for daily worship. Naturally formed and blessed by priests.',
                price: 899,
                originalPrice: 1199,
                images: ['/images/products/shiva-lingam-black-1.jpg', '/images/products/shiva-lingam-black-2.jpg'],
                category: categories.find(c => c.name === 'Shiva Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Small (3 inch)', stock: 30, price: 899 },
                    { name: 'Size', value: 'Medium (5 inch)', stock: 20, price: 1399 },
                    { name: 'Size', value: 'Large (7 inch)', stock: 10, price: 1999 }
                ],
                stock: 60,
                rating: 4.4,
                reviewCount: 35,
                isActive: true,
                isFeatured: false,
                tags: ['shiva', 'lingam', 'black stone', 'sacred'],
                specifications: {
                    material: 'Natural Black Stone',
                    weight: '400g',
                    height: '3 inches',
                    finish: 'Natural'
                }
            },
            {
                name: 'Nataraja - Dancing Shiva Brass',
                slug: 'nataraja-dancing-shiva-brass',
                description: 'Magnificent brass Nataraja statue depicting Lord Shiva in his cosmic dance form.',
                price: 3299,
                originalPrice: 3999,
                images: ['/images/products/nataraja-brass-1.jpg', '/images/products/nataraja-brass-2.jpg'],
                category: categories.find(c => c.name === 'Shiva Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Medium (8 inch)', stock: 12, price: 3299 },
                    { name: 'Size', value: 'Large (12 inch)', stock: 6, price: 5299 }
                ],
                stock: 18,
                rating: 4.9,
                reviewCount: 8,
                isActive: true,
                isFeatured: true,
                tags: ['nataraja', 'shiva', 'brass', 'dancing', 'cosmic']
            },
            // Durga Murtis
            {
                name: 'Durga Mata Brass Murti',
                slug: 'durga-mata-brass-murti',
                description: 'Powerful Durga Mata brass murti with intricate detailing. Perfect for Navratri celebrations and daily worship.',
                price: 2799,
                originalPrice: 3299,
                images: ['/images/products/durga-brass-1.jpg', '/images/products/durga-brass-2.jpg'],
                category: categories.find(c => c.name === 'Durga Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Medium (7 inch)', stock: 15, price: 2799 },
                    { name: 'Size', value: 'Large (10 inch)', stock: 8, price: 4299 }
                ],
                stock: 23,
                rating: 4.6,
                reviewCount: 14,
                isActive: true,
                isFeatured: false,
                tags: ['durga', 'mata', 'brass', 'navratri', 'power'],
                specifications: {
                    material: 'Brass',
                    weight: '1kg',
                    height: '7 inches',
                    finish: 'Antique Gold'
                }
            },
            // Hanuman Murtis
            {
                name: 'Hanuman Chalisa Brass Murti',
                slug: 'hanuman-chalisa-brass-murti',
                description: 'Devotional Hanuman murti in brass with Chalisa inscribed on base. Brings strength and courage.',
                price: 1899,
                originalPrice: 2399,
                images: ['/images/products/hanuman-brass-1.jpg', '/images/products/hanuman-brass-2.jpg'],
                category: categories.find(c => c.name === 'Hanuman Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Small (5 inch)', stock: 25, price: 1899 },
                    { name: 'Size', value: 'Medium (8 inch)', stock: 15, price: 2899 }
                ],
                stock: 40,
                rating: 4.7,
                reviewCount: 22,
                isActive: true,
                isFeatured: true,
                tags: ['hanuman', 'chalisa', 'brass', 'devotion', 'strength'],
                specifications: {
                    material: 'Brass',
                    weight: '700g',
                    height: '5 inches',
                    finish: 'Golden'
                }
            },
            // Lakshmi Murtis
            {
                name: 'Lakshmi Mata Silver Plated Murti',
                slug: 'lakshmi-mata-silver-plated-murti',
                description: 'Beautiful silver plated Lakshmi Mata murti for prosperity and wealth. Perfect for Diwali celebrations.',
                price: 3499,
                originalPrice: 4199,
                images: ['/images/products/lakshmi-silver-1.jpg', '/images/products/lakshmi-silver-2.jpg'],
                category: categories.find(c => c.name === 'Lakshmi Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Medium (6 inch)', stock: 18, price: 3499 },
                    { name: 'Size', value: 'Large (9 inch)', stock: 10, price: 5299 }
                ],
                stock: 28,
                rating: 4.8,
                reviewCount: 16,
                isActive: true,
                isFeatured: true,
                tags: ['lakshmi', 'mata', 'silver', 'prosperity', 'wealth', 'diwali'],
                specifications: {
                    material: 'Silver Plated Brass',
                    weight: '900g',
                    height: '6 inches',
                    finish: 'Silver Plated'
                }
            },
            // Saraswati Murtis
            {
                name: 'Saraswati Mata White Marble Murti',
                slug: 'saraswati-mata-white-marble-murti',
                description: 'Elegant white marble Saraswati Mata murti for knowledge and wisdom. Perfect for students and scholars.',
                price: 4299,
                originalPrice: 5199,
                images: ['/images/products/saraswati-marble-1.jpg', '/images/products/saraswati-marble-2.jpg'],
                category: categories.find(c => c.name === 'Saraswati Murtis')._id,
                variants: [
                    { name: 'Size', value: 'Medium (7 inch)', stock: 12, price: 4299 },
                    { name: 'Size', value: 'Large (10 inch)', stock: 6, price: 6799 }
                ],
                stock: 18,
                rating: 4.9,
                reviewCount: 11,
                isActive: true,
                isFeatured: false,
                tags: ['saraswati', 'mata', 'marble', 'knowledge', 'wisdom', 'students'],
                specifications: {
                    material: 'White Marble',
                    weight: '1.5kg',
                    height: '7 inches',
                    finish: 'Polished'
                }
            },
            // Puja Items
            {
                name: 'Complete Puja Thali Set - Brass',
                slug: 'complete-puja-thali-set-brass',
                description: 'Complete brass puja thali set with all essential items for Hindu worship rituals.',
                price: 1599,
                originalPrice: 1999,
                images: ['/images/products/puja-thali-brass-1.jpg', '/images/products/puja-thali-brass-2.jpg'],
                category: categories.find(c => c.name === 'Puja Items')._id,
                variants: [
                    { name: 'Size', value: 'Small Set', stock: 30, price: 1599 },
                    { name: 'Size', value: 'Large Set', stock: 20, price: 2299 }
                ],
                stock: 50,
                rating: 4.5,
                reviewCount: 28,
                isActive: true,
                isFeatured: false,
                tags: ['puja', 'thali', 'brass', 'worship', 'ritual', 'complete'],
                specifications: {
                    material: 'Brass',
                    weight: '800g',
                    items: '12 pieces',
                    finish: 'Golden'
                }
            }
        ];

        const createdProducts = await Product.insertMany(products);
        console.log(`${createdProducts.length} products seeded successfully`);
        return createdProducts;
    } catch (error) {
        console.error('Error seeding products:', error);
        return [];
    }
};

// Seed Reviews
const seedReviews = async (users, products) => {
    try {
        const reviews = [
            {
                user: users[1]._id, // Rajesh Kumar
                product: products[0]._id, // Brass Ganesha Murti
                rating: 5,
                comment: 'Excellent quality brass murti! The craftsmanship is outstanding and it looks beautiful in our home temple.',
                images: ['/images/reviews/review1-1.jpg'],
                isVerifiedPurchase: true,
                helpfulCount: 12
            },
            {
                user: users[2]._id, // Priya Sharma
                product: products[0]._id, // Brass Ganesha Murti
                rating: 4,
                comment: 'Good quality product. Delivery was fast and packaging was secure. Highly recommended!',
                isVerifiedPurchase: true,
                helpfulCount: 8
            },
            {
                user: users[3]._id, // Amit Patel
                product: products[1]._id, // Marble Ganesha Statue
                rating: 5,
                comment: 'Absolutely stunning marble work! The details are incredible and it has become the centerpiece of our prayer room.',
                images: ['/images/reviews/review2-1.jpg', '/images/reviews/review2-2.jpg'],
                isVerifiedPurchase: true,
                helpfulCount: 15
            },
            {
                user: users[4]._id, // Sunita Devi
                product: products[2]._id, // Krishna with Flute
                rating: 5,
                comment: 'Beautiful Krishna murti! The bronze finish is perfect and the flute details are amazing.',
                isVerifiedPurchase: true,
                helpfulCount: 6
            },
            {
                user: users[1]._id, // Rajesh Kumar
                product: products[3]._id, // Radha Krishna Pair
                rating: 4,
                comment: 'Lovely pair of Radha Krishna. Silver plating is good quality. Worth the price.',
                isVerifiedPurchase: true,
                helpfulCount: 9
            },
            {
                user: users[2]._id, // Priya Sharma
                product: products[4]._id, // Shiva Lingam
                rating: 5,
                comment: 'Perfect for daily worship. The black stone quality is excellent and feels very sacred.',
                isVerifiedPurchase: true,
                helpfulCount: 11
            },
            {
                user: users[3]._id, // Amit Patel
                product: products[6]._id, // Durga Mata Brass Murti
                rating: 5,
                comment: 'Magnificent Durga Mata murti! The brass work is exceptional and it radiates divine energy.',
                isVerifiedPurchase: true,
                helpfulCount: 7
            },
            {
                user: users[4]._id, // Sunita Devi
                product: products[7]._id, // Hanuman Chalisa Brass Murti
                rating: 4,
                comment: 'Beautiful Hanuman murti with Chalisa inscribed. Good quality brass and fast delivery.',
                isVerifiedPurchase: true,
                helpfulCount: 5
            },
            {
                user: users[1]._id, // Rajesh Kumar
                product: products[8]._id, // Lakshmi Mata Silver Plated Murti
                rating: 5,
                comment: 'Stunning silver plated Lakshmi Mata! Perfect for our Diwali celebrations. Highly recommended!',
                images: ['/images/reviews/review3-1.jpg'],
                isVerifiedPurchase: true,
                helpfulCount: 13
            },
            {
                user: users[2]._id, // Priya Sharma
                product: products[9]._id, // Saraswati Mata White Marble Murti
                rating: 5,
                comment: 'Absolutely beautiful marble work! Perfect for my daughter\'s study room. The craftsmanship is outstanding.',
                isVerifiedPurchase: true,
                helpfulCount: 9
            },
            {
                user: users[3]._id, // Amit Patel
                product: products[10]._id, // Complete Puja Thali Set
                rating: 4,
                comment: 'Complete set with all necessary items. Good quality brass and reasonable price.',
                isVerifiedPurchase: true,
                helpfulCount: 6
            }
        ];

        const createdReviews = await Review.insertMany(reviews);
        console.log(`${createdReviews.length} reviews seeded successfully`);
        return createdReviews;
    } catch (error) {
        console.error('Error seeding reviews:', error);
        return [];
    }
};

// Seed Coupons
const seedCoupons = async (users, categories, products) => {
    try {
        const adminUser = users.find(u => u.role === 'admin');
        const coupons = [
            {
                code: 'WELCOME10',
                description: 'Welcome discount for new customers',
                discountType: 'percentage',
                discountValue: 10,
                minOrderAmount: 999,
                maxDiscountAmount: 500,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                usageLimit: 1000,
                usedCount: 45,
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'GANESHA20',
                description: '20% off on all Ganesha murtis',
                discountType: 'percentage',
                discountValue: 20,
                minOrderAmount: 1499,
                maxDiscountAmount: 1000,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
                usageLimit: 500,
                usedCount: 23,
                applicableCategories: [categories.find(c => c.name === 'Ganesha Murtis')._id],
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'FLAT500',
                description: 'Flat ₹500 off on orders above ₹2999',
                discountType: 'fixed',
                discountValue: 500,
                minOrderAmount: 2999,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
                usageLimit: 200,
                usedCount: 12,
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'KRISHNA15',
                description: '15% off on Krishna murtis',
                discountType: 'percentage',
                discountValue: 15,
                minOrderAmount: 1999,
                maxDiscountAmount: 750,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
                usageLimit: 300,
                usedCount: 8,
                applicableCategories: [categories.find(c => c.name === 'Krishna Murtis')._id],
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'EXPIRED10',
                description: 'Expired coupon for testing',
                discountType: 'percentage',
                discountValue: 10,
                minOrderAmount: 500,
                validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
                validUntil: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                usageLimit: 100,
                usedCount: 100,
                isActive: false,
                createdBy: adminUser._id
            }
        ];

        const createdCoupons = await Coupon.insertMany(coupons);
        console.log(`${createdCoupons.length} coupons seeded successfully`);
        return createdCoupons;
    } catch (error) {
        console.error('Error seeding coupons:', error);
        return [];
    }
};

// Seed Carts
const seedCarts = async (users, products) => {
    try {
        const carts = [
            {
                user: users[1]._id, // Rajesh Kumar
                items: [
                    {
                        product: products[0]._id, // Brass Ganesha Murti
                        variant: 'Small (4 inch)',
                        quantity: 1
                    },
                    {
                        product: products[2]._id, // Krishna with Flute
                        variant: 'Small (5 inch)',
                        quantity: 2
                    }
                ],
                updatedAt: new Date()
            },
            {
                user: users[2]._id, // Priya Sharma
                items: [
                    {
                        product: products[1]._id, // Marble Ganesha Statue
                        variant: 'Medium (8 inch)',
                        quantity: 1
                    }
                ],
                updatedAt: new Date()
            },
            {
                user: users[3]._id, // Amit Patel
                items: [
                    {
                        product: products[3]._id, // Radha Krishna Pair
                        variant: 'Medium (6 inch)',
                        quantity: 1
                    },
                    {
                        product: products[4]._id, // Shiva Lingam
                        variant: 'Small (3 inch)',
                        quantity: 3
                    }
                ],
                updatedAt: new Date()
            },
            {
                guestId: 'guest_12345',
                items: [
                    {
                        product: products[5]._id, // Nataraja
                        variant: 'Medium (8 inch)',
                        quantity: 1
                    }
                ],
                updatedAt: new Date()
            }
        ];

        const createdCarts = await Cart.insertMany(carts);
        console.log(`${createdCarts.length} carts seeded successfully`);
        return createdCarts;
    } catch (error) {
        console.error('Error seeding carts:', error);
        return [];
    }
};

// Seed Wishlists
const seedWishlists = async (users, products) => {
    try {
        const wishlists = [
            {
                user: users[1]._id, // Rajesh Kumar
                items: [
                    {
                        product: products[1]._id, // Marble Ganesha Statue
                        addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
                    },
                    {
                        product: products[3]._id, // Radha Krishna Pair
                        addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                    },
                    {
                        product: products[5]._id, // Nataraja
                        addedAt: new Date() // today
                    }
                ]
            },
            {
                user: users[2]._id, // Priya Sharma
                items: [
                    {
                        product: products[2]._id, // Krishna with Flute
                        addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
                    },
                    {
                        product: products[4]._id, // Shiva Lingam
                        addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
                    }
                ]
            },
            {
                user: users[3]._id, // Amit Patel
                items: [
                    {
                        product: products[0]._id, // Brass Ganesha Murti
                        addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
                    }
                ]
            },
            {
                user: users[4]._id, // Sunita Devi
                items: [
                    {
                        product: products[1]._id, // Marble Ganesha Statue
                        addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
                    },
                    {
                        product: products[2]._id, // Krishna with Flute
                        addedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
                    }
                ]
            }
        ];

        const createdWishlists = await Wishlist.insertMany(wishlists);
        console.log(`${createdWishlists.length} wishlists seeded successfully`);
        return createdWishlists;
    } catch (error) {
        console.error('Error seeding wishlists:', error);
        return [];
    }
};

// Seed Orders
const seedOrders = async (users, products) => {
    try {
        // Create simplified orders that match the new Order model
        const orderData = [
            {
                user: users[1]._id,
                items: [
                    { product: products[0]._id, variant: 'Small', quantity: 1, unitPrice: 1299, totalPrice: 1299 }
                ],
                pricing: { subtotal: 1299, tax: 0, shipping: 0, discount: 0, total: 1299 },
                status: 'delivered',
                paymentMethod: 'upi'
            },
            {
                user: users[2]._id,
                items: [
                    { product: products[1]._id, variant: 'Medium', quantity: 1, unitPrice: 4999, totalPrice: 4999 }
                ],
                pricing: { subtotal: 4999, tax: 0, shipping: 0, discount: 0, total: 4999 },
                status: 'shipped',
                paymentMethod: 'credit_card'
            }
        ];

        const orders = orderData.map((orderInfo, index) => {
            const user = users.find(u => u._id.equals(orderInfo.user));
            const address = user.addresses[0];

            return {
                user: orderInfo.user,
                items: orderInfo.items.map(item => ({
                    product: item.product,
                    productSnapshot: {
                        name: products.find(p => p._id.equals(item.product))?.name || 'Product',
                        description: 'Product description',
                        images: ['/images/product.jpg'],
                        category: 'Category'
                    },
                    variant: item.variant,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice
                })),
                pricing: orderInfo.pricing,
                shippingAddress: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    postalCode: address.postalCode,
                    country: address.country,
                    phone: address.phone || user.phone
                },
                billingAddress: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    postalCode: address.postalCode,
                    country: address.country,
                    phone: address.phone || user.phone
                },
                status: orderInfo.status,
                paymentInfo: {
                    method: orderInfo.paymentMethod,
                    status: 'completed',
                    transactionId: `TXN${Date.now()}${index}`,
                    paidAt: new Date()
                },
                createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
            };
        });

        const createdOrders = await Order.insertMany(orders);
        console.log(`${createdOrders.length} orders seeded successfully`);
        return createdOrders;
    } catch (error) {
        console.error('Error seeding orders:', error);
        return [];
    }
};

// Update product ratings based on reviews
const updateProductRatings = async (products, reviews) => {
    try {
        for (const product of products) {
            const productReviews = reviews.filter(r => r.product.toString() === product._id.toString());
            if (productReviews.length > 0) {
                const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
                const averageRating = totalRating / productReviews.length;

                await Product.findByIdAndUpdate(product._id, {
                    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
                    reviewCount: productReviews.length
                });
            }
        }
        console.log('Product ratings updated successfully');
    } catch (error) {
        console.error('Error updating product ratings:', error);
    }
};

// Main seeding function
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Connect to database
        await connectDB();

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await clearDatabase();

        // Seed data in order (respecting dependencies)
        console.log('👥 Seeding users...');
        const users = await seedUsers();

        console.log('📂 Seeding categories...');
        const categories = await seedCategories();

        console.log('🛍️ Seeding products...');
        const products = await seedProducts(categories);

        console.log('⭐ Seeding reviews...');
        const reviews = await seedReviews(users, products);

        console.log('🎟️ Seeding coupons...');
        const coupons = await seedCoupons(users, categories, products);

        console.log('🛒 Seeding carts...');
        const carts = await seedCarts(users, products);

        console.log('❤️ Seeding wishlists...');
        const wishlists = await seedWishlists(users, products);

        console.log('📦 Seeding orders...');
        const orders = await seedOrders(users, products);

        // Update product ratings based on reviews
        console.log('📊 Updating product ratings...');
        await updateProductRatings(products, reviews);

        console.log('✅ Database seeding completed successfully!');
        console.log(`
📊 Seeding Summary:
- Users: ${users.length}
- Categories: ${categories.length}
- Products: ${products.length}
- Reviews: ${reviews.length}
- Coupons: ${coupons.length}
- Carts: ${carts.length}
- Wishlists: ${wishlists.length}
- Orders: ${orders.length}
        `);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = {
    seedDatabase,
    clearDatabase,
    connectDB
};
