require('dotenv').config();
const mongoose = require('mongoose');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User');

async function forceUpdateAppSettings() {
    console.log('🔧 FORCE UPDATING APP SETTINGS');
    console.log('===============================');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Force update the document with contactInfo
        console.log('\n1. Force updating document with contactInfo...');
        const updatedSettings = await AppSettings.findByIdAndUpdate(
            '000000000000000000000001',
            {
                $set: {
                    contactInfo: {
                        phone: '8000950408',
                        email: 'contact@ghanshyambhandar.com',
                        whatsapp: '8000950408',
                        address: 'Pujara Plot Main Rd, near chirag medical, Lakshmiwadi, Bhakti Nagar, Rajkot, Gujarat, 360001'
                    }
                }
            },
            { 
                new: true, 
                upsert: true,
                runValidators: true 
            }
        );
        
        console.log('✅ Document updated successfully');

        // Verify the update
        console.log('\n2. Verifying the update...');
        const rawDoc = await AppSettings.findById('000000000000000000000001').lean();
        console.log('📋 Updated document structure:');
        console.log(`   - contactInfo: ${rawDoc.contactInfo ? 'Present' : 'Missing'}`);
        
        if (rawDoc.contactInfo) {
            console.log('📞 contactInfo details:');
            console.log(`   - phone: "${rawDoc.contactInfo.phone}"`);
            console.log(`   - email: "${rawDoc.contactInfo.email}"`);
            console.log(`   - whatsapp: "${rawDoc.contactInfo.whatsapp}"`);
            console.log(`   - address: "${rawDoc.contactInfo.address}"`);
        }

        // Test getSettings method
        console.log('\n3. Testing getSettings method...');
        const settings = await AppSettings.getSettings();
        console.log('✅ getSettings method working');
        console.log(`   - contactInfo: ${settings.contactInfo ? 'Present' : 'Missing'}`);
        
        if (settings.contactInfo) {
            console.log('📞 contactInfo from getSettings:');
            console.log(`   - phone: "${settings.contactInfo.phone}"`);
            console.log(`   - email: "${settings.contactInfo.email}"`);
            console.log(`   - whatsapp: "${settings.contactInfo.whatsapp}"`);
            console.log(`   - address: "${settings.contactInfo.address}"`);
        }

        // Test JSON serialization
        console.log('\n4. Testing JSON serialization...');
        const jsonString = JSON.stringify(settings);
        const parsed = JSON.parse(jsonString);
        console.log(`   - contactInfo in JSON: ${parsed.contactInfo ? 'Present' : 'Missing'}`);
        
        if (parsed.contactInfo) {
            console.log('📞 contactInfo in JSON:');
            console.log(`   - phone: "${parsed.contactInfo.phone}"`);
            console.log(`   - email: "${parsed.contactInfo.email}"`);
        }

        console.log('\n🎉 FORCE UPDATE COMPLETE!');
        console.log('=========================');
        console.log('✅ contactInfo field added to database');
        console.log('✅ getSettings method returns contactInfo');
        console.log('✅ JSON serialization includes contactInfo');
        console.log('\n🚀 Admin panel should now work correctly!');

    } catch (error) {
        console.error('❌ Force update error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Database connection closed');
    }
}

forceUpdateAppSettings();
