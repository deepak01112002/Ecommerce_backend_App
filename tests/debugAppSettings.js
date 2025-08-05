require('dotenv').config();
const mongoose = require('mongoose');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');

async function debugAppSettings() {
    console.log('🔍 DEBUGGING APP SETTINGS');
    console.log('=========================');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check raw document in database
        console.log('\n1. Checking raw document in database...');
        const rawDoc = await AppSettings.findById('000000000000000000000001').lean();
        if (rawDoc) {
            console.log('✅ Raw document found');
            console.log('📋 Raw document structure:');
            console.log(`   - _id: ${rawDoc._id}`);
            console.log(`   - isApplicationActive: ${rawDoc.isApplicationActive}`);
            console.log(`   - maintenanceMode: ${rawDoc.maintenanceMode}`);
            console.log(`   - contactInfo: ${rawDoc.contactInfo ? 'Present' : 'Missing'}`);
            
            if (rawDoc.contactInfo) {
                console.log('📞 contactInfo details:');
                console.log(`   - phone: "${rawDoc.contactInfo.phone}"`);
                console.log(`   - email: "${rawDoc.contactInfo.email}"`);
                console.log(`   - whatsapp: "${rawDoc.contactInfo.whatsapp}"`);
                console.log(`   - address: "${rawDoc.contactInfo.address}"`);
            }
            
            console.log(`   - orderSettings: ${rawDoc.orderSettings ? 'Present' : 'Missing'}`);
            console.log(`   - deliverySettings: ${rawDoc.deliverySettings ? 'Present' : 'Missing'}`);
            console.log(`   - features: ${rawDoc.features ? 'Present' : 'Missing'}`);
        } else {
            console.log('❌ No raw document found');
        }

        // Test getSettings method
        console.log('\n2. Testing getSettings method...');
        try {
            const settings = await AppSettings.getSettings();
            console.log('✅ getSettings method working');
            console.log('📋 getSettings result structure:');
            console.log(`   - _id: ${settings._id}`);
            console.log(`   - isApplicationActive: ${settings.isApplicationActive}`);
            console.log(`   - maintenanceMode: ${settings.maintenanceMode}`);
            console.log(`   - contactInfo: ${settings.contactInfo ? 'Present' : 'Missing'}`);
            
            if (settings.contactInfo) {
                console.log('📞 contactInfo from getSettings:');
                console.log(`   - phone: "${settings.contactInfo.phone}"`);
                console.log(`   - email: "${settings.contactInfo.email}"`);
                console.log(`   - whatsapp: "${settings.contactInfo.whatsapp}"`);
                console.log(`   - address: "${settings.contactInfo.address}"`);
            }
            
            console.log(`   - orderSettings: ${settings.orderSettings ? 'Present' : 'Missing'}`);
            console.log(`   - deliverySettings: ${settings.deliverySettings ? 'Present' : 'Missing'}`);
            console.log(`   - features: ${settings.features ? 'Present' : 'Missing'}`);
            
            // Test JSON serialization
            console.log('\n3. Testing JSON serialization...');
            const jsonString = JSON.stringify(settings);
            const parsed = JSON.parse(jsonString);
            console.log(`   - contactInfo in JSON: ${parsed.contactInfo ? 'Present' : 'Missing'}`);
            
        } catch (error) {
            console.log('❌ getSettings method failed:', error.message);
        }

        // Test direct API call simulation
        console.log('\n4. Simulating API controller logic...');
        try {
            const settings = await AppSettings.getSettings();
            const apiResponse = {
                success: true,
                data: { settings },
                message: 'Application settings retrieved successfully'
            };
            
            console.log('📋 API response structure:');
            console.log(`   - success: ${apiResponse.success}`);
            console.log(`   - data.settings: ${apiResponse.data.settings ? 'Present' : 'Missing'}`);
            console.log(`   - data.settings.contactInfo: ${apiResponse.data.settings.contactInfo ? 'Present' : 'Missing'}`);
            
            if (apiResponse.data.settings.contactInfo) {
                console.log('📞 contactInfo in API response:');
                console.log(`   - phone: "${apiResponse.data.settings.contactInfo.phone}"`);
                console.log(`   - email: "${apiResponse.data.settings.contactInfo.email}"`);
            }
            
        } catch (error) {
            console.log('❌ API simulation failed:', error.message);
        }

        // Check if contactInfo field is defined in schema
        console.log('\n5. Checking schema definition...');
        const schema = AppSettings.schema;
        const contactInfoPath = schema.paths.contactInfo;
        console.log(`   - contactInfo in schema: ${contactInfoPath ? 'Present' : 'Missing'}`);
        if (contactInfoPath) {
            console.log(`   - contactInfo type: ${contactInfoPath.instance}`);
        }

        console.log('\n🎯 DEBUG COMPLETE!');
        console.log('==================');

    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Database connection closed');
    }
}

debugAppSettings();
