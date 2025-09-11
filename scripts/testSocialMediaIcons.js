const mongoose = require('mongoose');
require('dotenv').config();

// Import the SocialMedia model
const SocialMedia = require('../models/SocialMedia');

const testSocialMediaIcons = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar');
        console.log('Connected to MongoDB');

        // Create test social media entries for each platform
        const testUserId = new mongoose.Types.ObjectId(); // Create a dummy user ID
        const testEntries = [
            {
                platform: 'whatsapp',
                name: 'WhatsApp Business',
                description: 'Contact us on WhatsApp',
                whatsappConfig: {
                    phoneNumber: '8000950408',
                    defaultMessage: 'Hello! I am interested in your products from Ghanshyam Murti Bhandar.'
                },
                isActive: true,
                displayOrder: 1,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'youtube',
                name: 'YouTube Channel',
                url: 'https://youtube.com/@ghanshyammurtibhandar',
                description: 'Subscribe to our YouTube channel',
                isActive: true,
                displayOrder: 2,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'facebook',
                name: 'Facebook Page',
                url: 'https://facebook.com/ghanshyammurtibhandar',
                description: 'Follow us on Facebook',
                isActive: true,
                displayOrder: 3,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'instagram',
                name: 'Instagram Profile',
                url: 'https://instagram.com/ghanshyammurtibhandar',
                description: 'Follow us on Instagram',
                isActive: true,
                displayOrder: 4,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'twitter',
                name: 'Twitter Profile',
                url: 'https://twitter.com/ghanshyammurtibhandar',
                description: 'Follow us on Twitter',
                isActive: true,
                displayOrder: 5,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'linkedin',
                name: 'LinkedIn Page',
                url: 'https://linkedin.com/company/ghanshyammurtibhandar',
                description: 'Connect with us on LinkedIn',
                isActive: true,
                displayOrder: 6,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'telegram',
                name: 'Telegram Channel',
                url: 'https://t.me/ghanshyammurtibhandar',
                description: 'Join our Telegram channel',
                isActive: true,
                displayOrder: 7,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            },
            {
                platform: 'website',
                name: 'Official Website',
                url: 'https://ghanshyammurtibhandar.com',
                description: 'Visit our official website',
                isActive: true,
                displayOrder: 8,
                openInNewTab: true,
                showOnMobile: true,
                showOnWeb: true,
                createdBy: testUserId
            }
        ];

        console.log('Creating test social media entries...');
        
        // Clear existing entries first
        await SocialMedia.deleteMany({});
        console.log('Cleared existing social media entries');

        // Create new entries
        for (const entry of testEntries) {
            const socialMediaLink = await SocialMedia.create(entry);
            console.log(`Created ${socialMediaLink.name} (${socialMediaLink.platform})`);
            console.log(`  - Icon: "${socialMediaLink.icon}" (should be empty for auto-generation)`);
            console.log(`  - URL: ${socialMediaLink.url || 'N/A (WhatsApp auto-generated)'}`);
            if (socialMediaLink.platform === 'whatsapp') {
                console.log(`  - WhatsApp URL: ${socialMediaLink.formattedWhatsappUrl}`);
            }
            console.log('');
        }

        console.log('✅ Test social media entries created successfully!');
        console.log('\n📱 Frontend will automatically display proper platform icons:');
        console.log('  - WhatsApp: Green WhatsApp logo');
        console.log('  - YouTube: Red YouTube logo');
        console.log('  - Facebook: Blue Facebook logo');
        console.log('  - Instagram: Gradient Instagram logo');
        console.log('  - Twitter: Blue Twitter logo');
        console.log('  - LinkedIn: Blue LinkedIn logo');
        console.log('  - Telegram: Blue Telegram logo');
        console.log('  - Website: Gray website icon');

    } catch (error) {
        console.error('Error testing social media icons:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the test
testSocialMediaIcons();
