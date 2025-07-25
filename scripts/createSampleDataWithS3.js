require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Category = require('../models/Category');
const Product = require('../models/Product');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

// Load uploaded image URLs
let uploadedImages = {};
try {
    const imageData = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploaded-image-urls.json'), 'utf8'));
    uploadedImages = imageData.uploads;
    logInfo(`Loaded ${uploadedImages.length} uploaded image URLs`);
} catch (error) {
    logError('Failed to load uploaded image URLs. Please run uploadTestImage.js first.');
    process.exit(1);
}

// Helper function to get image URL by type
const getImageUrl = (type, index = 0) => {
    const images = uploadedImages.filter(img => img.type === type);
    return images[index] ? images[index].url : null;
};

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logSuccess('Connected to MongoDB');
    } catch (error) {
        logError(`Failed to connect to MongoDB: ${error.message}`);
        process.exit(1);
    }
}

async function clearExistingData() {
    logSection('🧹 CLEARING EXISTING DATA');
    
    try {
        await Product.deleteMany({});
        logSuccess('Cleared existing products');
        
        await Category.deleteMany({});
        logSuccess('Cleared existing categories');
    } catch (error) {
        logError(`Failed to clear existing data: ${error.message}`);
        throw error;
    }
}

async function createCategories() {
    logSection('📁 CREATING CATEGORIES');
    
    const categories = [
        {
            name: 'Religious Statues',
            description: 'Beautiful handcrafted religious statues and idols',
            image: getImageUrl('category')
        },
        {
            name: 'Spiritual Items',
            description: 'Essential spiritual and religious items for worship',
            image: getImageUrl('category')
        },
        {
            name: 'Home Decor',
            description: 'Religious and spiritual home decoration items',
            image: getImageUrl('category')
        }
    ];
    
    const createdCategories = [];
    
    for (const categoryData of categories) {
        try {
            const category = new Category(categoryData);
            await category.save();
            createdCategories.push(category);
            logSuccess(`Created category: ${category.name}`);
            logInfo(`  Image: ${category.image}`);
        } catch (error) {
            logError(`Failed to create category ${categoryData.name}: ${error.message}`);
        }
    }
    
    return createdCategories;
}

async function createSubcategories(parentCategories) {
    logSection('📂 CREATING SUBCATEGORIES');
    
    const subcategoriesData = [
        {
            name: 'Ganesha Statues',
            description: 'Lord Ganesha statues in various sizes',
            parent: parentCategories[0]._id,
            image: getImageUrl('subcategory', 0)
        },
        {
            name: 'Krishna Statues',
            description: 'Lord Krishna statues and figurines',
            parent: parentCategories[0]._id,
            image: getImageUrl('subcategory', 1)
        },
        {
            name: 'Incense & Dhoop',
            description: 'Premium incense sticks and dhoop',
            parent: parentCategories[1]._id,
            image: getImageUrl('subcategory', 2)
        }
    ];
    
    const createdSubcategories = [];
    
    for (const subcategoryData of subcategoriesData) {
        try {
            const subcategory = new Category(subcategoryData);
            await subcategory.save();
            createdSubcategories.push(subcategory);
            logSuccess(`Created subcategory: ${subcategory.name}`);
            logInfo(`  Parent: ${parentCategories.find(p => p._id.equals(subcategory.parent)).name}`);
            logInfo(`  Image: ${subcategory.image}`);
        } catch (error) {
            logError(`Failed to create subcategory ${subcategoryData.name}: ${error.message}`);
        }
    }
    
    return createdSubcategories;
}

