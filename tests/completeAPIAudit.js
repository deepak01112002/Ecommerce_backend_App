require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function completeAPIAudit() {
    console.log('🔍 COMPLETE BACKEND API AUDIT');
    console.log('=============================');
    console.log('Scanning all routes and controllers for implemented APIs');
    console.log('=============================\n');

    const routesDir = path.join(__dirname, '../routes');
    const controllersDir = path.join(__dirname, '../controllers');

    // Get all route files
    const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    const controllerFiles = fs.readdirSync(controllersDir).filter(file => file.endsWith('.js'));

    console.log('📁 ROUTE FILES FOUND:');
    console.log('=====================');
    routeFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });

    console.log('\n📁 CONTROLLER FILES FOUND:');
    console.log('==========================');
    controllerFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });

    // Analyze each route file
    console.log('\n🔍 DETAILED API ANALYSIS:');
    console.log('=========================\n');

    const allAPIs = [];

    for (const routeFile of routeFiles) {
        const routePath = path.join(routesDir, routeFile);
        const routeContent = fs.readFileSync(routePath, 'utf8');
        
        const moduleName = routeFile.replace('.js', '').replace('Routes', '');
        console.log(`📋 ${moduleName.toUpperCase()} APIs:`);
        console.log('='.repeat(moduleName.length + 6));

        // Extract route definitions
        const routePatterns = [
            /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
            /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
        ];

        const routes = [];
        
        for (const pattern of routePatterns) {
            let match;
            while ((match = pattern.exec(routeContent)) !== null) {
                const method = match[1].toUpperCase();
                const endpoint = match[2];
                routes.push({ method, endpoint, module: moduleName });
            }
        }

        // Sort routes by endpoint
        routes.sort((a, b) => a.endpoint.localeCompare(b.endpoint));

        if (routes.length === 0) {
            console.log('   No routes found in this file\n');
            continue;
        }

        routes.forEach((route, index) => {
            console.log(`   ${index + 1}. ${route.method.padEnd(6)} ${route.endpoint}`);
            allAPIs.push({
                module: route.module,
                method: route.method,
                endpoint: route.endpoint,
                fullPath: `/api${route.endpoint.startsWith('/') ? '' : '/'}${route.endpoint}`
            });
        });
        console.log('');
    }

    // Group APIs by category
    console.log('\n📊 API SUMMARY BY CATEGORY:');
    console.log('===========================\n');

    const apisByCategory = {};
    allAPIs.forEach(api => {
        if (!apisByCategory[api.module]) {
            apisByCategory[api.module] = [];
        }
        apisByCategory[api.module].push(api);
    });

    Object.keys(apisByCategory).sort().forEach(category => {
        const apis = apisByCategory[category];
        console.log(`🔹 ${category.toUpperCase()} (${apis.length} endpoints):`);
        
        const methodCounts = {};
        apis.forEach(api => {
            methodCounts[api.method] = (methodCounts[api.method] || 0) + 1;
        });
        
        console.log(`   Methods: ${Object.entries(methodCounts).map(([method, count]) => `${method}(${count})`).join(', ')}`);
        console.log('');
    });

    // Generate complete API list
    console.log('\n📋 COMPLETE API ENDPOINT LIST:');
    console.log('==============================\n');

    const sortedAPIs = allAPIs.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
    
    sortedAPIs.forEach((api, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${api.method.padEnd(6)} ${api.fullPath}`);
    });

    // Statistics
    console.log('\n📈 API STATISTICS:');
    console.log('==================');
    console.log(`Total API Endpoints: ${allAPIs.length}`);
    console.log(`Total Categories: ${Object.keys(apisByCategory).length}`);
    
    const methodStats = {};
    allAPIs.forEach(api => {
        methodStats[api.method] = (methodStats[api.method] || 0) + 1;
    });
    
    console.log('\nMethod Distribution:');
    Object.entries(methodStats).sort().forEach(([method, count]) => {
        const percentage = ((count / allAPIs.length) * 100).toFixed(1);
        console.log(`  ${method}: ${count} (${percentage}%)`);
    });

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        totalEndpoints: allAPIs.length,
        totalCategories: Object.keys(apisByCategory).length,
        methodStats,
        apisByCategory,
        allAPIs: sortedAPIs
    };

    const reportPath = path.join(__dirname, '../docs/COMPLETE_API_AUDIT_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
    console.log('\n🎯 AUDIT COMPLETE!');
    console.log('==================');
    console.log('✅ All route files scanned');
    console.log('✅ All endpoints catalogued');
    console.log('✅ Statistics generated');
    console.log('✅ Report saved');
}

completeAPIAudit().catch(console.error);
