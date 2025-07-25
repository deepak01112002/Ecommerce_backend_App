const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:8080/api';
let authToken = '';
let testUserId = '';
let testProductId = '';
let testOrderId = '';
let testInvoiceId = '';
let testSupplierId = '';
let testPOId = '';

// Test data
const testUser = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'testadmin@test.com',
    password: 'Test@123',
    phone: '9999999999',
    role: 'admin'
};

const testProduct = {
    name: 'Test Product for Complete System',
    description: 'Test product for complete system testing',
    price: 999,
    category: null, // Will be set dynamically
    sku: 'TEST-COMPLETE-001',
    stock: 100,
    hsnCode: '9999',
    gstRate: 18,
    taxCategory: 'taxable'
};

const testSupplier = {
    name: 'Test Supplier Ltd',
    type: 'distributor',
    contactInfo: {
        primaryContact: {
            name: 'John Doe',
            phone: '9876543210',
            email: 'john@testsupplier.com'
        },
        companyEmail: 'info@testsupplier.com'
    },
    addresses: [{
        type: 'billing',
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '123456',
        isDefault: true
    }],
    businessInfo: {
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F'
    }
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...(data && { data })
        };
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
}

// Test functions
async function testAuthentication() {
    console.log('\n🔐 Testing Authentication System'.cyan.bold);
    
    // Register user
    console.log('  📝 Registering test user...');
    const registerResult = await apiCall('POST', '/auth/register', testUser);
    
    if (registerResult.success) {
        console.log('  ✅ User registration successful'.green);
        testUserId = registerResult.data.data.user._id;
    } else {
        if (registerResult.error.includes('already exists')) {
            console.log('  ⚠️  User already exists, proceeding with login'.yellow);
        } else {
            console.log(`  ❌ User registration failed: ${registerResult.error}`.red);
            return false;
        }
    }
    
    // Login user
    console.log('  🔑 Logging in...');
    const loginResult = await apiCall('POST', '/auth/login', {
        email: testUser.email,
        password: testUser.password
    });
    
    if (loginResult.success) {
        console.log('  ✅ Login successful'.green);
        authToken = loginResult.data.data.token;
        if (!testUserId) {
            testUserId = loginResult.data.data.user._id;
        }
        return true;
    } else {
        console.log(`  ❌ Login failed: ${loginResult.error}`.red);
        return false;
    }
}

async function testProductManagement() {
    console.log('\n📦 Testing Product Management System'.cyan.bold);
    
    // Get categories first
    console.log('  📂 Getting categories...');
    const categoriesResult = await apiCall('GET', '/categories', null, authToken);
    
    if (categoriesResult.success && categoriesResult.data.data && categoriesResult.data.data.categories && categoriesResult.data.data.categories.length > 0) {
        testProduct.category = categoriesResult.data.data.categories[0]._id;
        console.log('  ✅ Categories retrieved'.green);
    } else {
        console.log('  ⚠️  No categories found, creating default category'.yellow);
        const createCategoryResult = await apiCall('POST', '/categories', {
            name: 'Test Category',
            description: 'Test category for system testing'
        }, authToken);
        
        if (createCategoryResult.success) {
            testProduct.category = createCategoryResult.data.data?.category?._id || createCategoryResult.data.data?._id;
            console.log('  ✅ Default category created'.green);
        } else {
            console.log(`  ❌ Category creation failed: ${createCategoryResult.error}`.red);
            return false;
        }
    }
    
    // Create product
    console.log('  ➕ Creating test product...');
    const createProductResult = await apiCall('POST', '/products', testProduct, authToken);
    
    if (createProductResult.success) {
        console.log('  ✅ Product created successfully'.green);
        testProductId = createProductResult.data.data.product._id;
        return true;
    } else {
        console.log(`  ❌ Product creation failed: ${createProductResult.error}`.red);
        return false;
    }
}

async function testOrderManagement() {
    console.log('\n🛒 Testing Order Management System'.cyan.bold);
    
    // Create order
    console.log('  ➕ Creating test order...');
    const orderData = {
        items: [{
            product: testProductId,
            quantity: 2,
            unitPrice: testProduct.price
        }],
        billingAddress: {
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '123456',
            country: 'India'
        },
        shippingAddress: {
            addressLine1: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '123456',
            country: 'India'
        },
        paymentInfo: {
            method: 'cod'
        }
    };
    
    const createOrderResult = await apiCall('POST', '/orders', orderData, authToken);
    
    if (createOrderResult.success) {
        console.log('  ✅ Order created successfully'.green);
        testOrderId = createOrderResult.data.data.order._id;
        return true;
    } else {
        console.log(`  ❌ Order creation failed: ${createOrderResult.error}`.red);
        return false;
    }
}