async function createProducts(categories, subcategories) {
    logSection('📦 CREATING PRODUCTS');
    
    const productsData = [
        {
            name: 'Premium Ganesha Marble Statue',
            description: 'Handcrafted marble statue of Lord Ganesha with intricate details. Perfect for home temples and offices.',
            price: 2999,
            originalPrice: 3999,
            category: subcategories[0]._id, // Ganesha Statues
            stock: 25,
            isActive: true,
            isFeatured: true,
            images: [
                getImageUrl('product', 0),
                getImageUrl('product', 1),
                getImageUrl('product', 2)
            ].filter(Boolean),
            tags: ['ganesha', 'marble', 'statue', 'religious', 'handcrafted'],
            specifications: {
                material: 'Pure Marble',
                height: '12 inches',
                weight: '2.5 kg',
                color: 'White with gold accents'
            }
        },
        {
            name: 'Krishna with Flute Bronze Figurine',
            description: 'Beautiful bronze figurine of Lord Krishna playing the flute. Antique finish with detailed craftsmanship.',
            price: 1899,
            originalPrice: 2499,
            category: subcategories[1]._id, // Krishna Statues
            stock: 15,
            isActive: true,
            isFeatured: true,
            images: [
                getImageUrl('product', 1),
                getImageUrl('product', 2),
                getImageUrl('product', 3)
            ].filter(Boolean),
            tags: ['krishna', 'bronze', 'figurine', 'flute', 'antique'],
            specifications: {
                material: 'Bronze',
                height: '8 inches',
                weight: '1.2 kg',
                finish: 'Antique Bronze'
            }
        },
        {
            name: 'Sandalwood Incense Sticks Set',
            description: 'Premium sandalwood incense sticks made from pure sandalwood powder. Pack of 100 sticks with holder.',
            price: 599,
            originalPrice: 799,
            category: subcategories[2]._id, // Incense & Dhoop
            stock: 50,
            isActive: true,
            isFeatured: false,
            images: [
                getImageUrl('product', 2),
                getImageUrl('product', 3)
            ].filter(Boolean),
            tags: ['incense', 'sandalwood', 'spiritual', 'aromatherapy'],
            specifications: {
                material: 'Pure Sandalwood',
                quantity: '100 sticks',
                'burn-time': '45 minutes per stick',
                fragrance: 'Natural Sandalwood'
            }
        },
        {
            name: 'Decorative Brass Diya Set',
            description: 'Set of 5 traditional brass diyas with intricate designs. Perfect for festivals and daily worship.',
            price: 899,
            originalPrice: 1199,
            category: categories[2]._id, // Home Decor
            stock: 30,
            isActive: true,
            isFeatured: true,
            images: [
                getImageUrl('product', 3),
                getImageUrl('product', 0)
            ].filter(Boolean),
            tags: ['diya', 'brass', 'traditional', 'festival', 'worship'],
            specifications: {
                material: 'Pure Brass',
                quantity: '5 pieces',
                size: 'Medium (3 inches diameter)',
                design: 'Traditional carved patterns'
            }
        }
    ];
    
    const createdProducts = [];
    
    for (const productData of productsData) {
        try {
            const product = new Product(productData);
            await product.save();
            createdProducts.push(product);
            logSuccess(`Created product: ${product.name}`);
            logInfo(`  Price: ₹${product.price} (Original: ₹${product.originalPrice})`);
            logInfo(`  Stock: ${product.stock} units`);
            logInfo(`  Images: ${product.images.length} images`);
            product.images.forEach((img, index) => {
                logInfo(`    ${index + 1}. ${img}`);
            });
        } catch (error) {
            logError(`Failed to create product ${productData.name}: ${error.message}`);
        }
    }
    
    return createdProducts;
}

async function generateSummary(categories, subcategories, products) {
    logSection('📊 DATA CREATION SUMMARY');
    
    logSuccess(`Created ${categories.length} main categories:`);
    categories.forEach(cat => {
        logInfo(`  • ${cat.name} (${cat.description})`);
    });
    
    logSuccess(`Created ${subcategories.length} subcategories:`);
    subcategories.forEach(subcat => {
        const parent = categories.find(cat => cat._id.equals(subcat.parent));
        logInfo(`  • ${subcat.name} (under ${parent.name})`);
    });
    
    logSuccess(`Created ${products.length} products:`);
    products.forEach(product => {
        logInfo(`  • ${product.name} - ₹${product.price} (${product.images.length} images)`);
    });
    
    logSection('🌐 S3 INTEGRATION SUMMARY');
    logSuccess('All data created using Contabo S3 images:');
    logInfo(`• Category images: ${categories.filter(c => c.image).length}/${categories.length}`);
    logInfo(`• Subcategory images: ${subcategories.filter(c => c.image).length}/${subcategories.length}`);
    logInfo(`• Product images: ${products.reduce((sum, p) => sum + p.images.length, 0)} total`);
    
    logSection('🎯 NEXT STEPS');
    logInfo('1. Start your backend server: npm run dev');
    logInfo('2. Start your admin panel: npm run dev (in Application_Admin folder)');
    logInfo('3. Login to admin panel and verify the data');
    logInfo('4. All images are stored in Contabo S3 bucket');
}

async function createSampleData() {
    try {
        await connectToDatabase();
        await clearExistingData();
        
        const categories = await createCategories();
        const subcategories = await createSubcategories(categories);
        const products = await createProducts(categories, subcategories);
        
        await generateSummary(categories, subcategories, products);
        
        logSection('🎉 SAMPLE DATA CREATION COMPLETE');
        logSuccess('All sample data has been created successfully with S3 images!');
        
    } catch (error) {
        logError(`Sample data creation failed: ${error.message}`);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        logInfo('Database connection closed');
    }
}

// Run the script if executed directly
if (require.main === module) {
    createSampleData().catch(error => {
        logError(`Script execution failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = createSampleData;
