# Database Seeding Guide

This guide explains how to seed the Ghanshyam Murti Bhandar database with comprehensive dummy data.

## Overview

The seeding system populates all models with realistic data including:
- **Users**: 5 users (1 admin, 4 regular users)
- **Categories**: 8 categories for different types of murtis and puja items
- **Products**: 11 products across all categories with variants, pricing, and specifications
- **Reviews**: 11 reviews with ratings and comments from verified purchases
- **Coupons**: 5 coupons with different discount types and conditions
- **Carts**: 4 active carts with items from different users
- **Wishlists**: 4 wishlists with saved products
- **Orders**: 5 orders with different statuses and payment methods

## Quick Start

### Seed Database
```bash
npm run seed
```

### Verify Seeded Data
```bash
npm run verify
```

### Seed and Verify in One Command
```bash
npm run seed-and-verify
```

## Manual Commands

### Run Seed Script Directly
```bash
node scripts/seedDatabase.js
```

### Run Verification Script Directly
```bash
node scripts/verifyData.js
```

## Seeded Data Details

### Users
- **Admin User**: admin@ghanshyam.com (password: admin123)
- **Regular Users**: 
  - rajesh@example.com (password: password123)
  - priya@example.com (password: password123)
  - amit@example.com (password: password123)
  - sunita@example.com (password: password123)

### Categories
1. Ganesha Murtis
2. Krishna Murtis
3. Shiva Murtis
4. Durga Murtis
5. Hanuman Murtis
6. Lakshmi Murtis
7. Saraswati Murtis
8. Puja Items

### Products
Each product includes:
- Multiple variants (sizes, materials)
- Realistic pricing with discounts
- Product images paths
- Detailed specifications
- SEO-friendly slugs
- Stock quantities
- Ratings and review counts

### Sample Products
- Brass Ganesha Murti - Small (₹1,299)
- Marble Ganesha Statue - Premium (₹4,999)
- Krishna with Flute - Bronze (₹2,299)
- Radha Krishna Pair - Silver Plated (₹3,799)
- Shiva Lingam - Black Stone (₹899)
- Nataraja - Dancing Shiva Brass (₹3,299)
- Durga Mata Brass Murti (₹2,799)
- Hanuman Chalisa Brass Murti (₹1,899)
- Lakshmi Mata Silver Plated Murti (₹3,499)
- Saraswati Mata White Marble Murti (₹4,299)
- Complete Puja Thali Set - Brass (₹1,599)

### Coupons
- **WELCOME10**: 10% off for new customers
- **GANESHA20**: 20% off on Ganesha murtis
- **FLAT500**: ₹500 off on orders above ₹2,999
- **KRISHNA15**: 15% off on Krishna murtis
- **EXPIRED10**: Expired coupon for testing

### Orders
Orders with different statuses:
- Delivered orders
- Shipped orders
- Confirmed orders
- Pending orders
- Cancelled orders

## Database Connection

The seeding scripts use the same database connection as the main application:
- **Environment Variable**: `MONGO_URI`
- **Default**: `mongodb://localhost:27017/ghanshyam_murti_bhandar`

## Important Notes

1. **Data Clearing**: The seed script clears all existing data before seeding
2. **Relationships**: All relationships between models are properly maintained
3. **Realistic Data**: All data is realistic and suitable for testing/demo purposes
4. **Password Hashing**: User passwords are properly hashed using bcrypt
5. **Product Ratings**: Product ratings are automatically calculated from reviews

## Troubleshooting

### Connection Issues
If you get connection errors, ensure:
1. MongoDB is running
2. Environment variables are set correctly
3. Database credentials are valid

### Duplicate Key Errors
If you encounter duplicate key errors:
1. The script should handle clearing data automatically
2. If issues persist, manually clear the database collections

### Missing Dependencies
Ensure all dependencies are installed:
```bash
npm install
```

## API Testing

After seeding, you can test the APIs:

### Get Products
```bash
curl -X GET http://localhost:8080/api/products
```

### Get Categories
```bash
curl -X GET http://localhost:8080/api/categories
```

### Login as Admin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ghanshyam.com","password":"admin123"}'
```

## File Structure

```
App_Backend/
├── scripts/
│   ├── seedDatabase.js     # Main seeding script
│   └── verifyData.js       # Data verification script
├── models/                 # All Mongoose models
├── package.json           # Updated with seed scripts
└── SEEDING_README.md      # This file
```

## Support

If you encounter any issues with seeding, check:
1. Database connection
2. Environment variables
3. MongoDB service status
4. Console output for specific error messages