async function testInvoiceSystem() {
    console.log('\n🧾 Testing Invoice & Billing System'.cyan.bold);
    
    // Generate invoice from order
    console.log('  📄 Generating invoice from order...');
    const generateInvoiceResult = await apiCall('POST', `/invoices/generate/${testOrderId}`, {
        companyDetails: {
            name: 'Ghanshyam Murti Bhandar',
            address: 'Test Address, Test City',
            gstin: '29ABCDE1234F1Z5',
            phone: '+91-9999999999',
            email: 'info@ghanshyammurti.com'
        }
    }, authToken);
    
    if (generateInvoiceResult.success) {
        console.log('  ✅ Invoice generated successfully'.green);
        testInvoiceId = generateInvoiceResult.data.data.invoice._id;
        
        // Test invoice retrieval
        console.log('  📋 Retrieving invoice details...');
        const getInvoiceResult = await apiCall('GET', `/invoices/${testInvoiceId}`, null, authToken);
        
        if (getInvoiceResult.success) {
            console.log('  ✅ Invoice details retrieved'.green);
            return true;
        } else {
            console.log(`  ❌ Invoice retrieval failed: ${getInvoiceResult.error}`.red);
            return false;
        }
    } else {
        console.log(`  ❌ Invoice generation failed: ${generateInvoiceResult.error}`.red);
        return false;
    }
}

async function testGSTSystem() {
    console.log('\n💰 Testing GST & Tax Management System'.cyan.bold);
    
    // Get GST configuration
    console.log('  ⚙️  Getting GST configuration...');
    const getConfigResult = await apiCall('GET', '/gst/config', null, authToken);
    
    if (getConfigResult.success) {
        console.log('  ✅ GST configuration retrieved'.green);
    } else {
        console.log(`  ❌ GST configuration retrieval failed: ${getConfigResult.error}`.red);
        return false;
    }
    
    // Test GST calculation
    console.log('  🧮 Testing GST calculation...');
    const calculateGSTResult = await apiCall('POST', '/gst/calculate', {
        amount: 1000,
        gstRate: 18,
        fromState: 'Maharashtra',
        toState: 'Maharashtra'
    }, authToken);
    
    if (calculateGSTResult.success) {
        console.log('  ✅ GST calculation successful'.green);
        return true;
    } else {
        console.log(`  ❌ GST calculation failed: ${calculateGSTResult.error}`.red);
        return false;
    }
}

async function testSupplierManagement() {
    console.log('\n🏭 Testing Supplier Management System'.cyan.bold);
    
    // Create supplier
    console.log('  ➕ Creating test supplier...');
    const createSupplierResult = await apiCall('POST', '/suppliers', testSupplier, authToken);
    
    if (createSupplierResult.success) {
        console.log('  ✅ Supplier created successfully'.green);
        testSupplierId = createSupplierResult.data.data.supplier._id;
        
        // Approve supplier
        console.log('  ✅ Approving supplier...');
        const approveResult = await apiCall('PATCH', `/suppliers/${testSupplierId}/approve`, {}, authToken);
        
        if (approveResult.success) {
            console.log('  ✅ Supplier approved successfully'.green);
            return true;
        } else {
            console.log(`  ❌ Supplier approval failed: ${approveResult.error}`.red);
            return false;
        }
    } else {
        console.log(`  ❌ Supplier creation failed: ${createSupplierResult.error}`.red);
        return false;
    }
}

async function testPurchaseOrderSystem() {
    console.log('\n📋 Testing Purchase Order System'.cyan.bold);
    
    // Create purchase order
    console.log('  ➕ Creating test purchase order...');
    const poData = {
        supplier: testSupplierId,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{
            product: testProductId,
            productName: testProduct.name,
            quantity: 50,
            unitPrice: 500,
            gstRate: 18
        }],
        deliveryAddress: {
            street: '123 Warehouse Street',
            city: 'Test City',
            state: 'Test State',
            postalCode: '123456'
        },
        paymentInfo: {
            paymentTerms: 'credit',
            creditDays: 30
        }
    };
    
    const createPOResult = await apiCall('POST', '/purchase-orders', poData, authToken);
    
    if (createPOResult.success) {
        console.log('  ✅ Purchase order created successfully'.green);
        testPOId = createPOResult.data.data.purchaseOrder._id;
        
        // Approve purchase order
        console.log('  ✅ Approving purchase order...');
        const approvePOResult = await apiCall('PATCH', `/purchase-orders/${testPOId}/approve`, {}, authToken);
        
        if (approvePOResult.success) {
            console.log('  ✅ Purchase order approved successfully'.green);
            return true;
        } else {
            console.log(`  ❌ Purchase order approval failed: ${approvePOResult.error}`.red);
            return false;
        }
    } else {
        console.log(`  ❌ Purchase order creation failed: ${createPOResult.error}`.red);
        return false;
    }
}

async function testInventorySystem() {
    console.log('\n📦 Testing Inventory Management System'.cyan.bold);
    
    // Get inventory dashboard
    console.log('  📊 Getting inventory dashboard...');
    const dashboardResult = await apiCall('GET', '/inventory/dashboard', null, authToken);
    
    if (dashboardResult.success) {
        console.log('  ✅ Inventory dashboard retrieved'.green);
    } else {
        console.log(`  ❌ Inventory dashboard failed: ${dashboardResult.error}`.red);
        return false;
    }
    
    // Get all inventory
    console.log('  📋 Getting inventory list...');
    const inventoryResult = await apiCall('GET', '/inventory', null, authToken);
    
    if (inventoryResult.success) {
        console.log('  ✅ Inventory list retrieved'.green);
        return true;
    } else {
        console.log(`  ❌ Inventory list failed: ${inventoryResult.error}`.red);
        return false;
    }
}

