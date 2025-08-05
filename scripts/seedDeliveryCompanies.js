require('dotenv').config();
const mongoose = require('mongoose');
const DeliveryCompany = require('../models/DeliveryCompany');

const sampleDeliveryCompanies = [
    {
        name: 'Express Delivery Services',
        code: 'EDS',
        type: 'local',
        contactInfo: {
            primaryContact: {
                name: 'Rajesh Kumar',
                designation: 'Operations Manager',
                phone: '+91-9876543210',
                email: 'rajesh@expressdelivery.com'
            },
            companyPhone: '+91-11-12345678',
            companyEmail: 'info@expressdelivery.com',
            website: 'https://expressdelivery.com',
            supportPhone: '+91-11-87654321',
            supportEmail: 'support@expressdelivery.com'
        },
        address: {
            street: '123 Industrial Area',
            area: 'Sector 15',
            city: 'Gurgaon',
            state: 'Haryana',
            country: 'India',
            postalCode: '122001',
            landmark: 'Near Metro Station'
        },
        serviceAreas: [
            {
                state: 'Delhi',
                cities: ['New Delhi', 'Gurgaon', 'Noida', 'Faridabad'],
                postalCodes: ['110001', '110002', '122001', '201301'],
                isActive: true
            },
            {
                state: 'Haryana',
                cities: ['Gurgaon', 'Faridabad', 'Panipat'],
                postalCodes: ['122001', '121001', '132103'],
                isActive: true
            }
        ],
        pricing: {
            baseRate: 40,
            perKgRate: 15,
            perKmRate: 2,
            codCharges: 25,
            codChargeType: 'fixed',
            fuelSurcharge: 5,
            handlingCharges: 10,
            packagingCharges: 0,
            insuranceRate: 0.5,
            minimumCharges: 40,
            freeDeliveryThreshold: 500
        },
        services: {
            codAvailable: true,
            expressDelivery: true,
            sameDay: true,
            nextDay: true,
            scheduledDelivery: false,
            trackingAvailable: true,
            pickupService: true,
            returnService: true,
            bulkDiscount: true,
            insuranceAvailable: true
        },
        deliveryTime: {
            standard: '2-3 days',
            express: '1 day',
            sameDay: 'Same day',
            estimatedDays: 2
        },
        limits: {
            maxWeight: 25,
            maxLength: 80,
            maxWidth: 60,
            maxHeight: 40,
            maxValue: 50000
        },
        performance: {
            rating: 4.2,
            totalOrders: 1250,
            successfulDeliveries: 1180,
            failedDeliveries: 70,
            averageDeliveryTime: 2.1,
            customerRating: 4.1,
            onTimeDeliveryRate: 85
        },
        businessInfo: {
            gstNumber: '07ABCDE1234F1Z5',
            panNumber: 'ABCDE1234F',
            licenseNumber: 'DL-EDS-2020-001',
            establishedYear: 2018,
            employeeCount: 45,
            vehicleCount: 25
        },
        status: 'active',
        isApproved: true,
        isPreferred: true,
        priority: 8
    },
    {
        name: 'Quick Transport Solutions',
        code: 'QTS',
        type: 'regional',
        contactInfo: {
            primaryContact: {
                name: 'Priya Sharma',
                designation: 'Regional Head',
                phone: '+91-9123456789',
                email: 'priya@quicktransport.com'
            },
            companyPhone: '+91-22-98765432',
            companyEmail: 'contact@quicktransport.com',
            website: 'https://quicktransport.com',
            supportPhone: '+91-22-11223344',
            supportEmail: 'help@quicktransport.com'
        },
        address: {
            street: '456 Transport Hub',
            area: 'Andheri East',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India',
            postalCode: '400069',
            landmark: 'Opposite SEEPZ'
        },
        serviceAreas: [
            {
                state: 'Maharashtra',
                cities: ['Mumbai', 'Pune', 'Nashik', 'Aurangabad'],
                postalCodes: ['400001', '411001', '422001', '431001'],
                isActive: true
            },
            {
                state: 'Gujarat',
                cities: ['Ahmedabad', 'Surat', 'Vadodara'],
                postalCodes: ['380001', '395001', '390001'],
                isActive: true
            }
        ],
        pricing: {
            baseRate: 50,
            perKgRate: 20,
            perKmRate: 3,
            codCharges: 30,
            codChargeType: 'fixed',
            fuelSurcharge: 8,
            handlingCharges: 15,
            packagingCharges: 5,
            insuranceRate: 0.8,
            minimumCharges: 50,
            freeDeliveryThreshold: 750
        },
        services: {
            codAvailable: true,
            expressDelivery: true,
            sameDay: false,
            nextDay: true,
            scheduledDelivery: true,
            trackingAvailable: true,
            pickupService: true,
            returnService: true,
            bulkDiscount: true,
            insuranceAvailable: true
        },
        deliveryTime: {
            standard: '3-4 days',
            express: '1-2 days',
            sameDay: 'Not available',
            estimatedDays: 3
        },
        limits: {
            maxWeight: 50,
            maxLength: 120,
            maxWidth: 80,
            maxHeight: 60,
            maxValue: 100000
        },
        performance: {
            rating: 3.8,
            totalOrders: 2100,
            successfulDeliveries: 1950,
            failedDeliveries: 150,
            averageDeliveryTime: 3.2,
            customerRating: 3.9,
            onTimeDeliveryRate: 78
        },
        businessInfo: {
            gstNumber: '27FGHIJ5678K2L6',
            panNumber: 'FGHIJ5678K',
            licenseNumber: 'MH-QTS-2019-002',
            establishedYear: 2015,
            employeeCount: 120,
            vehicleCount: 80
        },
        status: 'active',
        isApproved: true,
        isPreferred: false,
        priority: 6
    },
    {
        name: 'City Courier Network',
        code: 'CCN',
        type: 'local',
        contactInfo: {
            primaryContact: {
                name: 'Amit Patel',
                designation: 'City Manager',
                phone: '+91-9988776655',
                email: 'amit@citycourier.com'
            },
            companyPhone: '+91-80-55443322',
            companyEmail: 'operations@citycourier.com',
            website: 'https://citycourier.com',
            supportPhone: '+91-80-99887766',
            supportEmail: 'support@citycourier.com'
        },
        address: {
            street: '789 Courier Street',
            area: 'Electronic City',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560100',
            landmark: 'Near Tech Park'
        },
        serviceAreas: [
            {
                state: 'Karnataka',
                cities: ['Bangalore', 'Mysore', 'Hubli'],
                postalCodes: ['560001', '570001', '580001'],
                isActive: true
            }
        ],
        pricing: {
            baseRate: 35,
            perKgRate: 12,
            perKmRate: 1.5,
            codCharges: 20,
            codChargeType: 'fixed',
            fuelSurcharge: 3,
            handlingCharges: 8,
            packagingCharges: 0,
            insuranceRate: 0.3,
            minimumCharges: 35,
            freeDeliveryThreshold: 400
        },
        services: {
            codAvailable: true,
            expressDelivery: false,
            sameDay: true,
            nextDay: true,
            scheduledDelivery: false,
            trackingAvailable: true,
            pickupService: true,
            returnService: false,
            bulkDiscount: false,
            insuranceAvailable: false
        },
        deliveryTime: {
            standard: '2-3 days',
            express: 'Not available',
            sameDay: 'Same day',
            estimatedDays: 2
        },
        limits: {
            maxWeight: 20,
            maxLength: 60,
            maxWidth: 40,
            maxHeight: 30,
            maxValue: 25000
        },
        performance: {
            rating: 4.0,
            totalOrders: 850,
            successfulDeliveries: 800,
            failedDeliveries: 50,
            averageDeliveryTime: 2.3,
            customerRating: 4.2,
            onTimeDeliveryRate: 88
        },
        businessInfo: {
            gstNumber: '29KLMNO9012P3Q7',
            panNumber: 'KLMNO9012P',
            licenseNumber: 'KA-CCN-2021-003',
            establishedYear: 2020,
            employeeCount: 30,
            vehicleCount: 20
        },
        status: 'active',
        isApproved: true,
        isPreferred: false,
        priority: 5
    }
];

async function seedDeliveryCompanies() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing delivery companies
        await DeliveryCompany.deleteMany({});
        console.log('Cleared existing delivery companies');

        // Insert sample data
        const companies = await DeliveryCompany.insertMany(sampleDeliveryCompanies);
        console.log(`✅ Successfully seeded ${companies.length} delivery companies`);

        // Display created companies
        companies.forEach(company => {
            console.log(`- ${company.name} (${company.code}) - ${company.type} - ${company.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding delivery companies:', error);
        process.exit(1);
    }
}

// Run the seeding function
if (require.main === module) {
    seedDeliveryCompanies();
}

module.exports = { seedDeliveryCompanies, sampleDeliveryCompanies };
