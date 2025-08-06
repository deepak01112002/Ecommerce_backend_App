# 🔧 SYSTEM SETTINGS API GUIDE
## Application Control & Invoice Settings

### 📊 **API OVERVIEW**
- **Base URL:** `https://server.ghanshyammurtibhandar.com/api/settings`
- **Public Endpoints:** No authentication required
- **Admin Endpoints:** JWT authentication required

---

## 🌐 **PUBLIC ENDPOINTS (For Users/Mobile App)**

### **1. Get Public Settings**
```
GET /api/settings/public
```

**Purpose:** Get public system settings for users (app status, business info, features)

**Response:**
```json
{
  "success": true,
  "message": "Public settings retrieved successfully",
  "data": {
    "settings": {
      "appStatus": {
        "isActive": true,
        "maintenanceMode": false,
        "maintenanceMessage": "Application is under maintenance. Please try again later.",
        "estimatedDowntime": null
      },
      "business": {
        "companyName": "Ghanshyam Murti Bhandar",
        "supportEmail": "support@ghanshyammurtibhandar.com",
        "supportPhone": "+919876543210",
        "businessHours": "9:00 AM - 6:00 PM"
      },
      "features": {
        "enableInvoiceDownload": true,
        "enableOrderTracking": true,
        "enableWishlist": true,
        "enableReviews": true,
        "enableWallet": true
      },
      "invoice": {
        "downloadEnabled": true,
        "format": "pdf",
        "includeGST": true
      }
    },
    "timestamp": "2024-12-05T10:30:00.000Z"
  }
}
```

### **2. Get App Status (For Maintenance Popup)**
```
GET /api/settings/public/app-status
```

**Purpose:** Check if app is active or in maintenance mode

**Response:**
```json
{
  "success": true,
  "message": "App status retrieved successfully",
  "data": {
    "appStatus": {
      "isActive": true,
      "maintenanceMode": false,
      "maintenanceMessage": "Application is under maintenance. Please try again later.",
      "estimatedDowntime": null,
      "allowedUsers": [],
      "lastUpdated": "2024-12-05T10:30:00.000Z",
      "reason": "Scheduled maintenance"
    },
    "serverTime": "2024-12-05T10:30:00.000Z"
  }
}
```

### **3. Get Public Invoice Settings**
```
GET /api/settings/public/invoice-settings
```

**Purpose:** Get invoice download settings for users

**Response:**
```json
{
  "success": true,
  "message": "Invoice settings retrieved successfully",
  "data": {
    "invoiceSettings": {
      "downloadEnabled": true,
      "format": "pdf",
      "includeGST": true,
      "companyDetails": {
        "name": "Ghanshyam Murti Bhandar",
        "address": "Religious Items Store",
        "phone": "+919876543210",
        "email": "support@ghanshyammurtibhandar.com",
        "gstNumber": "GST123456789"
      }
    },
    "timestamp": "2024-12-05T10:30:00.000Z"
  }
}
```

---

## 🔐 **ADMIN ENDPOINTS (Authentication Required)**

### **4. Get App Status (Admin)**
```
GET /api/settings/app-status
Authorization: Bearer <admin_token>
```

**Purpose:** Get detailed app status for admin

### **5. Update App Status (Activate/Deactivate)**
```
PUT /api/settings/app-status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": false,
  "reason": "Scheduled maintenance for system updates",
  "maintenanceMessage": "We are updating our system. Please try again in 2 hours.",
  "estimatedDowntime": "2 hours"
}
```

**Purpose:** Activate or deactivate the application

### **6. Get Invoice Settings (Admin)**
```
GET /api/settings/invoice-settings
Authorization: Bearer <admin_token>
```

**Purpose:** Get complete invoice settings for admin

### **7. Update Invoice Settings**
```
PUT /api/settings/invoice-settings
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "enableInvoiceDownload": true,
  "invoiceFormat": "pdf",
  "includeCompanyLogo": true,
  "invoiceTemplate": "default",
  "invoiceNumberPrefix": "INV",
  "taxSettings": {
    "enableGST": true,
    "gstRate": 18,
    "companyGSTIN": "GST123456789"
  },
  "companyDetails": {
    "name": "Ghanshyam Murti Bhandar",
    "address": "123 Religious Street, Mumbai",
    "phone": "+919876543210",
    "email": "support@ghanshyammurtibhandar.com",
    "gstNumber": "GST123456789"
  }
}
```

