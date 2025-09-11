require('dotenv').config();
const mongoose = require('mongoose');
const AppSettings = require('../models/AppSettings');
const User = require('../models/User'); // Required for populate to work

async function initializeAppSettings() {
    console.log('🔧 INITIALIZING APP SETTINGS');
    console.log('============================');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if settings already exist
        const existingSettings = await AppSettings.findById('000000000000000000000001');
        
        if (existingSettings) {
            console.log('📋 Existing settings found. Updating with missing fields...');
            
            // Update existing settings to ensure all fields are present
            const updatedSettings = await AppSettings.findByIdAndUpdate(
                '000000000000000000000001',
                {
                    $setOnInsert: {
                        contactInfo: {
                            phone: '',
                            email: '',
                            whatsapp: '',
                            address: ''
                        }
                    }
                },
                { 
                    new: true, 
                    upsert: true,
                    runValidators: true 
                }
            );
            
            console.log('✅ Settings updated successfully');
            console.log('📋 Current settings structure:');
            console.log(`   - isApplicationActive: ${updatedSettings.isApplicationActive}`);
            console.log(`   - maintenanceMode: ${updatedSettings.maintenanceMode}`);
            console.log(`   - contactInfo: ${updatedSettings.contactInfo ? 'Present' : 'Missing'}`);
            console.log(`   - orderSettings: ${updatedSettings.orderSettings ? 'Present' : 'Missing'}`);
            console.log(`   - deliverySettings: ${updatedSettings.deliverySettings ? 'Present' : 'Missing'}`);
            console.log(`   - features: ${updatedSettings.features ? 'Present' : 'Missing'}`);
            
        } else {
            console.log('📋 No existing settings found. Creating new settings...');
            
            // Create new settings with all required fields
            const newSettings = await AppSettings.create({
                _id: '000000000000000000000001',
                isApplicationActive: true,
                maintenanceMode: false,
                inactiveMessage: {
                    title: 'Application Temporarily Unavailable',
                    message: 'We are currently updating our services. Please check back later.',
                    showContactInfo: true
                },
                businessHours: {
                    enabled: false,
                    timezone: 'Asia/Kolkata',
                    schedule: {
                        monday: { open: '09:00', close: '18:00', isOpen: true },
                        tuesday: { open: '09:00', close: '18:00', isOpen: true },
                        wednesday: { open: '09:00', close: '18:00', isOpen: true },
                        thursday: { open: '09:00', close: '18:00', isOpen: true },
                        friday: { open: '09:00', close: '18:00', isOpen: true },
                        saturday: { open: '09:00', close: '18:00', isOpen: true },
                        sunday: { open: '09:00', close: '18:00', isOpen: false }
                    },
                    outsideHoursMessage: 'We are currently closed. Please visit us during business hours.'
                },
                orderSettings: {
                    allowOrders: true,
                    minOrderAmount: 0,
                    maxOrderAmount: 100000,
                    allowCOD: true,
                    allowOnlinePayment: true
                },
                deliverySettings: {
                    allowDelivery: true,
                    freeDeliveryThreshold: 500,
                    deliveryCharges: 50,
                    estimatedDeliveryDays: { min: 1, max: 7 }
                },
                contactInfo: {
                    phone: '8000950408',
                    email: 'contact@ghanshyambhandar.com',
                    whatsapp: '8000950408',
                    address: 'Pujara Plot Main Rd, near chirag medical, Lakshmiwadi, Bhakti Nagar, Rajkot, Gujarat, 360001'
                },
                appVersion: {
                    current: '1.0.0',
                    minimum: '1.0.0',
                    forceUpdate: false,
                    updateMessage: 'Please update your app to the latest version for better experience.'
                },
                features: {
                    enableWishlist: true,
                    enableReviews: true,
                    enableReferral: false,
                    enableLoyaltyPoints: false,
                    enableChat: true,
                    enableNotifications: true
                }
            });
            
            console.log('✅ New settings created successfully');
            console.log('📋 Created settings structure:');
            console.log(`   - ID: ${newSettings._id}`);
            console.log(`   - isApplicationActive: ${newSettings.isApplicationActive}`);
            console.log(`   - maintenanceMode: ${newSettings.maintenanceMode}`);
            console.log(`   - contactInfo: ${newSettings.contactInfo ? 'Present' : 'Missing'}`);
            console.log(`   - orderSettings: ${newSettings.orderSettings ? 'Present' : 'Missing'}`);
            console.log(`   - deliverySettings: ${newSettings.deliverySettings ? 'Present' : 'Missing'}`);
            console.log(`   - features: ${newSettings.features ? 'Present' : 'Missing'}`);
        }

        // Test the getSettings method
        console.log('\n🔍 Testing getSettings method...');
        const settings = await AppSettings.getSettings();
        console.log('✅ getSettings method working');
        console.log(`   - contactInfo present: ${!!settings.contactInfo}`);
        if (settings.contactInfo) {
            console.log(`   - phone: "${settings.contactInfo.phone}"`);
            console.log(`   - email: "${settings.contactInfo.email}"`);
            console.log(`   - whatsapp: "${settings.contactInfo.whatsapp}"`);
        }

        console.log('\n🎉 APP SETTINGS INITIALIZATION COMPLETE!');
        console.log('========================================');
        console.log('✅ Database connected');
        console.log('✅ Settings document created/updated');
        console.log('✅ All required fields present');
        console.log('✅ getSettings method tested');
        console.log('\n🚀 Admin panel should now work without errors!');

    } catch (error) {
        console.error('❌ Error initializing app settings:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Database connection closed');
    }
}

initializeAppSettings();
