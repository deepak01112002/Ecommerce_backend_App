const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ghanshyam_murti_bhandar', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const categoryData = [
    // Main Categories
    {
        name: "Murtis & Idols",
        description: "Beautiful handcrafted murtis and idols of various deities",
        image: "uploads/categories/murtis-main.jpg",
        subcategories: [
            {
                name: "Ganesha Murtis",
                description: "Lord Ganesha idols in various sizes and materials",
                image: "uploads/categories/ganesha-murtis.jpg"
            },
            {
                name: "Krishna Murtis",
                description: "Lord Krishna idols and figurines",
                image: "uploads/categories/krishna-murtis.jpg"
            },
            {
                name: "Shiva Murtis",
                description: "Lord Shiva idols and lingams",
                image: "uploads/categories/shiva-murtis.jpg"
            },
            {
                name: "Lakshmi Murtis",
                description: "Goddess Lakshmi idols for prosperity",
                image: "uploads/categories/lakshmi-murtis.jpg"
            },
            {
                name: "Hanuman Murtis",
                description: "Lord Hanuman idols and statues",
                image: "uploads/categories/hanuman-murtis.jpg"
            }
        ]
    },
    {
        name: "Puja Items",
        description: "Essential items for daily worship and special ceremonies",
        image: "uploads/categories/puja-items-main.jpg",
        subcategories: [
            {
                name: "Incense & Dhoop",
                description: "Agarbatti, dhoop sticks, and incense holders",
                image: "uploads/categories/incense-dhoop.jpg"
            },
            {
                name: "Diyas & Lamps",
                description: "Traditional oil lamps and decorative diyas",
                image: "uploads/categories/diyas-lamps.jpg"
            },
            {
                name: "Puja Thalis",
                description: "Decorative plates for worship rituals",
                image: "uploads/categories/puja-thalis.jpg"
            },
            {
                name: "Kalash & Vessels",
                description: "Sacred vessels for water and offerings",
                image: "uploads/categories/kalash-vessels.jpg"
            },
            {
                name: "Bells & Ghanti",
                description: "Temple bells and worship accessories",
                image: "uploads/categories/bells-ghanti.jpg"
            }
        ]
    },
    {
        name: "Spiritual Books",
        description: "Sacred texts, mantras, and spiritual literature",
        image: "uploads/categories/spiritual-books-main.jpg",
        subcategories: [
            {
                name: "Bhagavad Gita",
                description: "Various editions of the sacred Bhagavad Gita",
                image: "uploads/categories/bhagavad-gita.jpg"
            },
            {
                name: "Ramayana",
                description: "Epic tale of Lord Rama in different languages",
                image: "uploads/categories/ramayana.jpg"
            },
            {
                name: "Vedas & Upanishads",
                description: "Ancient Vedic texts and commentaries",
                image: "uploads/categories/vedas-upanishads.jpg"
            },
            {
                name: "Devotional Songs",
                description: "Bhajans, aartis, and devotional music",
                image: "uploads/categories/devotional-songs.jpg"
            }
        ]
    },
    {
        name: "Jewelry & Ornaments",
        description: "Traditional jewelry and decorative ornaments for deities",
        image: "uploads/categories/jewelry-main.jpg",
        subcategories: [
            {
                name: "Deity Crowns",
                description: "Beautiful crowns for murti decoration",
                image: "uploads/categories/deity-crowns.jpg"
            },
            {
                name: "Necklaces & Malas",
                description: "Sacred necklaces and prayer beads",
                image: "uploads/categories/necklaces-malas.jpg"
            },
            {
                name: "Bangles & Bracelets",
                description: "Traditional bangles for deity adornment",
                image: "uploads/categories/bangles-bracelets.jpg"
            }
        ]
    },
    {
        name: "Home Decor",
        description: "Spiritual and traditional home decoration items",
        image: "uploads/categories/home-decor-main.jpg",
        subcategories: [
            {
                name: "Wall Hangings",
                description: "Spiritual wall art and decorative hangings",
                image: "uploads/categories/wall-hangings.jpg"
            },
            {
                name: "Rangoli Supplies",
                description: "Colors and stencils for rangoli designs",
                image: "uploads/categories/rangoli-supplies.jpg"
            },
            {
                name: "Torans & Garlands",
                description: "Decorative door hangings and garlands",
                image: "uploads/categories/torans-garlands.jpg"
            }
        ]
    },
    {
        name: "Festival Items",
        description: "Special items for Hindu festivals and celebrations",
        image: "uploads/categories/festival-items-main.jpg",
        subcategories: [
            {
                name: "Diwali Specials",
                description: "Lamps, decorations, and gifts for Diwali",
                image: "uploads/categories/diwali-specials.jpg"
            },
            {
                name: "Holi Colors",
                description: "Natural and safe colors for Holi celebration",
                image: "uploads/categories/holi-colors.jpg"
            },
            {
                name: "Raksha Bandhan",
                description: "Rakhis and gifts for brother-sister festival",
                image: "uploads/categories/raksha-bandhan.jpg"
            },
            {
                name: "Navratri Items",
                description: "Special items for nine-day Navratri festival",
                image: "uploads/categories/navratri-items.jpg"
            }
        ]
    }
];

async function seedCategories() {
    try {
        console.log('Starting category seeding...');
        
        // Clear existing categories
        await Category.deleteMany({});
        console.log('Cleared existing categories');

        for (const categoryInfo of categoryData) {
            // Create main category
            const mainCategory = new Category({
                name: categoryInfo.name,
                description: categoryInfo.description,
                image: categoryInfo.image,
                parent: null,
                isActive: true,
                sortOrder: 0
            });

            await mainCategory.save();
            console.log(`Created main category: ${mainCategory.name}`);

            // Create subcategories
            for (const subCategoryInfo of categoryInfo.subcategories) {
                const subCategory = new Category({
                    name: subCategoryInfo.name,
                    description: subCategoryInfo.description,
                    image: subCategoryInfo.image,
                    parent: mainCategory._id,
                    isActive: true,
                    sortOrder: 0
                });

                await subCategory.save();
                console.log(`  Created subcategory: ${subCategory.name}`);
            }
        }

        console.log('Category seeding completed successfully!');
        
        // Display the created categories
        const allCategories = await Category.find({}).populate('parent', 'name');
        console.log('\n=== CREATED CATEGORIES ===');
        
        const mainCategories = allCategories.filter(cat => !cat.parent);
        for (const mainCat of mainCategories) {
            console.log(`\n📁 ${mainCat.name}`);
            const subCategories = allCategories.filter(cat => cat.parent && cat.parent._id.toString() === mainCat._id.toString());
            for (const subCat of subCategories) {
                console.log(`  └── ${subCat.name}`);
            }
        }
        
        console.log(`\nTotal categories created: ${allCategories.length}`);
        console.log(`Main categories: ${mainCategories.length}`);
        console.log(`Subcategories: ${allCategories.length - mainCategories.length}`);
        
    } catch (error) {
        console.error('Error seeding categories:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seeding function
seedCategories();
