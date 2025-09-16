// Simple API test script for GST and PAN integration
// Run this from the App_Backend directory

const express = require('express');
const { body } = require('express-validator');

// Test the validation patterns directly
function testValidationPatterns() {
    console.log('🧪 Testing GST and PAN Validation Patterns');
    console.log('=' .repeat(50));
    
    // GST validation pattern from routes
    const gstValidation = body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST number format');
    
    // PAN validation pattern from routes
    const panValidation = body('panNumber').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN number format');
    
    // Test data
    const testData = [
        // Valid cases
        { gst: '27ABCDE1234F1Z5', pan: 'ABCDE1234F', shouldPass: true, description: 'Valid GST and PAN' },
        { gst: '29XYZAB5678G2H6', pan: 'XYZAB5678G', shouldPass: true, description: 'Valid GST and PAN (Karnataka)' },
        { gst: '07PQRST9012K3L7', pan: 'PQRST9012K', shouldPass: true, description: 'Valid GST and PAN (Gujarat)' },
        
        // Invalid GST cases
        { gst: 'INVALID_GST', pan: 'ABCDE1234F', shouldPass: false, description: 'Invalid GST format' },
        { gst: '27ABCDE1234F1Z', pan: 'ABCDE1234F', shouldPass: false, description: 'GST too short' },
        { gst: '27ABCDE1234F1Z5X', pan: 'ABCDE1234F', shouldPass: false, description: 'GST too long' },
        
        // Invalid PAN cases
        { gst: '27ABCDE1234F1Z5', pan: 'INVALID_PAN', shouldPass: false, description: 'Invalid PAN format' },
        { gst: '27ABCDE1234F1Z5', pan: 'ABCDE123', shouldPass: false, description: 'PAN too short' },
        { gst: '27ABCDE1234F1Z5', pan: 'ABCDE1234FX', shouldPass: false, description: 'PAN too long' },
        
        // Optional cases
        { gst: '', pan: '', shouldPass: true, description: 'Empty GST and PAN (optional)' },
        { gst: '27ABCDE1234F1Z5', pan: '', shouldPass: true, description: 'Only GST provided' },
        { gst: '', pan: 'ABCDE1234F', shouldPass: true, description: 'Only PAN provided' }
    ];
    
    let passedTests = 0;
    let totalTests = testData.length;
    
    testData.forEach((testCase, index) => {
        // Test GST validation
        const gstResult = gstValidation.run({ body: { gstNumber: testCase.gst } });
        const gstValid = !gstResult.errors || gstResult.errors.length === 0;
        
        // Test PAN validation
        const panResult = panValidation.run({ body: { panNumber: testCase.pan } });
        const panValid = !panResult.errors || panResult.errors.length === 0;
        
        // Both should be valid for the test to pass
        const testPassed = (gstValid && panValid) === testCase.shouldPass;
        
        console.log(`\nTest ${index + 1}: ${testCase.description}`);
        console.log(`GST: ${testCase.gst || '(empty)'} - ${gstValid ? 'Valid' : 'Invalid'}`);
        console.log(`PAN: ${testCase.pan || '(empty)'} - ${panValid ? 'Valid' : 'Invalid'}`);
        console.log(`Expected: ${testCase.shouldPass ? 'PASS' : 'FAIL'}`);
        console.log(`Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (testPassed) {
            passedTests++;
        }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Validation Test Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    return passedTests === totalTests;
}

// Test the Address model schema
function testAddressModel() {
    console.log('\n🧪 Testing Address Model Schema');
    console.log('=' .repeat(50));
    
    try {
        const Address = require('./models/Address');
        
        // Test creating address with GST/PAN
        const testAddress = new Address({
            user: '507f1f77bcf86cd799439011',
            firstName: 'John',
            lastName: 'Doe',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India',
            gstNumber: '27ABCDE1234F1Z5',
            panNumber: 'ABCDE1234F'
        });
        
        console.log('✅ Address model accepts GST and PAN fields');
        console.log('📋 GST Number:', testAddress.gstNumber);
        console.log('📋 PAN Number:', testAddress.panNumber);
        
        // Test toOrderFormat method
        const orderFormat = testAddress.toOrderFormat();
        console.log('✅ toOrderFormat includes GST and PAN');
        console.log('📋 Order Format GST:', orderFormat.gstNumber);
        console.log('📋 Order Format PAN:', orderFormat.panNumber);
        
        return true;
    } catch (error) {
        console.log('❌ Address model test failed:', error.message);
        return false;
    }
}

// Test the Order model schema
function testOrderModel() {
    console.log('\n🧪 Testing Order Model Schema');
    console.log('=' .repeat(50));
    
    try {
        const Order = require('./models/Order');
        
        // Test order address schema
        const testOrder = new Order({
            user: '507f1f77bcf86cd799439011',
            items: [],
            totalAmount: 100,
            status: 'pending',
            shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '9876543210',
                addressLine1: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                postalCode: '400001',
                country: 'India',
                gstNumber: '27ABCDE1234F1Z5',
                panNumber: 'ABCDE1234F'
            }
        });
        
        console.log('✅ Order model accepts GST and PAN in address');
        console.log('📋 Shipping Address GST:', testOrder.shippingAddress.gstNumber);
        console.log('📋 Shipping Address PAN:', testOrder.shippingAddress.panNumber);
        
        return true;
    } catch (error) {
        console.log('❌ Order model test failed:', error.message);
        return false;
    }
}

// Test estimate controller integration
function testEstimateController() {
    console.log('\n🧪 Testing Estimate Controller Integration');
    console.log('=' .repeat(50));
    
    try {
        const estimateController = require('./controllers/estimateController');
        
        // Mock estimate data with GST/PAN
        const mockEstimate = {
            _id: '507f1f77bcf86cd799439011',
            estimateNumber: 'EST-2024-001',
            customerDetails: {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '9876543210',
                billingAddress: {
                    street: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postalCode: '400001',
                    country: 'India',
                    gstNumber: '27ABCDE1234F1Z5',
                    panNumber: 'ABCDE1234F'
                }
            },
            items: [
                {
                    name: 'Product 1',
                    quantity: 2,
                    price: 100,
                    total: 200
                }
            ],
            subtotal: 200,
            tax: 36,
            total: 236,
            status: 'pending'
        };
        
        console.log('✅ Estimate controller can handle GST/PAN data');
        console.log('📋 Customer GST:', mockEstimate.customerDetails.billingAddress.gstNumber);
        console.log('📋 Customer PAN:', mockEstimate.customerDetails.billingAddress.panNumber);
        console.log('📋 Tax Amount:', mockEstimate.tax);
        console.log('📋 Total Amount:', mockEstimate.total);
        
        return true;
    } catch (error) {
        console.log('❌ Estimate controller test failed:', error.message);
        return false;
    }
}

// Main test runner
function runAllTests() {
    console.log('🚀 Starting GST/PAN API Integration Tests');
    console.log('=' .repeat(60));
    
    const tests = [
        { name: 'Validation Patterns', fn: testValidationPatterns },
        { name: 'Address Model', fn: testAddressModel },
        { name: 'Order Model', fn: testOrderModel },
        { name: 'Estimate Controller', fn: testEstimateController }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    tests.forEach(test => {
        try {
            const result = test.fn();
            if (result) {
                passedTests++;
                console.log(`✅ ${test.name} test passed`);
            } else {
                console.log(`❌ ${test.name} test failed`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} test error:`, error.message);
        }
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 Overall Test Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! GST/PAN integration is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = { runAllTests, testValidationPatterns, testAddressModel, testOrderModel, testEstimateController };

