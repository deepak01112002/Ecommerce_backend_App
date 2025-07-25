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

// Category data structure with main categories and subcategories
const categoryData = {
    'Hindu Deities': {
        icon: 'fas fa-om',
        color: '#FF6B35',
        subcategories: [
            'Ganesha Murtis', 'Krishna Murtis', 'Shiva Murtis', 'Durga Murtis', 'Hanuman Murtis',
            'Lakshmi Murtis', 'Saraswati Murtis', 'Rama Murtis', 'Vishnu Murtis', 'Kali Murtis',
            'Parvati Murtis', 'Brahma Murtis', 'Indra Murtis', 'Surya Murtis', 'Chandra Murtis'
        ]
    },
    'Puja Items': {
        icon: 'fas fa-pray',
        color: '#27AE60',
        subcategories: [
            'Puja Thalis', 'Incense Sticks', 'Diyas & Lamps', 'Puja Bells', 'Kalash & Lota',
            'Aarti Items', 'Puja Flowers', 'Sacred Threads', 'Tilak & Kumkum', 'Puja Books',
            'Prayer Mats', 'Puja Accessories', 'Holy Water Containers', 'Offering Plates', 'Camphor'
        ]
    },
    'Temple Accessories': {
        icon: 'fas fa-building',
        color: '#4ECDC4',
        subcategories: [
            'Temple Doors', 'Temple Pillars', 'Temple Decorations', 'Temple Curtains', 'Temple Carpets',
            'Temple Lighting', 'Temple Furniture', 'Temple Storage', 'Temple Cleaning', 'Temple Security',
            'Temple Sound Systems', 'Temple Clocks', 'Temple Mirrors', 'Temple Paintings', 'Temple Plants'
        ]
    },
    'Spiritual Books': {
        icon: 'fas fa-book',
        color: '#9B59B6',
        subcategories: [
            'Bhagavad Gita', 'Ramayana', 'Mahabharata', 'Puranas', 'Vedas',
            'Upanishads', 'Devotional Songs', 'Prayer Books', 'Spiritual Guides', 'Mantras',
            'Meditation Books', 'Yoga Books', 'Philosophy Books', 'Religious Stories', 'Sacred Texts'
        ]
    },
    'Jewelry & Ornaments': {
        icon: 'fas fa-gem',
        color: '#F39C12',
        subcategories: [
            'Temple Jewelry', 'Deity Ornaments', 'Sacred Rings', 'Religious Pendants', 'Prayer Beads',
            'Rudraksha', 'Gemstones', 'Amulets', 'Bracelets', 'Necklaces',
            'Earrings', 'Anklets', 'Nose Rings', 'Toe Rings', 'Hair Accessories'
        ]
    },
    'Home Decor': {
        icon: 'fas fa-home',
        color: '#E74C3C',
        subcategories: [
            'Wall Hangings', 'Rangoli Items', 'Decorative Plates', 'Vases', 'Candle Holders',
            'Photo Frames', 'Mirrors', 'Clocks', 'Wind Chimes', 'Door Hangings',
            'Table Decorations', 'Floor Decorations', 'Garden Decorations', 'Festival Decorations', 'Seasonal Items'
        ]
    },
    'Clothing & Textiles': {
        icon: 'fas fa-tshirt',
        color: '#45B7D1',
        subcategories: [
            'Dhoti & Kurta', 'Sarees', 'Shawls', 'Scarves', 'Prayer Caps',
            'Religious T-Shirts', 'Meditation Clothes', 'Festival Wear', 'Temple Cloth', 'Bed Sheets',
            'Pillow Covers', 'Curtains', 'Table Cloth', 'Towels', 'Blankets'
        ]
    }
};

