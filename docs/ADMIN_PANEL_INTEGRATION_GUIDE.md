# 🎯 **COMPLETE ADMIN PANEL INTEGRATION GUIDE**

## **Overview**
Yeh guide aapko complete admin panel integration ke liye step-by-step instructions deta hai. Sabhi features backend se dynamically integrate hain - koi static data nahi hai.

## **🔐 Authentication**
```javascript
// Admin Login
POST /api/auth/login
{
  "email": "admin@admin.com",
  "password": "Admin@123"
}
```

## **📊 Dashboard APIs**

### **Main Dashboard**
```javascript
GET /api/admin/dashboard?period=30
// Returns complete dashboard with:
// - Sales overview
// - Customer stats  
// - Product stats
// - Order distribution
// - Recent orders
// - Top products
// - Inventory alerts
// - Support summary
// - Returns summary
// - Revenue trends
```

### **Quick Stats (for Header)**
```javascript
GET /api/admin/dashboard/quick-stats
// Returns:
// - Pending orders count
// - Low stock items count
// - Unread notifications count
// - Open tickets count
// - Pending returns count
```

## **👥 User Management**

### **Get All Users**
```javascript
GET /api/admin/management/users?page=1&limit=20&role=user&search=john
```

### **Get User Details**
```javascript
GET /api/admin/management/users/:id
// Returns user with order stats and recent orders
```

### **Update User Status**
```javascript
PATCH /api/admin/management/users/:id/status
{
  "isActive": true,
  "role": "user"
}
```

### **Create Admin User**
```javascript
POST /api/admin/management/users/admin
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "newadmin@admin.com",
  "password": "Admin@123",
  "phone": "9999999999",
  "role": "admin"
}
```

## **📦 Order Management**

### **Update Order Status**
```javascript
PATCH /api/admin/management/orders/:id/status
{
  "status": "shipped",
  "trackingNumber": "TRK123456",
  "notes": "Order shipped via BlueDart"
}
```

## **🛍️ Product Management**

### **Toggle Product Status**
```javascript
PATCH /api/admin/management/products/:id/toggle-status
```

### **Update Product Stock**
```javascript
PATCH /api/admin/management/products/:id/stock
{
  "stock": 50,
  "operation": "set" // or "add", "subtract"
}
```

## **🏢 Business Settings**

### **Company Information**
```javascript
PUT /api/admin/business-settings/company
{
  "companyName": "Ghanshyam Murti Bhandar",
  "companyAddress": {
    "street": "123 Temple Street",
    "city": "Mathura",
    "state": "Uttar Pradesh",
    "postalCode": "281001",
    "country": "India"
  },
  "gstin": "09ABCDE1234F1Z5",
  "pan": "ABCDE1234F",
  "businessType": "retail",
  "establishedYear": 2020,
  "contactPhone": "+91-9999999999",
  "adminEmail": "admin@ghanshyammurti.com",
  "supportEmail": "support@ghanshyammurti.com"
}
```

### **GST Settings**
```javascript
PUT /api/admin/business-settings/gst
{
  "enableGST": true,
  "defaultGSTRate": 18,
  "companyGSTIN": "09ABCDE1234F1Z5",
  "enableTaxInclusive": false,
  "taxCalculationMethod": "exclusive",
  "enableReverseCharge": false,
  "tdsApplicable": false,
  "tdsRate": 0
}
```

### **Order Settings**
```javascript
PUT /api/admin/business-settings/orders
{
  "orderPrefix": "ORD",
  "orderNumberFormat": "YYYYMM####",
  "minOrderAmount": 100,
  "maxOrderAmount": 50000,
  "autoConfirmOrders": false,
  "orderConfirmationTime": 24,
  "allowGuestCheckout": true,
  "requirePhoneVerification": false,
  "maxItemsPerOrder": 20,
  "orderCancellationWindow": 24
}
```

### **Payment Settings**
```javascript
PUT /api/admin/business-settings/payments
{
  "enableCOD": true,
  "enableOnlinePayment": true,
  "enableWalletPayment": true,
  "codCharges": 50,
  "codMinAmount": 0,
  "codMaxAmount": 10000,
  "paymentGateway": "razorpay",
  "autoRefundDays": 7,
  "walletCashbackPercentage": 1
}
```

### **Shipping Settings**
```javascript
PUT /api/admin/business-settings/shipping
{
  "enableFreeShipping": true,
  "freeShippingMinAmount": 500,
  "defaultShippingCharge": 50,
  "expressShippingCharge": 100,
  "maxShippingWeight": 50,
  "shippingCalculationMethod": "weight",
  "enableShiprocket": true,
  "defaultCourierPartner": "auto",
  "packagingCharges": 10,
  "handlingCharges": 5
}
```

