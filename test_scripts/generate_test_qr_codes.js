const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

// Test data
const testProductId = '688bbdec362503685d9225b2';
const testCategoryId = '68845d5a10cebc7513135c10';

const productQRData = {
    type: 'product',
    id: testProductId
};

const categoryQRData = {
    type: 'category', 
    id: testCategoryId
};

async function generateTestQRCodes() {
    console.log('🔧 Generating Test QR Codes for Camera Scanning'.cyan.bold);
    console.log('=' .repeat(60).gray);

    try {
        // Create output directory
        const outputDir = path.join(__dirname, '../test_qr_codes');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate Product QR Code
        console.log('\n📦 Generating Product QR Code...'.yellow);
        const productQRString = JSON.stringify(productQRData);
        console.log(`📝 Product QR Data: ${productQRString}`.gray);
        
        const productQRPath = path.join(outputDir, 'product_qr_code.png');
        await QRCode.toFile(productQRPath, productQRString, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        console.log(`✅ Product QR Code saved: ${productQRPath}`.green);

        // Generate Category QR Code
        console.log('\n📁 Generating Category QR Code...'.yellow);
        const categoryQRString = JSON.stringify(categoryQRData);
        console.log(`📝 Category QR Data: ${categoryQRString}`.gray);
        
        const categoryQRPath = path.join(outputDir, 'category_qr_code.png');
        await QRCode.toFile(categoryQRPath, categoryQRString, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        console.log(`✅ Category QR Code saved: ${categoryQRPath}`.green);

        // Generate QR codes as data URLs for testing
        console.log('\n🔗 Generating Data URLs for Testing...'.yellow);
        
        const productDataURL = await QRCode.toDataURL(productQRString, {
            width: 300,
            margin: 2
        });
        console.log(`📱 Product QR Data URL: ${productDataURL.substring(0, 50)}...`.gray);

        const categoryDataURL = await QRCode.toDataURL(categoryQRString, {
            width: 300,
            margin: 2
        });
        console.log(`📱 Category QR Data URL: ${categoryDataURL.substring(0, 50)}...`.gray);

        // Create HTML test page with QR codes
        console.log('\n📄 Creating HTML Test Page...'.yellow);
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test QR Codes - Ghanshyam Murti Bhandar</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .qr-container {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .qr-code {
            max-width: 300px;
            height: auto;
            margin: 20px 0;
        }
        .qr-data {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 10px 0;
        }
        .instructions {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        h1 { color: #333; text-align: center; }
        h2 { color: #666; }
        .scanner-link {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px;
        }
        .scanner-link:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>🔍 Test QR Codes for Scanning</h1>
    
    <div class="instructions">
        <h3>📱 How to Test:</h3>
        <ol>
            <li>Open your phone's camera app</li>
            <li>Point camera at QR code below</li>
            <li>Copy the JSON data that appears</li>
            <li>Go to the QR scanner page</li>
            <li>Paste the data and click "Scan QR Code"</li>
        </ol>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:8080/api/qr-codes/scanner" class="scanner-link" target="_blank">
                🔍 Open QR Scanner (Public)
            </a>
            <a href="http://localhost:3000" class="scanner-link" target="_blank">
                🔧 Open Admin Panel
            </a>
        </div>
    </div>

    <div class="qr-container">
        <h2>📦 Product QR Code</h2>
        <p><strong>Product:</strong> Ganesh Murti (ID: ${testProductId})</p>
        <img src="data:image/png;base64,${productDataURL.split(',')[1]}" alt="Product QR Code" class="qr-code">
        <div class="qr-data">
            <strong>QR Data:</strong><br>
            ${productQRString}
        </div>
        <p><em>Scan this with your phone camera to get product details</em></p>
    </div>

    <div class="qr-container">
        <h2>📁 Category QR Code</h2>
        <p><strong>Category:</strong> Metal (ID: ${testCategoryId})</p>
        <img src="data:image/png;base64,${categoryDataURL.split(',')[1]}" alt="Category QR Code" class="qr-code">
        <div class="qr-data">
            <strong>QR Data:</strong><br>
            ${categoryQRString}
        </div>
        <p><em>Scan this with your phone camera to get category details</em></p>
    </div>

    <div class="instructions">
        <h3>🎯 Expected Results:</h3>
        <ul>
            <li><strong>Public Scanner:</strong> Customer-friendly product/category information</li>
            <li><strong>Admin Panel:</strong> Comprehensive analytics and management data</li>
        </ul>
    </div>
</body>
</html>`;

        const htmlPath = path.join(outputDir, 'test_qr_codes.html');
        fs.writeFileSync(htmlPath, htmlContent);
        console.log(`✅ HTML test page saved: ${htmlPath}`.green);

        console.log('\n🎉 QR Code Generation Complete!'.green.bold);
        console.log('=' .repeat(60).gray);
        
        console.log('\n📋 Generated Files:'.cyan.bold);
        console.log(`📦 Product QR Code: ${productQRPath}`.white);
        console.log(`📁 Category QR Code: ${categoryQRPath}`.white);
        console.log(`📄 HTML Test Page: ${htmlPath}`.white);

        console.log('\n🔍 Testing Instructions:'.cyan.bold);
        console.log('1. Open the HTML file in your browser'.white);
        console.log('2. Use your phone camera to scan the QR codes'.white);
        console.log('3. Copy the JSON data from your phone'.white);
        console.log('4. Go to http://localhost:8080/api/qr-codes/scanner'.white);
        console.log('5. Paste the data and test scanning'.white);

        console.log('\n📱 QR Data Examples:'.cyan.bold);
        console.log(`Product: ${productQRString}`.yellow);
        console.log(`Category: ${categoryQRString}`.yellow);

    } catch (error) {
        console.error('❌ Error generating QR codes:'.red.bold, error.message);
    }
}

// Run the generator
generateTestQRCodes();