// Generate comprehensive categories
const generateCategories = () => {
    const categories = [];
    let sortOrder = 1;

    Object.entries(categoryData).forEach(([mainCategoryName, data]) => {
        // Create main category
        const mainCategory = {
            name: mainCategoryName,
            slug: mainCategoryName.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'),
            description: `Premium ${mainCategoryName.toLowerCase()} for spiritual and religious purposes`,
            image: `/images/categories/${mainCategoryName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
            icon: data.icon,
            color: data.color,
            level: 0,
            parent: null,
            isActive: true,
            isFeatured: true,
            sortOrder: sortOrder++,
            seoTitle: `${mainCategoryName} - Premium Religious Items`,
            seoDescription: `Shop authentic ${mainCategoryName.toLowerCase()} online. High quality religious items for worship and spiritual practices.`,
            metaKeywords: [mainCategoryName.toLowerCase(), 'religious', 'spiritual', 'hindu', 'worship']
        };
        categories.push(mainCategory);

        // Create subcategories
        data.subcategories.forEach((subCategoryName, index) => {
            const subCategory = {
                name: subCategoryName,
                slug: subCategoryName.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'),
                description: `High quality ${subCategoryName.toLowerCase()} for religious and spiritual use`,
                image: `/images/categories/${subCategoryName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
                icon: data.icon,
                color: data.color,
                level: 1,
                parent: null, // Will be set after main category is created
                isActive: true,
                isFeatured: index < 5, // First 5 subcategories are featured
                sortOrder: sortOrder++,
                seoTitle: `${subCategoryName} - ${mainCategoryName}`,
                seoDescription: `Premium ${subCategoryName.toLowerCase()} collection. Authentic religious items for worship.`,
                metaKeywords: [subCategoryName.toLowerCase(), mainCategoryName.toLowerCase(), 'religious', 'spiritual']
            };
            categories.push(subCategory);
        });
    });

    return categories;
};

// Seed Categories with proper parent-child relationships
const seedCategories = async () => {
    try {
        const categoryList = generateCategories();
        const createdCategories = [];
        const categoryMap = new Map();

        // First, create all main categories (level 0)
        const mainCategories = categoryList.filter(cat => cat.level === 0);
        for (const category of mainCategories) {
            const created = await Category.create(category);
            createdCategories.push(created);
            categoryMap.set(category.name, created._id);
        }

        // Then create subcategories with proper parent references
        const subCategories = categoryList.filter(cat => cat.level === 1);
        for (const subCategory of subCategories) {
            // Find parent category name from categoryData
            let parentName = null;
            Object.entries(categoryData).forEach(([mainName, data]) => {
                if (data.subcategories.includes(subCategory.name)) {
                    parentName = mainName;
                }
            });

            if (parentName && categoryMap.has(parentName)) {
                subCategory.parent = categoryMap.get(parentName);
                const created = await Category.create(subCategory);
                createdCategories.push(created);
                categoryMap.set(subCategory.name, created._id);
            }
        }

        console.log(`${createdCategories.length} categories seeded successfully`);
        return { categories: createdCategories, categoryMap };
    } catch (error) {
        console.error('Error seeding categories:', error);
        return { categories: [], categoryMap: new Map() };
    }
};

// Product templates for different categories
const productTemplates = {
    'Ganesha Murtis': [
        { name: 'Brass Ganesha Murti', materials: ['Brass', 'Bronze', 'Silver Plated'], sizes: ['Small', 'Medium', 'Large'], basePrice: 1299 },
        { name: 'Marble Ganesha Statue', materials: ['White Marble', 'Black Marble', 'Colored Marble'], sizes: ['Medium', 'Large', 'Extra Large'], basePrice: 4999 },
        { name: 'Crystal Ganesha', materials: ['Clear Crystal', 'Rose Quartz', 'Amethyst'], sizes: ['Small', 'Medium'], basePrice: 2499 },
        { name: 'Wooden Ganesha Carving', materials: ['Sandalwood', 'Rosewood', 'Teak'], sizes: ['Small', 'Medium', 'Large'], basePrice: 1899 },
        { name: 'Clay Ganesha Idol', materials: ['Eco-friendly Clay', 'Painted Clay'], sizes: ['Small', 'Medium', 'Large'], basePrice: 599 }
    ],
    'Krishna Murtis': [
        { name: 'Krishna with Flute', materials: ['Brass', 'Bronze', 'Marble'], sizes: ['Small', 'Medium', 'Large'], basePrice: 2299 },
        { name: 'Radha Krishna Pair', materials: ['Silver Plated', 'Gold Plated', 'Brass'], sizes: ['Medium', 'Large'], basePrice: 3799 },
        { name: 'Baby Krishna Crawling', materials: ['Brass', 'Silver', 'Crystal'], sizes: ['Small', 'Medium'], basePrice: 1599 },
        { name: 'Krishna Dancing', materials: ['Bronze', 'Brass', 'Marble'], sizes: ['Medium', 'Large'], basePrice: 2899 },
        { name: 'Krishna with Cow', materials: ['Resin', 'Brass', 'Marble'], sizes: ['Large', 'Extra Large'], basePrice: 4299 }
    ],
    'Shiva Murtis': [
        { name: 'Shiva Lingam', materials: ['Black Stone', 'Crystal', 'Marble'], sizes: ['Small', 'Medium', 'Large'], basePrice: 899 },
        { name: 'Nataraja Dancing Shiva', materials: ['Brass', 'Bronze', 'Silver'], sizes: ['Medium', 'Large'], basePrice: 3299 },
        { name: 'Shiva Family', materials: ['Marble', 'Brass', 'Resin'], sizes: ['Large', 'Extra Large'], basePrice: 5999 },
        { name: 'Meditating Shiva', materials: ['Stone', 'Brass', 'Crystal'], sizes: ['Medium', 'Large'], basePrice: 2799 },
        { name: 'Shiva Trishul', materials: ['Brass', 'Steel', 'Silver'], sizes: ['Small', 'Medium', 'Large'], basePrice: 1299 }
    ],
    'Puja Thalis': [
        { name: 'Complete Puja Thali Set', materials: ['Brass', 'Silver Plated', 'Copper'], sizes: ['Small Set', 'Medium Set', 'Large Set'], basePrice: 1599 },
        { name: 'Designer Puja Thali', materials: ['Brass', 'German Silver', 'Stainless Steel'], sizes: ['Medium', 'Large'], basePrice: 2299 },
        { name: 'Traditional Puja Thali', materials: ['Pure Brass', 'Bronze', 'Copper'], sizes: ['Standard', 'Premium'], basePrice: 1899 },
        { name: 'Wedding Puja Thali', materials: ['Gold Plated', 'Silver Plated', 'Brass'], sizes: ['Large', 'Extra Large'], basePrice: 3499 },
        { name: 'Festival Puja Thali', materials: ['Decorated Brass', 'Painted Metal'], sizes: ['Medium', 'Large'], basePrice: 1299 }
    ]
};

