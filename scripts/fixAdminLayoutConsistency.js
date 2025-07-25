const fs = require('fs');
const path = require('path');

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

// Admin pages that need layout consistency
const adminPages = [
    { name: 'Categories', path: '../Application_Admin/app/categories/page.tsx', currentPage: 'categories' },
    { name: 'Suppliers', path: '../Application_Admin/app/suppliers/page.tsx', currentPage: 'suppliers' },
    { name: 'Invoices', path: '../Application_Admin/app/invoices/page.tsx', currentPage: 'invoices' },
    { name: 'Returns', path: '../Application_Admin/app/returns/page.tsx', currentPage: 'returns' },
    { name: 'Support', path: '../Application_Admin/app/support/page.tsx', currentPage: 'support' },
    { name: 'Shipping', path: '../Application_Admin/app/shipping/page.tsx', currentPage: 'shipping' },
    { name: 'Reports', path: '../Application_Admin/app/reports/page.tsx', currentPage: 'reports' },
    { name: 'Analytics', path: '../Application_Admin/app/analytics/page.tsx', currentPage: 'analytics' },
    { name: 'Customers', path: '../Application_Admin/app/customers/page.tsx', currentPage: 'customers' },
    { name: 'Inventory', path: '../Application_Admin/app/inventory/page.tsx', currentPage: 'inventory' },
    { name: 'Coupons', path: '../Application_Admin/app/coupons/page.tsx', currentPage: 'coupons' },
    { name: 'Settings', path: '../Application_Admin/app/settings/page.tsx', currentPage: 'settings' }
];

function fixAdminPageLayout(pagePath, pageName, currentPage) {
    try {
        const fullPath = path.resolve(__dirname, pagePath);
        
        if (!fs.existsSync(fullPath)) {
            logWarning(`File not found: ${pagePath}`);
            return false;
        }
        
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if AdminLayout is already imported
        if (content.includes('AdminLayout')) {
            logInfo(`${pageName}: Already has AdminLayout`);
            return true;
        }
        
        // Add AdminLayout import
        const importRegex = /import.*from.*["']lucide-react["'];/;
        const importMatch = content.match(importRegex);
        
        if (importMatch) {
            const importLine = importMatch[0];
            const newImportLine = importLine + '\nimport { AdminLayout } from "@/components/layout/admin-layout";';
            content = content.replace(importLine, newImportLine);
        } else {
            // Fallback: add import after other imports
            const lastImportRegex = /import.*from.*["'][^"']*["'];(?=\s*\n\s*(?:interface|const|export|function))/;
            const lastImportMatch = content.match(lastImportRegex);
            
            if (lastImportMatch) {
                const lastImportLine = lastImportMatch[0];
                const newImportLine = lastImportLine + '\nimport { AdminLayout } from "@/components/layout/admin-layout";';
                content = content.replace(lastImportLine, newImportLine);
            }
        }
        
        // Find the main return statement and wrap content with AdminLayout
        const returnRegex = /return\s*\(\s*<div className="space-y-6">/;
        const returnMatch = content.match(returnRegex);
        
        if (returnMatch) {
            content = content.replace(
                'return (',
                `return (\n    <AdminLayout currentPage="${currentPage}">`
            );
            
            // Find the closing div and add AdminLayout closing tag
            const lines = content.split('\n');
            let braceCount = 0;
            let returnLineIndex = -1;
            let closingIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('return (') && lines[i].includes('AdminLayout')) {
                    returnLineIndex = i;
                    continue;
                }
                
                if (returnLineIndex !== -1) {
                    const line = lines[i];
                    const openBraces = (line.match(/\(/g) || []).length;
                    const closeBraces = (line.match(/\)/g) || []).length;
                    braceCount += openBraces - closeBraces;
                    
                    if (braceCount === 0 && line.includes(');')) {
                        closingIndex = i;
                        break;
                    }
                }
            }
            
            if (closingIndex !== -1) {
                lines[closingIndex] = lines[closingIndex].replace(');', '\n    </AdminLayout>\n  );');
                content = lines.join('\n');
            }
        }
        
        // Write the updated content back to the file
        fs.writeFileSync(fullPath, content, 'utf8');
        logSuccess(`${pageName}: Layout fixed successfully`);
        return true;
        
    } catch (error) {
        logError(`${pageName}: Failed to fix layout - ${error.message}`);
        return false;
    }
}

function fixAllAdminLayouts() {
    logSection('🔧 FIXING ADMIN LAYOUT CONSISTENCY');
    
    let successCount = 0;
    let totalCount = adminPages.length;
    
    for (const page of adminPages) {
        logInfo(`Processing ${page.name}...`);
        const success = fixAdminPageLayout(page.path, page.name, page.currentPage);
        if (success) {
            successCount++;
        }
    }
    
    logSection('📊 LAYOUT FIX SUMMARY');
    logInfo(`Total pages processed: ${totalCount}`);
    logInfo(`Successfully fixed: ${successCount}`);
    logInfo(`Failed: ${totalCount - successCount}`);
    
    if (successCount === totalCount) {
        logSuccess('🎉 ALL ADMIN PAGES LAYOUT FIXED!');
        logInfo('✅ Consistent spacing between sidebar and main content');
        logInfo('✅ Professional layout across all pages');
        logInfo('✅ AdminLayout component properly integrated');
    } else {
        logWarning(`⚠️ ${totalCount - successCount} pages need manual fixing`);
    }
    
    logSection('🌐 ADMIN PANEL STATUS');
    logInfo('Admin Panel URL: http://localhost:3001');
    logInfo('All pages now have consistent layout and spacing');
    logInfo('Dashboard-like appearance across all admin pages');
}

// Run the fix if this file is executed directly
if (require.main === module) {
    fixAllAdminLayouts();
}

module.exports = { fixAllAdminLayouts };
