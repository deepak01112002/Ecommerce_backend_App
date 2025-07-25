const fs = require('fs');
const path = require('path');
const colors = require('colors');

// Function to extract routes from a route file
function extractRoutesFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const routes = [];
    
    // Extract router.method patterns
    const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const path = match[2];
      routes.push({ method, path });
    }
    
    return routes;
  } catch (error) {
    console.log(`Error reading ${filePath}: ${error.message}`.red);
    return [];
  }
}

// Main function to generate complete API list
function generateCompleteAPIList() {
  console.log('🎯 GENERATING COMPLETE API LIST FROM ALL ROUTE FILES'.rainbow.bold);
  console.log('=' .repeat(80).gray);
  
  const routesDir = path.join(__dirname, '../routes');
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  
  const apiList = {
    '/api/auth': [],
    '/api/users': [],
    '/api/products': [],
    '/api/categories': [],
    '/api/cart': [],
    '/api/wishlist': [],
    '/api/reviews': [],
    '/api/orders': [],
    '/api/coupons': [],
    '/api/payments': [],
    '/api/admin': [],
    '/api/admin/dashboard': [],
    '/api/admin/management': [],
    '/api/admin/business-settings': [],
    '/api/addresses': [],
    '/api/wallet': [],
    '/api/shipping': [],
    '/api/invoices': [],
    '/api/gst': [],
    '/api/bill-management': [],
    '/api/inventory': [],
    '/api/suppliers': [],
    '/api/purchase-orders': [],
    '/api/reports': [],
    '/api/notifications': [],
    '/api/returns': [],
    '/api/support': [],
    '/api/settings': [],
    '/api/v2': []
  };
  
  // Route file to base path mapping
  const routeMapping = {
    'authRoutes.js': '/api/auth',
    'userRoutes.js': '/api/users',
    'productRoutes.js': '/api/products',
    'categoryRoutes.js': '/api/categories',
    'cartRoutes.js': '/api/cart',
    'wishlistRoutes.js': '/api/wishlist',
    'reviewRoutes.js': '/api/reviews',
    'orderRoutes.js': '/api/orders',
    'couponRoutes.js': '/api/coupons',
    'paymentRoutes.js': '/api/payments',
    'dashboardRoutes.js': '/api/admin',
    'adminDashboardRoutes.js': '/api/admin/dashboard',
    'adminManagementRoutes.js': '/api/admin/management',
    'businessSettingsRoutes.js': '/api/admin/business-settings',
    'addressRoutes.js': '/api/addresses',
    'walletRoutes.js': '/api/wallet',
    'shippingRoutes.js': '/api/shipping',
    'invoiceRoutes.js': '/api/invoices',
    'gstRoutes.js': '/api/gst',
    'billManagementRoutes.js': '/api/bill-management',
    'inventoryRoutes.js': '/api/inventory',
    'supplierRoutes.js': '/api/suppliers',
    'purchaseOrderRoutes.js': '/api/purchase-orders',
    'advancedReportsRoutes.js': '/api/reports',
    'notificationRoutes.js': '/api/notifications',
    'returnRoutes.js': '/api/returns',
    'supportRoutes.js': '/api/support',
    'systemSettingsRoutes.js': '/api/settings',
    'productionRoutes.js': '/api/v2'
  };
  
  console.log('\n📁 Scanning Route Files:'.cyan.bold);
  
  // Process each route file
  routeFiles.forEach(file => {
    const filePath = path.join(routesDir, file);
    const basePath = routeMapping[file];
    
    if (basePath) {
      console.log(`  📄 Processing ${file}...`.yellow);
      const routes = extractRoutesFromFile(filePath);
      
      if (routes.length > 0) {
        apiList[basePath] = routes;
        console.log(`    ✅ Found ${routes.length} routes`.green);
      } else {
        console.log(`    ⚠️  No routes found`.yellow);
      }
    } else {
      console.log(`  ⚠️  Unknown route file: ${file}`.yellow);
    }
  });
  
  // Generate the complete API documentation
  const apiDoc = generateAPIDocumentation(apiList);
  
  // Save to file
  const docPath = path.join(__dirname, '../docs/COMPLETE_API_LIST.md');
  fs.writeFileSync(docPath, apiDoc);
  
  console.log(`\n📄 Complete API list saved to: ${docPath}`.cyan);
  console.log('\n🎯 API GENERATION COMPLETED!'.green.bold);
  
  // Print summary
  let totalAPIs = 0;
  Object.values(apiList).forEach(routes => {
    totalAPIs += routes.length;
  });
  
  console.log(`\n📊 SUMMARY:`.yellow.bold);
  console.log(`  📁 Route Files Processed: ${routeFiles.length}`);
  console.log(`  🎯 Total API Endpoints: ${totalAPIs}`);
  console.log(`  📋 Base Paths: ${Object.keys(apiList).length}`);
}