async function testReportingSystem() {
    console.log('\n📈 Testing Advanced Reporting System'.cyan.bold);
    
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    // Test sales report
    console.log('  📊 Testing sales report...');
    const salesReportResult = await apiCall('GET', `/reports/sales?startDate=${startDate}&endDate=${endDate}`, null, authToken);
    
    if (salesReportResult.success) {
        console.log('  ✅ Sales report generated successfully'.green);
    } else {
        console.log(`  ❌ Sales report failed: ${salesReportResult.error}`.red);
        return false;
    }
    
    // Test inventory report
    console.log('  📦 Testing inventory report...');
    const inventoryReportResult = await apiCall('GET', '/reports/inventory', null, authToken);
    
    if (inventoryReportResult.success) {
        console.log('  ✅ Inventory report generated successfully'.green);
        return true;
    } else {
        console.log(`  ❌ Inventory report failed: ${inventoryReportResult.error}`.red);
        return false;
    }
}

async function testBillManagement() {
    console.log('\n💼 Testing Bill Management System'.cyan.bold);
    
    // Get bill dashboard
    console.log('  📊 Getting bill management dashboard...');
    const dashboardResult = await apiCall('GET', '/bill-management/dashboard', null, authToken);
    
    if (dashboardResult.success) {
        console.log('  ✅ Bill management dashboard retrieved'.green);
    } else {
        console.log(`  ❌ Bill management dashboard failed: ${dashboardResult.error}`.red);
        return false;
    }
    
    // Get all bills
    console.log('  📋 Getting bills list...');
    const billsResult = await apiCall('GET', '/bill-management/bills', null, authToken);
    
    if (billsResult.success) {
        console.log('  ✅ Bills list retrieved'.green);
        return true;
    } else {
        console.log(`  ❌ Bills list failed: ${billsResult.error}`.red);
        return false;
    }
}

// Main test function
async function runCompleteSystemTest() {
    console.log('🚀 Starting Complete Ecommerce System Test'.rainbow.bold);
    console.log('=' .repeat(60).gray);
    
    const testResults = {
        authentication: false,
        productManagement: false,
        orderManagement: false,
        invoiceSystem: false,
        gstSystem: false,
        supplierManagement: false,
        purchaseOrderSystem: false,
        inventorySystem: false,
        reportingSystem: false,
        billManagement: false
    };
    
    try {
        // Run all tests
        testResults.authentication = await testAuthentication();
        if (testResults.authentication) {
            testResults.productManagement = await testProductManagement();
            if (testResults.productManagement) {
                testResults.orderManagement = await testOrderManagement();
                if (testResults.orderManagement) {
                    testResults.invoiceSystem = await testInvoiceSystem();
                }
            }
            testResults.gstSystem = await testGSTSystem();
            testResults.supplierManagement = await testSupplierManagement();
            if (testResults.supplierManagement) {
                testResults.purchaseOrderSystem = await testPurchaseOrderSystem();
            }
            testResults.inventorySystem = await testInventorySystem();
            testResults.reportingSystem = await testReportingSystem();
            testResults.billManagement = await testBillManagement();
        }
        
        // Print results
        console.log('\n📊 COMPLETE SYSTEM TEST RESULTS'.rainbow.bold);
        console.log('=' .repeat(60).gray);
        
        const passedTests = Object.values(testResults).filter(result => result).length;
        const totalTests = Object.keys(testResults).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        Object.entries(testResults).forEach(([testName, result]) => {
            const status = result ? '✅ PASS'.green : '❌ FAIL'.red;
            const formattedName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`  ${formattedName.padEnd(25)} ${status}`);
        });
        
        console.log('\n📈 SUMMARY'.cyan.bold);
        console.log(`  Total Tests: ${totalTests}`);
        console.log(`  Passed: ${passedTests.toString().green}`);
        console.log(`  Failed: ${(totalTests - passedTests).toString().red}`);
        console.log(`  Success Rate: ${successRate}%`.yellow.bold);
        
        if (successRate >= 80) {
            console.log('\n🎉 SYSTEM IS PRODUCTION READY! 🎉'.green.bold);
        } else if (successRate >= 60) {
            console.log('\n⚠️  SYSTEM NEEDS MINOR FIXES'.yellow.bold);
        } else {
            console.log('\n❌ SYSTEM NEEDS MAJOR FIXES'.red.bold);
        }
        
    } catch (error) {
        console.log(`\n💥 Test execution failed: ${error.message}`.red.bold);
    }
}

// Run the test
if (require.main === module) {
    runCompleteSystemTest();
}

module.exports = { runCompleteSystemTest };
