require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const colors = require('colors');

class ImageSearchAPITester {
    constructor() {
        this.baseURL = process.env.API_BASE_URL || 'http://localhost:8080';
        this.apiURL = `${this.baseURL}/api/image-search`;
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    async runAllTests() {
        console.log('🧪 Starting Image Search API Tests'.cyan.bold);
        console.log(`Base URL: ${this.baseURL}`.gray);
        console.log('='.repeat(60).cyan);

        try {
            // Test 1: Health Check
            await this.testHealthCheck();

            // Test 2: API Statistics
            await this.testGetStats();

            // Test 3: Demo Endpoint
            await this.testDemoEndpoint();

            // Test 4: Create Test Images
            await this.createTestImages();

            // Test 5: Test Image Search with File Upload
            await this.testImageSearchWithFile();

            // Test 6: Test Image Search with URL
            await this.testImageSearchWithURL();

            // Test 7: Test Image Search with Base64
            await this.testImageSearchWithBase64();

            // Test 8: Test Search Parameters
            await this.testSearchParameters();

            // Test 9: Test Error Handling
            await this.testErrorHandling();

            // Test 10: Performance Test
            await this.testPerformance();

            this.printSummary();

        } catch (error) {
            console.error('❌ Fatal error during testing:'.red, error.message);
        }
    }

    async testHealthCheck() {
        await this.runTest('Health Check', async () => {
            const response = await axios.get(`${this.apiURL}/health`);
            
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            if (!response.data.success) {
                throw new Error('Health check returned success: false');
            }

            return 'Health check passed';
        });
    }

    async testGetStats() {
        await this.runTest('Get Statistics (without auth)', async () => {
            try {
                const response = await axios.get(`${this.apiURL}/stats`);
                throw new Error('Expected 401 unauthorized, but request succeeded');
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    return 'Correctly returned 401 unauthorized';
                }
                throw error;
            }
        });
    }

    async testDemoEndpoint() {
        await this.runTest('Demo Endpoint', async () => {
            const response = await axios.post(`${this.apiURL}/demo`);
            
            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            if (!response.data.success) {
                throw new Error('Demo endpoint returned success: false');
            }

            if (!response.data.data.steps || !Array.isArray(response.data.data.steps)) {
                throw new Error('Demo endpoint should return steps array');
            }

            return 'Demo endpoint working correctly';
        });
    }

    async createTestImages() {
        await this.runTest('Create Test Images', async () => {
            const testDir = path.join(__dirname, 'test_images');
            
            // Create test directory if it doesn't exist
            if (!fs.existsSync(testDir)) {
                fs.mkdirSync(testDir, { recursive: true });
            }

            // Create different test images
            const images = [
                { name: 'red_square.jpg', color: [255, 0, 0], size: 200 },
                { name: 'blue_circle.png', color: [0, 0, 255], size: 150 },
                { name: 'green_triangle.webp', color: [0, 255, 0], size: 180 }
            ];

            for (const img of images) {
                const imagePath = path.join(testDir, img.name);
                
                if (!fs.existsSync(imagePath)) {
                    // Create a simple colored square
                    await sharp({
                        create: {
                            width: img.size,
                            height: img.size,
                            channels: 3,
                            background: { r: img.color[0], g: img.color[1], b: img.color[2] }
                        }
                    })
                    .jpeg() // Convert all to JPEG for consistency
                    .toFile(imagePath.replace(/\.(png|webp)$/, '.jpg'));
                }
            }

            return `Created ${images.length} test images`;
        });
    }