function generateAPIDocumentation(apiList) {
  let doc = `# 🎯 COMPLETE API LIST - GHANSHYAM ECOMMERCE BACKEND

## 📊 Overview
This document contains ALL API endpoints available in the Ghanshyam Ecommerce Backend system.

**Base URL:** \`http://localhost:8080\`

---

## 📋 API ENDPOINTS BY CATEGORY

`;

  let totalAPIs = 0;
  
  Object.entries(apiList).forEach(([basePath, routes]) => {
    if (routes.length > 0) {
      totalAPIs += routes.length;
      
      // Get category name and icon
      const categoryInfo = getCategoryInfo(basePath);
      
      doc += `\n## ${categoryInfo.icon} ${categoryInfo.name} (${routes.length} endpoints)\n`;
      doc += `**Base Path:** \`${basePath}\`\n\n`;
      
      routes.forEach((route, index) => {
        const fullPath = basePath + route.path;
        doc += `### ${index + 1}. ${route.method} ${fullPath}\n`;
        doc += `- **Method:** ${route.method}\n`;
        doc += `- **Endpoint:** \`${fullPath}\`\n`;
        doc += `- **Description:** ${getRouteDescription(route.method, route.path, basePath)}\n\n`;
      });
      
      doc += `---\n\n`;
    }
  });
  
  // Add summary at the end
  doc += `\n## 📊 SUMMARY\n\n`;
  doc += `- **Total API Endpoints:** ${totalAPIs}\n`;
  doc += `- **Base Paths:** ${Object.keys(apiList).length}\n`;
  doc += `- **Categories:** ${Object.keys(apiList).filter(path => apiList[path].length > 0).length}\n\n`;
  
  // Add authentication info
  doc += `## 🔐 AUTHENTICATION\n\n`;
  doc += `Most endpoints require authentication. Use the following header:\n`;
  doc += `\`\`\`\n`;
  doc += `Authorization: Bearer <JWT_TOKEN>\n`;
  doc += `\`\`\`\n\n`;
  doc += `Get token from: \`POST /api/auth/login\`\n\n`;
  
  // Add admin credentials
  doc += `## 👨‍💼 ADMIN CREDENTIALS\n\n`;
  doc += `- **Email:** admin@admin.com\n`;
  doc += `- **Password:** Admin@123\n\n`;
  
  // Add testing info
  doc += `## 🧪 TESTING\n\n`;
  doc += `1. **Postman Collection:** Import \`docs/Ghanshyam_Ecommerce_APIs.postman_collection.json\`\n`;
  doc += `2. **Manual Testing Guide:** See \`docs/MANUAL_API_TESTING_GUIDE.md\`\n`;
  doc += `3. **Environment Setup:**\n`;
  doc += `   - \`base_url\`: http://localhost:8080/api\n`;
  doc += `   - \`admin_token\`: (set after login)\n\n`;
  
  doc += `---\n\n`;
  doc += `*Generated automatically from route files*\n`;
  doc += `*Last updated: ${new Date().toISOString()}*\n`;
  
  return doc;
}

