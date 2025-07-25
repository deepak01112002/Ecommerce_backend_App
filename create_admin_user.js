const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User model
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@ghanshyambhandar.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
            
            // Update to admin role if not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin role');
            }
            
            console.log('Admin Details:', {
                id: existingAdmin._id,
                email: existingAdmin.email,
                role: existingAdmin.role,
                name: existingAdmin.fullName
            });
            
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Create admin user
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            fullName: 'Admin User',
            email: 'admin@ghanshyambhandar.com',
            password: hashedPassword,
            phone: '9876543210',
            role: 'admin',
            isActive: true,
            emailVerified: true
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully!');
        console.log('Admin Details:', {
            id: adminUser._id,
            email: adminUser.email,
            role: adminUser.role,
            name: adminUser.fullName
        });

        console.log('\n🔑 Login Credentials:');
        console.log('Email: admin@ghanshyambhandar.com');
        console.log('Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