// Generate products for categories
const generateProducts = (categories, categoryMap) => {
    const products = [];
    const brands = ['Divine Crafts', 'Sacred Arts', 'Spiritual Creations', 'Holy Handicrafts', 'Blessed Designs', 'Devotional Decor', 'Pious Products', 'Religious Relics'];

    categories.forEach(category => {
        if (category.level === 1) { // Only create products for subcategories
            const template = productTemplates[category.name];
            const productsPerCategory = Math.floor(500 / categories.filter(c => c.level === 1).length) + 1;

            for (let i = 0; i < productsPerCategory && i < 10; i++) {
                const baseTemplate = template ? template[i % template.length] : {
                    name: `${category.name} Item ${i + 1}`,
                    materials: ['Standard Material'],
                    sizes: ['Standard Size'],
                    basePrice: 999
                };

                const material = baseTemplate.materials[Math.floor(Math.random() * baseTemplate.materials.length)];
                const size = baseTemplate.sizes[Math.floor(Math.random() * baseTemplate.sizes.length)];
                const brand = brands[Math.floor(Math.random() * brands.length)];

                const priceMultiplier = 1 + (Math.random() * 0.6 - 0.3); // ±30% price variation
                const price = Math.round(baseTemplate.basePrice * priceMultiplier);
                const originalPrice = Math.round(price * (1.2 + Math.random() * 0.3)); // 20-50% discount

                const product = {
                    name: `${baseTemplate.name} - ${material} ${size}`,
                    slug: `${baseTemplate.name}-${material}-${size}`.toLowerCase()
                        .replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-') + `-${i + 1}`,
                    description: `Premium ${baseTemplate.name.toLowerCase()} crafted from high-quality ${material.toLowerCase()}. Perfect for religious worship and spiritual practices. Handcrafted by skilled artisans with attention to detail.`,
                    shortDescription: `Premium ${material.toLowerCase()} ${baseTemplate.name.toLowerCase()} in ${size.toLowerCase()} size`,
                    price,
                    originalPrice,
                    images: [
                        `/images/products/${category.slug}/${baseTemplate.name.toLowerCase().replace(/\s+/g, '-')}-1.jpg`,
                        `/images/products/${category.slug}/${baseTemplate.name.toLowerCase().replace(/\s+/g, '-')}-2.jpg`
                    ],
                    category: category._id,
                    brand,
                    variants: [
                        { name: 'Size', value: size, stock: Math.floor(Math.random() * 50) + 10, price, isActive: true },
                        { name: 'Material', value: material, stock: Math.floor(Math.random() * 30) + 5, price, isActive: true }
                    ],
                    stock: Math.floor(Math.random() * 100) + 20,
                    minOrderQuantity: 1,
                    maxOrderQuantity: Math.floor(Math.random() * 10) + 5,
                    rating: 3.5 + Math.random() * 1.5, // 3.5 to 5.0 rating
                    reviewCount: Math.floor(Math.random() * 50),
                    viewCount: Math.floor(Math.random() * 1000) + 100,
                    salesCount: Math.floor(Math.random() * 100) + 10,
                    isActive: true,
                    isFeatured: Math.random() > 0.7, // 30% chance of being featured
                    isBestseller: Math.random() > 0.8, // 20% chance of being bestseller
                    isNewArrival: Math.random() > 0.6, // 40% chance of being new arrival
                    availability: 'in_stock',
                    tags: [
                        category.name.toLowerCase(),
                        material.toLowerCase(),
                        size.toLowerCase(),
                        'religious',
                        'spiritual',
                        'handcrafted',
                        brand.toLowerCase().replace(/\s+/g, '')
                    ],
                    specifications: {
                        material: material,
                        size: size,
                        weight: `${Math.floor(Math.random() * 2000) + 200}g`,
                        height: `${Math.floor(Math.random() * 20) + 5} inches`,
                        finish: Math.random() > 0.5 ? 'Polished' : 'Antique',
                        origin: 'India'
                    },
                    shippingInfo: {
                        weight: Math.random() * 3 + 0.5,
                        dimensions: {
                            length: Math.floor(Math.random() * 20) + 10,
                            width: Math.floor(Math.random() * 15) + 8,
                            height: Math.floor(Math.random() * 25) + 12
                        },
                        shippingCost: price > 2000 ? 0 : Math.floor(Math.random() * 200) + 99,
                        freeShippingThreshold: 1999,
                        estimatedDelivery: '3-7 business days'
                    },
                    returnPolicy: '7 days return policy',
                    warranty: '1 year manufacturer warranty',
                    seoTitle: `${baseTemplate.name} ${material} ${size} - Buy Online`,
                    seoDescription: `Buy premium ${baseTemplate.name.toLowerCase()} in ${material.toLowerCase()} material. ${size} size available. Free shipping on orders above ₹1999.`,
                    metaKeywords: [
                        baseTemplate.name.toLowerCase(),
                        material.toLowerCase(),
                        size.toLowerCase(),
                        category.name.toLowerCase(),
                        'buy online',
                        'religious items'
                    ]
                };

                products.push(product);
            }
        }
    });

    return products;
};

