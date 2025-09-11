const mongoose = require('mongoose');
require('dotenv').config();

// Import the SocialMedia model
const SocialMedia = require('../models/SocialMedia');

const updateWhatsAppPhone = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('Connected to MongoDB');

        // Find all WhatsApp entries
        const whatsappEntries = await SocialMedia.find({ platform: 'whatsapp' });
        console.log(`Found ${whatsappEntries.length} WhatsApp entries`);

        // Update each WhatsApp entry with the new phone number
        for (const entry of whatsappEntries) {
            if (entry.whatsappConfig) {
                entry.whatsappConfig.phoneNumber = '8000950408';
                await entry.save();
                console.log(`Updated WhatsApp entry: ${entry.name} - Phone: ${entry.whatsappConfig.phoneNumber}`);
            }
        }

        console.log('WhatsApp phone numbers updated successfully!');
        
        // Verify the updates
        const updatedEntries = await SocialMedia.find({ platform: 'whatsapp' });
        console.log('\nVerification - Updated WhatsApp entries:');
        updatedEntries.forEach(entry => {
            if (entry.whatsappConfig) {
                console.log(`- ${entry.name}: ${entry.whatsappConfig.phoneNumber}`);
                console.log(`  URL: ${entry.formattedWhatsappUrl}`);
            }
        });

    } catch (error) {
        console.error('Error updating WhatsApp phone numbers:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the update
updateWhatsAppPhone();
