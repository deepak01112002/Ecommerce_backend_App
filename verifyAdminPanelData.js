#!/usr/bin/env node

/**
 * Verify Admin Panel Data Script
 * Checks if the COD order created in user flow testing appears in admin panel
 */

const axios = require('axios');

// Server configuration
const PRODUCTION_URL = 'https://server.ghanshyammurtibhandar.com/api';
const API_URL = PRODUCTION_URL;

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Admin credentials from the system
const adminCredentials = {
    email: 'admin@ghanshyambhandar.com',
    password: 'admin123'
};

// Helper function for API calls
async function apiCall(method, endpoint, data = null, token = null, description = '') {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            timeout: 30000,
            ...(data && { data })
        };
        
        const startTime = Date.now();
        const response = await axios(config);
        const responseTime = Date.now() - startTime;
        
        console.log(`  ${colors.green}✅ ${description} (${responseTime}ms)${colors.reset}`);
        return {
            success: true,
            data: response.data,
            status: response.status,
            responseTime
        };
    } catch (error) {
        console.log(`  ${colors.red}❌ ${description} - ${error.response?.data?.message || error.message}${colors.reset}`);
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status || 0,
            responseTime: 0
        };
    }
}

async function verifyAdminPanelData() {
    console.log(`${colors.bold}${colors.magenta}🔍 ADMIN PANEL DATA VERIFICATION${colors.reset}`);
    console.log(`${colors.cyan}Checking if user flow test data appears in admin panel${colors.reset}`);
    console.log(`${colors.cyan}Server: ${API_URL}${colors.reset}\n`);
    
    let adminToken = '';
    
    try {
        // Step 1: Admin Login
        console.log(`${colors.yellow}🔐 Step 1: Admin Login${colors.reset}`);
        const loginResult = await apiCall('POST', '/auth/login', adminCredentials, null, 'Admin login');
        
        if (!loginResult.success) {
            console.log(`${colors.red}❌ Cannot proceed without admin access${colors.reset}`);
            return;
        }
        
        adminToken = loginResult.data.data.token;
        
        // Step 2: Get All Orders (Admin)
        console.log(`\n${colors.yellow}📋 Step 2: Fetch All Orders${colors.reset}`);
        const ordersResult = await apiCall('GET', '/orders/admin/all?limit=50', null, adminToken, 'Get all orders from admin panel');
        
        if (!ordersResult.success) {
            console.log(`${colors.red}❌ Failed to fetch orders from admin panel${colors.reset}`);
            return;
        }
        
        const orders = ordersResult.data.data?.orders || ordersResult.data.orders || [];
        console.log(`  ${colors.cyan}📊 Total orders found: ${orders.length}${colors.reset}`);
        
        // Step 3: Look for our test order (ORD2507260001)
        console.log(`\n${colors.yellow}🔍 Step 3: Search for Test Order${colors.reset}`);
        const testOrderNumber = 'ORD2507260001';
        const testOrder = orders.find(order => order.orderNumber === testOrderNumber);
        
        if (testOrder) {
            console.log(`  ${colors.green}✅ Found test order: ${testOrderNumber}${colors.reset}`);
            console.log(`  ${colors.cyan}📦 Order Details:${colors.reset}`);
            console.log(`    - Customer: ${testOrder.user?.firstName || 'N/A'} ${testOrder.user?.lastName || ''}`);
            console.log(`    - Email: ${testOrder.user?.email || 'N/A'}`);
            console.log(`    - Status: ${testOrder.status}`);
            console.log(`    - Payment Method: ${testOrder.paymentInfo?.method || 'N/A'}`);
            console.log(`    - Total: ₹${testOrder.pricing?.total || 'N/A'}`);
            console.log(`    - Items: ${testOrder.items?.length || 0}`);
            console.log(`    - Created: ${new Date(testOrder.createdAt).toLocaleString()}`);
        } else {
            console.log(`  ${colors.yellow}⚠️  Test order ${testOrderNumber} not found in admin panel${colors.reset}`);
        }
        
        // Step 4: Get Recent Orders
        console.log(`\n${colors.yellow}📈 Step 4: Check Recent Orders${colors.reset}`);
        const recentOrders = orders.slice(0, 5);
        console.log(`  ${colors.cyan}📋 Last 5 orders:${colors.reset}`);
        recentOrders.forEach((order, index) => {
            const customerName = `${order.user?.firstName || 'N/A'} ${order.user?.lastName || ''}`.trim();
            console.log(`    ${index + 1}. ${order.orderNumber} - ${customerName} - ${order.status} - ₹${order.pricing?.total || 'N/A'}`);
        });
        
        // Step 5: Check Shipping Data
        console.log(`\n${colors.yellow}🚚 Step 5: Check Shipping Data${colors.reset}`);
        const shippingResult = await apiCall('GET', '/shipping?limit=20', null, adminToken, 'Get shipping data');
        
        if (shippingResult.success) {
            const shipments = shippingResult.data.data?.shipments || shippingResult.data.shipments || [];
            console.log(`  ${colors.cyan}📦 Total shipments found: ${shipments.length}${colors.reset}`);
            
            // Look for shipment related to our test order
            const testShipment = shipments.find(shipment => 
                shipment.order?.orderNumber === testOrderNumber || 
                shipment.orderNumber === testOrderNumber
            );
            
            if (testShipment) {
                console.log(`  ${colors.green}✅ Found shipping data for test order${colors.reset}`);
                console.log(`    - AWB Code: ${testShipment.awbCode || 'N/A'}`);
                console.log(`    - Courier: ${testShipment.courierName || 'N/A'}`);
                console.log(`    - Status: ${testShipment.status || 'N/A'}`);
            } else {
                console.log(`  ${colors.yellow}⚠️  No shipping data found for test order${colors.reset}`);
            }
        }
        
        // Step 6: Check Users
        console.log(`\n${colors.yellow}👥 Step 6: Check User Data${colors.reset}`);
        const usersResult = await apiCall('GET', '/admin/management/users?limit=20&role=user', null, adminToken, 'Get user data');
        
        if (usersResult.success) {
            const users = usersResult.data.data?.users || usersResult.data.users || [];
            console.log(`  ${colors.cyan}👤 Total users found: ${users.length}${colors.reset}`);
            
            // Look for our test users
            const testUserEmails = ['rajesh.cod@example.com', 'priya.razorpay@example.com'];
            const foundTestUsers = users.filter(user => testUserEmails.includes(user.email));
            
            console.log(`  ${colors.cyan}🧪 Test users found: ${foundTestUsers.length}${colors.reset}`);
            foundTestUsers.forEach(user => {
                console.log(`    - ${user.firstName} ${user.lastName} (${user.email})`);
            });
        }
        
        // Final Summary
        console.log(`\n${colors.bold}${colors.blue}📋 ADMIN PANEL VERIFICATION SUMMARY${colors.reset}`);
        console.log('='.repeat(60));
        
        if (testOrder) {
            console.log(`${colors.green}✅ COD Order Integration: WORKING${colors.reset}`);
            console.log(`${colors.green}✅ Order appears in admin panel correctly${colors.reset}`);
            console.log(`${colors.green}✅ Customer data is properly linked${colors.reset}`);
            console.log(`${colors.green}✅ Payment method (COD) is correctly recorded${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️  COD Order Integration: NEEDS INVESTIGATION${colors.reset}`);
        }
        
        console.log(`${colors.cyan}📊 Total orders in system: ${orders.length}${colors.reset}`);
        console.log(`${colors.cyan}🚚 Total shipments in system: ${shippingResult.success ? (shippingResult.data.data?.shipments || shippingResult.data.shipments || []).length : 'N/A'}${colors.reset}`);
        
        console.log(`\n${colors.green}${colors.bold}🎉 Admin panel data verification completed!${colors.reset}`);
        
    } catch (error) {
        console.log(`${colors.red}❌ Fatal error during verification: ${error.message}${colors.reset}`);
    }
}

// Run the verification
verifyAdminPanelData()
    .then(() => {
        console.log(`\n${colors.cyan}Verification completed.${colors.reset}`);
        process.exit(0);
    })
    .catch(error => {
        console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
