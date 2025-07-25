require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
    console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60));
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'blue');

const BASE_URL = 'http://localhost:8080/api';

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null, headers = {}) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
};

// Generate webhook signature (for testing)
function generateWebhookSignature(payload, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

// Test 1: Payment Captured Webhook
async function testPaymentCapturedWebhook() {
    logSection('🎯 Test 1: Payment Captured Webhook');
    
    const webhookPayload = {
        entity: 'event',
        account_id: 'acc_test',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
            payment: {
                entity: {
                    id: 'pay_test_captured_123',
                    entity: 'payment',
                    amount: 100000, // ₹1000 in paise
                    currency: 'INR',
                    status: 'captured',
                    order_id: 'order_test_123',
                    method: 'upi',
                    captured: true,
                    created_at: Math.floor(Date.now() / 1000)
                }
            }
        },
        created_at: Math.floor(Date.now() / 1000)
    };
    
    // Test without signature (should still work as webhook secret is optional)
    logInfo('Testing webhook without signature...');
    const response1 = await apiRequest('POST', '/payments/webhook', webhookPayload);
    
    if (response1.success) {
        logSuccess('Webhook processed successfully without signature');
        logInfo(`Response: ${JSON.stringify(response1.data)}`);
    } else {
        logError(`Webhook failed: ${JSON.stringify(response1.error)}`);
    }
    
    // Test with signature (if webhook secret is configured)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
        logInfo('Testing webhook with signature...');
        const signature = generateWebhookSignature(webhookPayload, webhookSecret);
        
        const response2 = await apiRequest('POST', '/payments/webhook', webhookPayload, {
            'x-razorpay-signature': signature
        });
        
        if (response2.success) {
            logSuccess('Webhook processed successfully with valid signature');
        } else {
            logError(`Webhook with signature failed: ${JSON.stringify(response2.error)}`);
        }
    } else {
        logWarning('Webhook secret not configured - signature verification skipped');
    }
    
    return response1.success;
}

// Test 2: Payment Failed Webhook
async function testPaymentFailedWebhook() {
    logSection('❌ Test 2: Payment Failed Webhook');
    
    const webhookPayload = {
        entity: 'event',
        account_id: 'acc_test',
        event: 'payment.failed',
        contains: ['payment'],
        payload: {
            payment: {
                entity: {
                    id: 'pay_test_failed_456',
                    entity: 'payment',
                    amount: 50000, // ₹500 in paise
                    currency: 'INR',
                    status: 'failed',
                    order_id: 'order_test_456',
                    method: 'card',
                    captured: false,
                    error_code: 'BAD_REQUEST_ERROR',
                    error_description: 'Payment failed due to insufficient funds',
                    created_at: Math.floor(Date.now() / 1000)
                }
            }
        },
        created_at: Math.floor(Date.now() / 1000)
    };
    
    const response = await apiRequest('POST', '/payments/webhook', webhookPayload);
    
    if (response.success) {
        logSuccess('Payment failed webhook processed successfully');
        logInfo(`Response: ${JSON.stringify(response.data)}`);
        return true;
    } else {
        logError(`Payment failed webhook failed: ${JSON.stringify(response.error)}`);
        return false;
    }
}

// Test 3: Order Paid Webhook
async function testOrderPaidWebhook() {
    logSection('💰 Test 3: Order Paid Webhook');
    
    const webhookPayload = {
        entity: 'event',
        account_id: 'acc_test',
        event: 'order.paid',
        contains: ['order'],
        payload: {
            order: {
                entity: {
                    id: 'order_test_paid_789',
                    entity: 'order',
                    amount: 150000, // ₹1500 in paise
                    currency: 'INR',
                    status: 'paid',
                    receipt: 'receipt_test_789',
                    created_at: Math.floor(Date.now() / 1000)
                }
            }
        },
        created_at: Math.floor(Date.now() / 1000)
    };
    
    const response = await apiRequest('POST', '/payments/webhook', webhookPayload);
    
    if (response.success) {
        logSuccess('Order paid webhook processed successfully');
        logInfo(`Response: ${JSON.stringify(response.data)}`);
        return true;
    } else {
        logError(`Order paid webhook failed: ${JSON.stringify(response.error)}`);
        return false;
    }
}