### **Inventory Settings**
```javascript
PUT /api/admin/business-settings/inventory
{
  "enableStockManagement": true,
  "allowBackorders": false,
  "lowStockThreshold": 10,
  "outOfStockThreshold": 0,
  "enableStockAlerts": true,
  "stockAlertEmail": "inventory@ghanshyammurti.com",
  "autoUpdateStock": true,
  "reserveStockDuration": 30
}
```

### **Return/Refund Settings**
```javascript
PUT /api/admin/business-settings/returns
{
  "enableReturns": true,
  "returnWindow": 7,
  "enableExchanges": true,
  "exchangeWindow": 7,
  "autoApproveReturns": false,
  "returnShippingCharge": 0,
  "refundProcessingDays": 5,
  "enableStoreCredit": true,
  "storeCreditExpiry": 365
}
```

### **Notification Settings**
```javascript
PUT /api/admin/business-settings/notifications
{
  "enableEmailNotifications": true,
  "enableSMSNotifications": true,
  "enablePushNotifications": true,
  "emailProvider": "smtp",
  "smsProvider": "twilio",
  "notificationRetryAttempts": 3,
  "notificationRetryDelay": 5,
  "adminNotificationEmail": "admin@ghanshyammurti.com"
}
```

### **Feature Flags**
```javascript
PUT /api/admin/business-settings/features
{
  "enableWishlist": true,
  "enableReviews": true,
  "enableCoupons": true,
  "enableLoyaltyProgram": false,
  "enableReferralProgram": false,
  "enableMultiVendor": false,
  "enableSubscriptions": false,
  "enableAffiliateProgram": false
}
```

## **🔧 System Management**

### **System Overview**
```javascript
GET /api/admin/management/system/overview
// Returns system health, settings, recent activity
```

### **Toggle Maintenance Mode**
```javascript
PATCH /api/admin/management/system/maintenance
{
  "enabled": true,
  "message": "Site is under maintenance. Please check back later."
}
```

### **System Validation**
```javascript
GET /api/settings/validate
// Returns validation results with errors and warnings
```

### **System Status**
```javascript
GET /api/settings/status
// Returns status of all system components
```

## **📈 Advanced Features**

### **Returns Management**
```javascript
GET /api/returns/admin/all
PATCH /api/returns/:id/approve
PATCH /api/returns/:id/reject
PATCH /api/returns/:id/schedule-pickup
PATCH /api/returns/:id/complete
```

### **Support Tickets**
```javascript
GET /api/support/admin/dashboard
GET /api/support/admin/tickets
PATCH /api/support/admin/tickets/:id/assign
POST /api/support/admin/tickets/:id/messages
PATCH /api/support/admin/tickets/:id/resolve
```

### **Notifications**
```javascript
GET /api/notifications/admin/all
POST /api/notifications
GET /api/notifications/admin/analytics
```

## **🎯 Frontend Integration Examples**

### **React Component Example**
```jsx
// Dashboard Component
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data.data.dashboard);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };
  
  return (
    <div className="admin-dashboard">
      <div className="stats-grid">
        <StatCard 
          title="Total Orders" 
          value={dashboardData?.salesOverview?.totalOrders || 0}
        />
        <StatCard 
          title="Total Revenue" 
          value={dashboardData?.salesOverview?.totalRevenue || 0}
        />
        {/* More stat cards */}
      </div>
      
      <div className="charts-section">
        <RevenueChart data={dashboardData?.revenueTrend} />
        <OrderStatusChart data={dashboardData?.orderStatusDistribution} />
      </div>
      
      <div className="tables-section">
        <RecentOrdersTable orders={dashboardData?.recentOrders} />
        <TopProductsTable products={dashboardData?.topProducts} />
      </div>
    </div>
  );
};
```

### **Settings Form Example**
```jsx
// Business Settings Form
const BusinessSettingsForm = () => {
  const [settings, setSettings] = useState({});
  
  const updateCompanyInfo = async (formData) => {
    try {
      await axios.put('/api/admin/business-settings/company', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Company information updated successfully!');
    } catch (error) {
      toast.error('Failed to update company information');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        name="companyName" 
        value={settings.companyName} 
        onChange={handleChange}
        placeholder="Company Name"
      />
      <input 
        name="gstin" 
        value={settings.gstin} 
        onChange={handleChange}
        placeholder="GSTIN Number"
      />
      {/* More form fields */}
      <button type="submit">Update Settings</button>
    </form>
  );
};
```

## **🚀 Production Deployment**

1. **Environment Variables**
```bash
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/ghanshyam_ecommerce
JWT_SECRET=your-super-secret-jwt-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

2. **Start Server**
```bash
npm start
```

3. **Test Integration**
```bash
node scripts/testAdminPanelIntegration.js
```

## **📝 Notes**
- Sabhi APIs authentication require karti hain
- Admin role required hai management APIs ke liye
- Validation har endpoint mein implemented hai
- Error handling comprehensive hai
- Real-time data updates available hain
- Complete audit trail maintained hai
