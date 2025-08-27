const delhiveryService = require('../services/delhiveryService');

async function testDelhiveryService() {
    console.log('🚚 Testing Delhivery Service with Updated Endpoints...\n');

    // Test 1: Serviceability
    console.log('📍 Test 1: Serviceability Check');
    try {
        const serviceability = await delhiveryService.checkServiceability('360002');
        console.log('✅ Serviceability Result:', JSON.stringify(serviceability, null, 2));
    } catch (error) {
        console.log('❌ Serviceability Error:', error.message);
    }
    console.log('');

    // Test 2: Delivery Rates
    console.log('💰 Test 2: Delivery Rates');
    try {
        const rates = await delhiveryService.getDeliveryRates({
            fromPincode: '110001',
            toPincode: '360002',
            weight: 1,
            codAmount: 1500
        });
        console.log('✅ Rates Result:', JSON.stringify(rates, null, 2));
    } catch (error) {
        console.log('❌ Rates Error:', error.message);
    }
    console.log('');

    // Test 3: Create Shipment
    console.log('📦 Test 3: Create Shipment');
    try {
        const shipment = await delhiveryService.createShipment({
            orderId: 'test123',
            orderNumber: 'TEST001',
            customerName: 'Test Customer',
            customerPhone: '9999999999',
            customerEmail: 'test@test.com',
            shippingAddress: {
                addressLine1: 'Test Address',
                addressLine2: 'Test Line 2',
                postalCode: '360002',
                city: 'Rajkot',
                state: 'Gujarat',
                country: 'India'
            },
            items: [{ name: 'Test Product', quantity: 1 }],
            codAmount: 1500,
            weight: 1
        });
        console.log('✅ Shipment Result:', JSON.stringify(shipment, null, 2));
    } catch (error) {
        console.log('❌ Shipment Error:', error.message);
    }
}

// Run the test
testDelhiveryService();