### **8. Get Invoice Template**
```
GET /api/settings/invoice-template/default
Authorization: Bearer <admin_token>
```

### **9. Update Invoice Template**
```
PUT /api/settings/invoice-template/default
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "templateContent": "<html>...</html>",
  "templateName": "Custom Invoice Template"
}
```

---

## 📱 **MOBILE APP INTEGRATION**

### **Flutter/React Native Usage:**

#### **Check App Status on App Launch:**
```dart
Future<bool> checkAppStatus() async {
  try {
    final response = await http.get(
      Uri.parse('https://server.ghanshyammurtibhandar.com/api/settings/public/app-status')
    );
    
    final data = json.decode(response.body);
    
    if (data['success']) {
      final appStatus = data['data']['appStatus'];
      
      if (!appStatus['isActive'] || appStatus['maintenanceMode']) {
        // Show maintenance popup
        showMaintenancePopup(
          message: appStatus['maintenanceMessage'],
          estimatedDowntime: appStatus['estimatedDowntime']
        );
        return false;
      }
      return true;
    }
    return true;
  } catch (e) {
    // Handle error - assume app is active
    return true;
  }
}
```

#### **Check Invoice Download Feature:**
```dart
Future<bool> isInvoiceDownloadEnabled() async {
  try {
    final response = await http.get(
      Uri.parse('https://server.ghanshyammurtibhandar.com/api/settings/public/invoice-settings')
    );
    
    final data = json.decode(response.body);
    return data['data']['invoiceSettings']['downloadEnabled'] ?? true;
  } catch (e) {
    return true; // Default to enabled
  }
}
```

#### **Get Public Settings:**
```dart
Future<Map<String, dynamic>> getPublicSettings() async {
  final response = await http.get(
    Uri.parse('https://server.ghanshyammurtibhandar.com/api/settings/public')
  );
  
  final data = json.decode(response.body);
  return data['data']['settings'];
}
```

---

## 🎯 **USE CASES**

### **1. Maintenance Mode Popup**
- Call `/api/settings/public/app-status` on app launch
- Show popup if `isActive: false` or `maintenanceMode: true`
- Display `maintenanceMessage` and `estimatedDowntime`

### **2. Feature Toggle**
- Call `/api/settings/public` to get feature flags
- Enable/disable features based on settings:
  - Invoice download button
  - Order tracking
  - Wishlist functionality
  - Review system
  - Wallet features

### **3. Invoice Download**
- Check if `enableInvoiceDownload` is true
- Use correct `format` (pdf/html)
- Include GST if `includeGST` is true

### **4. Admin Control**
- Admin can activate/deactivate app instantly
- Set maintenance messages
- Configure invoice settings
- Update company details

---

## 🧪 **TESTING**

### **Test App Status:**
```bash
# Check if app is active
curl https://server.ghanshyammurtibhandar.com/api/settings/public/app-status

# Admin login and deactivate app
curl -X POST https://server.ghanshyammurtibhandar.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ghanshyambhandar.com","password":"admin123"}'

# Deactivate app (use token from login)
curl -X PUT https://server.ghanshyammurtibhandar.com/api/settings/app-status \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false,"reason":"Testing maintenance mode"}'
```

### **Test Public Settings:**
```bash
# Get all public settings
curl https://server.ghanshyammurtibhandar.com/api/settings/public

# Get invoice settings
curl https://server.ghanshyammurtibhandar.com/api/settings/public/invoice-settings
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **For Mobile App:**
- [ ] Add app status check on launch
- [ ] Implement maintenance popup
- [ ] Add feature toggles based on settings
- [ ] Implement invoice download with settings
- [ ] Handle offline/error scenarios

### **For Admin Panel:**
- [ ] Add app control toggle
- [ ] Add maintenance message editor
- [ ] Add invoice settings page
- [ ] Add company details form
- [ ] Add template editor

---

**🎉 ALL SYSTEM SETTINGS APIS ARE READY FOR PRODUCTION USE! 🎉**