// Generate users
const generateUsers = () => {
    const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sunita', 'Vikram', 'Kavita', 'Suresh', 'Meera', 'Ravi', 'Anita', 'Deepak', 'Pooja', 'Manoj', 'Sita', 'Arun', 'Geeta', 'Ramesh', 'Lata', 'Vinod', 'Usha'];
    const lastNames = ['Kumar', 'Sharma', 'Patel', 'Devi', 'Singh', 'Gupta', 'Agarwal', 'Jain', 'Verma', 'Yadav', 'Mishra', 'Tiwari', 'Pandey', 'Srivastava', 'Chandra', 'Prasad', 'Shukla', 'Dubey', 'Tripathi', 'Saxena'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Coimbatore'];
    const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Andhra Pradesh', 'Bihar', 'Punjab', 'Haryana', 'Kerala', 'Odisha', 'Jharkhand', 'Assam', 'Chhattisgarh', 'Uttarakhand'];

    const users = [];

    // Add admin user
    users.push({
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
    });

    // Generate regular users
    for (let i = 0; i < 49; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const state = states[Math.floor(Math.random() * states.length)];
        const phone = `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

        users.push({
            firstName,
            lastName,
            email,
            password: 'password123',
            phone,
            role: 'user',
            status: 'active',
            emailVerified: Math.random() > 0.2, // 80% verified
            phoneVerified: Math.random() > 0.3, // 70% verified
            gender: Math.random() > 0.5 ? 'male' : 'female',
            addresses: [{
                type: Math.random() > 0.5 ? 'home' : 'work',
                firstName,
                lastName,
                street: `${Math.floor(Math.random() * 999) + 1} ${['Temple Road', 'Devotee Lane', 'Spiritual Avenue', 'Bhakti Marg', 'Sacred Street'][Math.floor(Math.random() * 5)]}`,
                city,
                state,
                postalCode: `${Math.floor(Math.random() * 900000) + 100000}`,
                country: 'India',
                phone,
                isDefault: true
            }],
            isActive: true,
            loyaltyPoints: Math.floor(Math.random() * 500),
            totalSpent: Math.floor(Math.random() * 20000),
            orderCount: Math.floor(Math.random() * 10)
        });
    }

    return users;
};

// Seed all data
const seedProducts = async (categories) => {
    try {
        const products = generateProducts(categories);
        const createdProducts = await Product.insertMany(products);
        console.log(`${createdProducts.length} products seeded successfully`);
        return createdProducts;
    } catch (error) {
        console.error('Error seeding products:', error);
        return [];
    }
};

const seedUsers = async () => {
    try {
        const users = generateUsers();
        const createdUsers = await User.insertMany(users);
        console.log(`${createdUsers.length} users seeded successfully`);
        return createdUsers;
    } catch (error) {
        console.error('Error seeding users:', error);
        return [];
    }
};

// Generate reviews
const seedReviews = async (users, products) => {
    try {
        const reviews = [];
        const reviewTexts = [
            'Excellent quality product! Very satisfied with the purchase.',
            'Beautiful craftsmanship and fast delivery. Highly recommended!',
            'Good value for money. The product matches the description perfectly.',
            'Amazing quality and finish. Will definitely buy again.',
            'Perfect for daily worship. Great quality and design.',
            'Outstanding product quality. Exceeded my expectations.',
            'Beautiful design and excellent material quality.',
            'Very happy with this purchase. Great for home temple.',
            'Superb quality and fast shipping. Highly recommended!',
            'Perfect size and beautiful finish. Love it!'
        ];

        // Generate reviews for random products
        for (let i = 0; i < Math.min(200, products.length * 2); i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const rating = Math.floor(Math.random() * 2) + 4; // 4-5 star ratings mostly
            const comment = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];

            reviews.push({
                user: user._id,
                product: product._id,
                rating,
                comment,
                isVerifiedPurchase: Math.random() > 0.3, // 70% verified purchases
                helpfulCount: Math.floor(Math.random() * 20)
            });
        }

        const createdReviews = await Review.insertMany(reviews);
        console.log(`${createdReviews.length} reviews seeded successfully`);
        return createdReviews;
    } catch (error) {
        console.error('Error seeding reviews:', error);
        return [];
    }
};

// Generate coupons
const seedCoupons = async (users, categories) => {
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
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                usageLimit: 1000,
                usedCount: Math.floor(Math.random() * 100),
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'FESTIVAL25',
                description: '25% off on all festival items',
                discountType: 'percentage',
                discountValue: 25,
                minOrderAmount: 1999,
                maxDiscountAmount: 1500,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                usageLimit: 500,
                usedCount: Math.floor(Math.random() * 50),
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
                validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                usageLimit: 200,
                usedCount: Math.floor(Math.random() * 30),
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'NEWUSER15',
                description: '15% off for new users',
                discountType: 'percentage',
                discountValue: 15,
                minOrderAmount: 1499,
                maxDiscountAmount: 750,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                usageLimit: 1000,
                usedCount: Math.floor(Math.random() * 200),
                isActive: true,
                createdBy: adminUser._id
            },
            {
                code: 'BULK20',
                description: '20% off on bulk orders',
                discountType: 'percentage',
                discountValue: 20,
                minOrderAmount: 5000,
                maxDiscountAmount: 2000,
                validFrom: new Date(),
                validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                usageLimit: 100,
                usedCount: Math.floor(Math.random() * 20),
                isActive: true,
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

// Main seeding function
const massiveSeedDatabase = async () => {
    try {
        console.log('🌱 Starting massive database seeding...');

        // Connect to database
        await connectDB();

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await clearDatabase();

        // Seed data in order
        console.log('📂 Seeding categories and subcategories...');
        const { categories } = await seedCategories();

        console.log('👥 Seeding users...');
        const users = await seedUsers();

        console.log('🛍️ Seeding products...');
        const products = await seedProducts(categories);

        console.log('⭐ Seeding reviews...');
        const reviews = await seedReviews(users, products);

        console.log('🎟️ Seeding coupons...');
        const coupons = await seedCoupons(users, categories);

        console.log('✅ Massive database seeding completed successfully!');
        console.log(`
📊 Seeding Summary:
- Categories: ${categories.length}
- Users: ${users.length}
- Products: ${products.length}
- Reviews: ${reviews.length}
- Coupons: ${coupons.length}
        `);

    } catch (error) {
        console.error('❌ Error in massive seeding:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
    massiveSeedDatabase();
}

module.exports = {
    connectDB,
    clearDatabase,
    seedCategories,
    seedProducts,
    seedUsers,
    seedReviews,
    seedCoupons,
    massiveSeedDatabase,
    categoryData
};
