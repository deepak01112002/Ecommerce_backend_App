const mongoose = require('mongoose');
require('dotenv').config();

// Import the SocialMedia model
const SocialMedia = require('../models/SocialMedia');

const updateSocialMediaIcons = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('Connected to MongoDB');

        // Find all social media entries
        const socialMediaEntries = await SocialMedia.find({});
        console.log(`Found ${socialMediaEntries.length} social media entries`);

        // Update each entry to remove emoji icons (set to empty string)
        for (const entry of socialMediaEntries) {
            if (entry.icon && entry.icon.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
                entry.icon = '';
                await entry.save();
                console.log(`Updated icon for ${entry.name} (${entry.platform}) - removed emoji icon`);
            }
        }

        console.log('Social media icons updated successfully!');
        
        // Verify the updates
        const updatedEntries = await SocialMedia.find({});
        console.log('\nVerification - Updated social media entries:');
        updatedEntries.forEach(entry => {
            console.log(`- ${entry.name} (${entry.platform}): icon="${entry.icon}"`);
        });

    } catch (error) {
        console.error('Error updating social media icons:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the update
updateSocialMediaIcons();
