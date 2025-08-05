require('dotenv').config();
const mongoose = require('mongoose');

async function testDatabaseConnection() {
    console.log('🔍 TESTING DATABASE CONNECTION');
    console.log('==============================');
    
    try {
        // Test MongoDB connection
        console.log('1. Testing MongoDB connection...');
        console.log(`   Connection String: ${process.env.MONGO_URI}`);

        if (!process.env.MONGO_URI) {
            console.log('❌ MONGO_URI not found in environment variables');
            return;
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully');
        
        // Test SocialMedia model
        console.log('\n2. Testing SocialMedia model...');
        const SocialMedia = require('../models/SocialMedia');
        console.log('✅ SocialMedia model loaded successfully');
        
        // Test basic query
        console.log('\n3. Testing basic query...');
        const count = await SocialMedia.countDocuments();
        console.log(`✅ SocialMedia collection accessible - ${count} documents found`);
        
        // Test find operation
        console.log('\n4. Testing find operation...');
        const links = await SocialMedia.find().limit(5);
        console.log(`✅ Find operation successful - Retrieved ${links.length} documents`);
        
        if (links.length > 0) {
            console.log('   Sample document:');
            console.log(`   - ID: ${links[0]._id}`);
            console.log(`   - Platform: ${links[0].platform}`);
            console.log(`   - Name: ${links[0].name}`);
            console.log(`   - Active: ${links[0].isActive}`);
        }
        
        // Test User model (for createdBy reference)
        console.log('\n5. Testing User model...');
        const User = require('../models/User');
        console.log('✅ User model loaded successfully');
        
        const userCount = await User.countDocuments();
        console.log(`✅ User collection accessible - ${userCount} users found`);
        
        // Find admin user
        const adminUser = await User.findOne({ email: 'admin@ghanshyambhandar.com' });
        if (adminUser) {
            console.log(`✅ Admin user found - ID: ${adminUser._id}`);
        } else {
            console.log('⚠️  Admin user not found');
        }
        
        console.log('\n🎉 DATABASE CONNECTION TEST COMPLETE');
        console.log('====================================');
        console.log('✅ MongoDB connection working');
        console.log('✅ SocialMedia model working');
        console.log('✅ User model working');
        console.log('✅ Database queries working');
        
    } catch (error) {
        console.log('\n❌ DATABASE CONNECTION TEST FAILED');
        console.log('==================================');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Database connection closed');
    }
}

testDatabaseConnection();
