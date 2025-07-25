const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function showCategoryStructure() {
    try {
        console.log('🗄️  DATABASE STRUCTURE FOR CATEGORIES');
        console.log('=====================================\n');
        
        console.log('📊 Collection Name: "categories"');
        console.log('📊 Database: MongoDB');
        console.log('📊 Storage: All categories and subcategories in same collection\n');
        
        // Get all categories
        const allCategories = await Category.find({}).populate('parent', 'name').sort({ name: 1 });
        
        console.log(`📈 Total Records: ${allCategories.length}\n`);
        
        // Separate main categories and subcategories
        const mainCategories = allCategories.filter(cat => !cat.parent);
        const subCategories = allCategories.filter(cat => cat.parent);
        
        console.log(`📁 Main Categories: ${mainCategories.length}`);
        console.log(`📂 Subcategories: ${subCategories.length}\n`);
        
        console.log('🏗️  CATEGORY STRUCTURE:');
        console.log('========================\n');
        
        for (const mainCat of mainCategories) {
            console.log(`📁 ${mainCat.name}`);
            console.log(`   ID: ${mainCat._id}`);
            console.log(`   Parent: null (Main Category)`);
            console.log(`   Image: ${mainCat.image || 'No image'}`);
            console.log(`   Slug: ${mainCat.slug}`);
            
            // Find subcategories for this main category
            const subs = subCategories.filter(sub => 
                sub.parent && sub.parent._id.toString() === mainCat._id.toString()
            );
            
            if (subs.length > 0) {
                console.log(`   Subcategories (${subs.length}):`);
                subs.forEach(sub => {
                    console.log(`   └── 📂 ${sub.name}`);
                    console.log(`       ID: ${sub._id}`);
                    console.log(`       Parent: ${sub.parent.name} (${sub.parent._id})`);
                    console.log(`       Image: ${sub.image || 'No image'}`);
                    console.log(`       Slug: ${sub.slug}`);
                });
            }
            console.log('');
        }
        
        console.log('🔍 SAMPLE DATABASE RECORDS:');
        console.log('============================\n');
        
        // Show a few sample records
        const sampleMain = mainCategories[0];
        const sampleSub = subCategories[0];
        
        if (sampleMain) {
            console.log('📄 Sample Main Category Record:');
            console.log(JSON.stringify({
                _id: sampleMain._id,
                name: sampleMain.name,
                description: sampleMain.description,
                slug: sampleMain.slug,
                parent: sampleMain.parent, // null for main categories
                image: sampleMain.image,
                isActive: sampleMain.isActive,
                createdAt: sampleMain.createdAt,
                updatedAt: sampleMain.updatedAt
            }, null, 2));
            console.log('');
        }
        
        if (sampleSub) {
            console.log('📄 Sample Subcategory Record:');
            console.log(JSON.stringify({
                _id: sampleSub._id,
                name: sampleSub.name,
                description: sampleSub.description,
                slug: sampleSub.slug,
                parent: sampleSub.parent._id, // ObjectId of parent category
                image: sampleSub.image,
                isActive: sampleSub.isActive,
                createdAt: sampleSub.createdAt,
                updatedAt: sampleSub.updatedAt
            }, null, 2));
            console.log('');
        }
        
        console.log('💡 KEY POINTS:');
        console.log('===============');
        console.log('• All categories (main + sub) are in the SAME "categories" collection');
        console.log('• Main categories have parent = null');
        console.log('• Subcategories have parent = ObjectId of parent category');
        console.log('• Both main categories and subcategories can have images');
        console.log('• The admin panel shows both types in the same table with visual indicators');
        console.log('• You can see this data in MongoDB Compass or any MongoDB client');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the function
showCategoryStructure();