function getCategoryInfo(basePath) {
  const categoryMap = {
    '/api/auth': { name: 'Authentication', icon: '🔐' },
    '/api/users': { name: 'User Management', icon: '👥' },
    '/api/products': { name: 'Product Management', icon: '📦' },
    '/api/categories': { name: 'Category Management', icon: '📁' },
    '/api/cart': { name: 'Shopping Cart', icon: '🛒' },
    '/api/wishlist': { name: 'Wishlist', icon: '❤️' },
    '/api/reviews': { name: 'Reviews & Ratings', icon: '⭐' },
    '/api/orders': { name: 'Order Management', icon: '📋' },
    '/api/coupons': { name: 'Coupon System', icon: '🎫' },
    '/api/payments': { name: 'Payment Processing', icon: '💳' },
    '/api/admin': { name: 'Admin Dashboard', icon: '📊' },
    '/api/admin/dashboard': { name: 'Admin Dashboard Advanced', icon: '📈' },
    '/api/admin/management': { name: 'Admin Management', icon: '⚙️' },
    '/api/admin/business-settings': { name: 'Business Settings', icon: '🏢' },
    '/api/addresses': { name: 'Address Management', icon: '📍' },
    '/api/wallet': { name: 'Wallet System', icon: '💰' },
    '/api/shipping': { name: 'Shipping Management', icon: '🚚' },
    '/api/invoices': { name: 'Invoice System', icon: '🧾' },
    '/api/gst': { name: 'GST Management', icon: '📄' },
    '/api/bill-management': { name: 'Bill Management', icon: '💼' },
    '/api/inventory': { name: 'Inventory Management', icon: '📊' },
    '/api/suppliers': { name: 'Supplier Management', icon: '🏭' },
    '/api/purchase-orders': { name: 'Purchase Orders', icon: '📝' },
    '/api/reports': { name: 'Advanced Reports', icon: '📈' },
    '/api/notifications': { name: 'Notification System', icon: '🔔' },
    '/api/returns': { name: 'Return Management', icon: '↩️' },
    '/api/support': { name: 'Customer Support', icon: '🎧' },
    '/api/settings': { name: 'System Settings', icon: '⚙️' },
    '/api/v2': { name: 'Production Routes V2', icon: '🚀' }
  };
  
  return categoryMap[basePath] || { name: 'Unknown', icon: '❓' };
}

function getRouteDescription(method, path, basePath) {
  // Generate basic descriptions based on method and path
  const descriptions = {
    'GET': {
      '/': 'Get all items with pagination and filtering',
      '/:id': 'Get single item by ID',
      '/search': 'Search items',
      '/featured': 'Get featured items',
      '/profile': 'Get user profile',
      '/dashboard': 'Get dashboard data',
      '/stats': 'Get statistics',
      '/status': 'Get status information'
    },
    'POST': {
      '/': 'Create new item',
      '/login': 'User login',
      '/register': 'User registration',
      '/signup': 'User signup',
      '/add': 'Add new item',
      '/create': 'Create new item'
    },
    'PUT': {
      '/': 'Update item',
      '/:id': 'Update item by ID',
      '/profile': 'Update user profile'
    },
    'PATCH': {
      '/:id': 'Partially update item by ID',
      '/status': 'Update status'
    },
    'DELETE': {
      '/:id': 'Delete item by ID',
      '/permanent': 'Permanently delete item'
    }
  };
  
  // Try to find specific description
  if (descriptions[method] && descriptions[method][path]) {
    return descriptions[method][path];
  }
  
  // Generate generic description
  const action = {
    'GET': 'Retrieve',
    'POST': 'Create',
    'PUT': 'Update',
    'PATCH': 'Modify',
    'DELETE': 'Remove'
  }[method] || 'Process';
  
  const resource = basePath.split('/').pop() || 'resource';
  
  return `${action} ${resource} data`;
}

// Run the generator
if (require.main === module) {
  generateCompleteAPIList();
}

module.exports = { generateCompleteAPIList };