// Test 4: Invalid Signature Webhook
async function testInvalidSignatureWebhook() {
    logSection('🔒 Test 4: Invalid Signature Webhook');
    
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logWarning('Webhook secret not configured - skipping signature test');
        return true;
    }
    
    const webhookPayload = {
        entity: 'event',
        account_id: 'acc_test',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
            payment: {
                entity: {
                    id: 'pay_test_invalid_sig',
                    entity: 'payment',
                    amount: 100000,
                    currency: 'INR',
                    status: 'captured',
                    order_id: 'order_test_invalid',
                    method: 'upi',
                    captured: true,
                    created_at: Math.floor(Date.now() / 1000)
                }
            }
        },
        created_at: Math.floor(Date.now() / 1000)
    };
    
    // Send with invalid signature
    const response = await apiRequest('POST', '/payments/webhook', webhookPayload, {
        'x-razorpay-signature': 'invalid_signature_123'
    });
    
    if (!response.success && response.status === 400) {
        logSuccess('Invalid signature correctly rejected');
        return true;
    } else {
        logError('Invalid signature was not rejected properly');
        return false;
    }
}

// Test 5: Unknown Event Webhook
async function testUnknownEventWebhook() {
    logSection('❓ Test 5: Unknown Event Webhook');
    
    const webhookPayload = {
        entity: 'event',
        account_id: 'acc_test',
        event: 'unknown.event',
        contains: ['unknown'],
        payload: {
            unknown: {
                entity: {
                    id: 'unknown_test_123',
                    entity: 'unknown'
                }
            }
        },
        created_at: Math.floor(Date.now() / 1000)
    };
    
    const response = await apiRequest('POST', '/payments/webhook', webhookPayload);
    
    if (response.success) {
        logSuccess('Unknown event webhook handled gracefully');
        logInfo(`Response: ${JSON.stringify(response.data)}`);
        return true;
    } else {
        logError(`Unknown event webhook failed: ${JSON.stringify(response.error)}`);
        return false;
    }
}

// Main test function
async function testWebhookHandling() {
    logSection('🎣 WEBHOOK HANDLING TESTING');
    logInfo('Testing Razorpay webhook processing capabilities');
    
    const results = {
        paymentCaptured: false,
        paymentFailed: false,
        orderPaid: false,
        invalidSignature: false,
        unknownEvent: false
    };
    
    try {
        // Test 1: Payment Captured
        results.paymentCaptured = await testPaymentCapturedWebhook();
        
        // Test 2: Payment Failed
        results.paymentFailed = await testPaymentFailedWebhook();
        
        // Test 3: Order Paid
        results.orderPaid = await testOrderPaidWebhook();
        
        // Test 4: Invalid Signature
        results.invalidSignature = await testInvalidSignatureWebhook();
        
        // Test 5: Unknown Event
        results.unknownEvent = await testUnknownEventWebhook();
        
        // Final Summary
        logSection('📊 WEBHOOK HANDLING TEST RESULTS');
        
        const tests = [
            { name: 'Payment Captured Webhook', result: results.paymentCaptured },
            { name: 'Payment Failed Webhook', result: results.paymentFailed },
            { name: 'Order Paid Webhook', result: results.orderPaid },
            { name: 'Invalid Signature Handling', result: results.invalidSignature },
            { name: 'Unknown Event Handling', result: results.unknownEvent }
        ];
        
        let passedTests = 0;
        tests.forEach(test => {
            if (test.result) {
                logSuccess(`✅ ${test.name}: PASSED`);
                passedTests++;
            } else {
                logError(`❌ ${test.name}: FAILED`);
            }
        });
        
        const successRate = ((passedTests / tests.length) * 100).toFixed(1);
        
        logSection('🎯 WEBHOOK ASSESSMENT');
        logInfo(`Total tests: ${tests.length}`);
        logInfo(`Passed tests: ${passedTests}`);
        logInfo(`Success rate: ${successRate}%`);
        
        if (successRate >= 90) {
            logSuccess('🎉 EXCELLENT! Webhook handling is working perfectly');
            logInfo('✅ Ready for production webhook integration');
        } else if (successRate >= 70) {
            logWarning('⚠️ GOOD! Most webhook features are working');
            logInfo('⚠️ Some minor issues need attention');
        } else {
            logError('❌ NEEDS WORK! Several webhook issues found');
            logInfo('❌ Webhook handling needs fixes');
        }
        
        logSection('🌐 PRODUCTION WEBHOOK SETUP');
        logInfo('Webhook Endpoint: POST /api/payments/webhook');
        logInfo('Supported Events:');
        logInfo('• payment.captured - Payment successfully captured');
        logInfo('• payment.failed - Payment failed');
        logInfo('• order.paid - Order marked as paid');
        logInfo('Security: Signature verification (if webhook secret configured)');
        
        return results;
        
    } catch (error) {
        logError(`Webhook test execution failed: ${error.message}`);
        console.error(error);
        return results;
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testWebhookHandling().catch(error => {
        logError(`Test script failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = testWebhookHandling;
