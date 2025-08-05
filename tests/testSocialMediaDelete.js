require('dotenv').config();

async function testSocialMediaDelete() {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🗑️  TESTING SOCIAL MEDIA DELETE FUNCTIONALITY');
    console.log('==============================================');
    console.log('Testing the delete API to identify any issues');
    console.log('==============================================\n');

    let adminToken = null;

    // Get admin token
    console.log('1. Getting admin token...');
    try {
        const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@ghanshyambhandar.com',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        if (loginData.success && loginData.data?.token) {
            adminToken = loginData.data.token;
            console.log('✅ Admin token obtained');
        } else {
            console.log('❌ Failed to get admin token');
            return;
        }
    } catch (error) {
        console.log('❌ Login failed:', error.message);
        return;
    }

    // Get all social media links
    console.log('\n2. Getting all social media links...');
    let socialMediaLinks = [];
    try {
        const response = await fetch('http://localhost:8080/api/social-media/admin/all', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const result = await response.json();
        
        if (result.success) {
            socialMediaLinks = result.data.socialMediaLinks || [];
            console.log(`✅ Found ${socialMediaLinks.length} social media links`);
            
            socialMediaLinks.forEach((link, index) => {
                console.log(`   ${index + 1}. ${link.name} (${link.platform}) - ID: ${link._id}`);
            });
        } else {
            console.log('❌ Failed to get social media links:', result.message);
            return;
        }
    } catch (error) {
        console.log('❌ Error getting social media links:', error.message);
        return;
    }

    // Create a test link to delete
    console.log('\n3. Creating a test link for deletion...');
    let testLinkId = null;
    try {
        const testLinkData = {
            platform: 'custom',
            name: 'Test Delete Link',
            url: 'https://example.com/test-delete',
            description: 'This is a test link for deletion testing',
            isActive: true,
            showOnMobile: true,
            showOnWeb: true
        };

        const response = await fetch('http://localhost:8080/api/social-media/admin', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}` 
            },
            body: JSON.stringify(testLinkData)
        });

        const result = await response.json();
        
        if (result.success) {
            // Handle different possible response structures
            testLinkId = result.data?._id || result.data?.socialMediaLink?._id || result.data?.id;
            console.log(`✅ Test link created successfully - ID: ${testLinkId}`);
            console.log(`   Full response data:`, JSON.stringify(result.data, null, 2));
        } else {
            console.log('❌ Failed to create test link:', result.message);
            return;
        }
    } catch (error) {
        console.log('❌ Error creating test link:', error.message);
        return;
    }

    // Test the delete functionality
    console.log('\n4. Testing delete functionality...');
    try {
        console.log(`   Attempting to delete link with ID: ${testLinkId}`);
        
        const response = await fetch(`http://localhost:8080/api/social-media/admin/${testLinkId}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Response status: ${response.status}`);
        console.log(`   Response headers:`, Object.fromEntries(response.headers.entries()));

        const result = await response.json();
        console.log(`   Response body:`, result);
        
        if (result.success) {
            console.log('✅ Delete API call successful');
            console.log(`   Message: ${result.message}`);
        } else {
            console.log('❌ Delete API call failed');
            console.log(`   Error: ${result.message}`);
            console.log(`   Details:`, result.error || 'No additional details');
        }
    } catch (error) {
        console.log('❌ Error during delete operation:', error.message);
        console.log('   Stack trace:', error.stack);
    }

    // Verify the deletion
    console.log('\n5. Verifying deletion...');
    try {
        const response = await fetch('http://localhost:8080/api/social-media/admin/all', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const result = await response.json();
        
        if (result.success) {
            const updatedLinks = result.data.socialMediaLinks || [];
            const deletedLink = updatedLinks.find(link => link._id === testLinkId);
            
            if (deletedLink) {
                console.log('❌ Link still exists after deletion attempt');
                console.log(`   Link status: ${deletedLink.isActive ? 'Active' : 'Inactive'}`);
            } else {
                console.log('✅ Link successfully deleted from database');
            }
            
            console.log(`   Total links after deletion: ${updatedLinks.length}`);
        }
    } catch (error) {
        console.log('❌ Error verifying deletion:', error.message);
    }

    console.log('\n🎯 DELETE FUNCTIONALITY TEST SUMMARY');
    console.log('====================================');
    console.log('✅ Admin authentication: Working');
    console.log('✅ Get social media links: Working');
    console.log('✅ Create test link: Working');
    console.log('✅ Delete API endpoint: Tested');
    console.log('✅ Deletion verification: Completed');
    console.log('');
    console.log('🔧 If delete is working in backend but failing in frontend,');
    console.log('   the issue is likely in the React error handling or');
    console.log('   the error boundary stack trace parsing.');
    console.log('');
    console.log('🚀 Check the browser console for more specific errors!');
}

testSocialMediaDelete().catch(console.error);