    async testImageSearchWithFile() {
        await this.runTest('Image Search with File Upload', async () => {
            const testImagePath = path.join(__dirname, 'test_images', 'red_square.jpg');
            
            if (!fs.existsSync(testImagePath)) {
                throw new Error('Test image not found');
            }

            const formData = new FormData();
            formData.append('image', fs.createReadStream(testImagePath));

            const response = await axios.post(`${this.apiURL}/search`, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                params: {
                    threshold: 50,
                    limit: 10
                }
            });

            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            if (!response.data.success) {
                throw new Error('Search returned success: false');
            }

            if (!response.data.data.searchInfo) {
                throw new Error('Response should include searchInfo');
            }

            return `Search completed. Found ${response.data.data.results.length} results`;
        });
    }

    async testImageSearchWithURL() {
        await this.runTest('Image Search with URL', async () => {
            // Use a sample image URL (you can replace with your own)
            const imageUrl = 'https://via.placeholder.com/300x300/ff0000/ffffff?text=Test';

            const response = await axios.post(`${this.apiURL}/search`, {
                imageUrl: imageUrl
            }, {
                params: {
                    threshold: 40,
                    limit: 5
                }
            });

            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            if (!response.data.success) {
                throw new Error('Search returned success: false');
            }

            return `URL search completed. Found ${response.data.data.results.length} results`;
        });
    }

    async testImageSearchWithBase64() {
        await this.runTest('Image Search with Base64', async () => {
            const testImagePath = path.join(__dirname, 'test_images', 'blue_circle.jpg');
            
            if (!fs.existsSync(testImagePath)) {
                // Create a simple blue image if it doesn't exist
                await sharp({
                    create: {
                        width: 100,
                        height: 100,
                        channels: 3,
                        background: { r: 0, g: 0, b: 255 }
                    }
                })
                .jpeg()
                .toFile(testImagePath);
            }

            const imageBuffer = fs.readFileSync(testImagePath);
            const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

            const response = await axios.post(`${this.apiURL}/search`, {
                imageBase64: base64Image
            }, {
                params: {
                    threshold: 30,
                    limit: 15
                }
            });

            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            if (!response.data.success) {
                throw new Error('Search returned success: false');
            }

            return `Base64 search completed. Found ${response.data.data.results.length} results`;
        });
    }

    async testSearchParameters() {
        await this.runTest('Search Parameters Validation', async () => {
            const testImagePath = path.join(__dirname, 'test_images', 'red_square.jpg');
            const formData = new FormData();
            formData.append('image', fs.createReadStream(testImagePath));

            // Test with various parameters
            const response = await axios.post(`${this.apiURL}/search`, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                params: {
                    threshold: 75,
                    limit: 5,
                    minPrice: 10,
                    maxPrice: 1000,
                    includeInactive: false
                }
            });

            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            const searchInfo = response.data.data.searchInfo;
            if (searchInfo.threshold !== 75) {
                throw new Error('Threshold parameter not applied correctly');
            }

            return 'Search parameters working correctly';
        });
    }

    async testErrorHandling() {
        await this.runTest('Error Handling', async () => {
            const errors = [];

            // Test 1: No image provided
            try {
                await axios.post(`${this.apiURL}/search`, {});
                errors.push('Should have failed with no image');
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    // Expected error
                } else {
                    errors.push(`Unexpected error: ${error.message}`);
                }
            }

            // Test 2: Invalid threshold
            try {
                const formData = new FormData();
                formData.append('image', Buffer.from('fake image'), 'test.jpg');
                
                await axios.post(`${this.apiURL}/search`, formData, {
                    headers: { ...formData.getHeaders() },
                    params: { threshold: 150 } // Invalid threshold > 100
                });
                errors.push('Should have failed with invalid threshold');
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    // Expected error
                } else {
                    errors.push(`Unexpected error: ${error.message}`);
                }
            }

            // Test 3: Invalid image URL
            try {
                await axios.post(`${this.apiURL}/search`, {
                    imageUrl: 'not-a-valid-url'
                });
                errors.push('Should have failed with invalid URL');
            } catch (error) {
                if (error.response && error.response.status === 400) {
                    // Expected error
                } else {
                    errors.push(`Unexpected error: ${error.message}`);
                }
            }

            if (errors.length > 0) {
                throw new Error(`Error handling issues: ${errors.join(', ')}`);
            }

            return 'Error handling working correctly';
        });
    }

    async testPerformance() {
        await this.runTest('Performance Test', async () => {
            const testImagePath = path.join(__dirname, 'test_images', 'red_square.jpg');
            const startTime = Date.now();

            const formData = new FormData();
            formData.append('image', fs.createReadStream(testImagePath));

            const response = await axios.post(`${this.apiURL}/search`, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                params: {
                    threshold: 60,
                    limit: 20
                }
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            if (response.status !== 200) {
                throw new Error(`Expected status 200, got ${response.status}`);
            }

            // Performance should be reasonable (under 10 seconds for most cases)
            if (duration > 10000) {
                console.warn(`⚠️  Search took ${duration}ms, which might be slow`.yellow);
            }

            return `Performance test completed in ${duration}ms`;
        });
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        
        try {
            console.log(`🧪 Running: ${testName}`.cyan);
            const result = await testFunction();
            console.log(`✅ ${testName}: ${result}`.green);
            
            this.testResults.passed++;
            this.testResults.details.push({
                name: testName,
                status: 'PASSED',
                message: result
            });
            
        } catch (error) {
            console.log(`❌ ${testName}: ${error.message}`.red);
            
            this.testResults.failed++;
            this.testResults.details.push({
                name: testName,
                status: 'FAILED',
                message: error.message
            });
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(60).cyan);
        console.log('📊 TEST SUMMARY'.cyan.bold);
        console.log('='.repeat(60).cyan);
        console.log(`Total Tests: ${this.testResults.total}`.blue);
        console.log(`Passed: ${this.testResults.passed}`.green);
        console.log(`Failed: ${this.testResults.failed}`.red);
        console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`.yellow);
        console.log('='.repeat(60).cyan);

        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:'.red.bold);
            this.testResults.details
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.message}`.red);
                });
        }

        if (this.testResults.passed === this.testResults.total) {
            console.log('\n🎉 All tests passed! Your Image Search API is working correctly!'.green.bold);
        } else {
            console.log('\n⚠️  Some tests failed. Please check the implementation.'.yellow);
        }

        // Cleanup test images
        this.cleanupTestImages();
    }

    cleanupTestImages() {
        try {
            const testDir = path.join(__dirname, 'test_images');
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
                console.log('\n🧹 Cleaned up test images'.gray);
            }
        } catch (error) {
            console.log(`⚠️  Could not cleanup test images: ${error.message}`.yellow);
        }
    }
}

// CLI interface
async function main() {
    const tester = new ImageSearchAPITester();
    
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log('📖 Image Search API Tester'.cyan.bold);
        console.log('Usage: node testImageSearchAPI.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --help, -h    Show this help message');
        console.log('');
        console.log('Environment Variables:');
        console.log('  API_BASE_URL  Base URL for the API (default: http://localhost:8080)');
        return;
    }

    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:'.red, error.message);
        process.exit(1);
    });
}

module.exports = ImageSearchAPITester;
