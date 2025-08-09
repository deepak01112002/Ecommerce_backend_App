# Mobile App API Integration Guide
**Ghanshyam Murti Bhandar - Backend APIs**

## 📋 Overview
This document provides complete API endpoints for mobile app integration. All APIs return data from database only - no dummy/default values are injected by controllers.

## 🌐 Base URLs
- **Local Development**: `http://localhost:8080`
- **Production**: `https://server.ghanshyammurtibhandar.com`

---

## 1. 📱 Social Media Links (Public)

### Get Active Social Media Links
```http
GET {BASE_URL}/api/social-media?active=true
```

**Query Parameters:**
- `active`: `true` | `false` | `all` (default: `true`)
- `platform`: `whatsapp` | `facebook` | `instagram` | `youtube` | `telegram` | `website` | `custom` (optional)

**Response:**
```json
{
  "success": true,
  "message": "Social media links retrieved successfully",
  "data": {
    "socialMediaLinks": [
      {
        "_id": "689398da134ab31e7c888e57",
        "platform": "whatsapp",
        "name": "WhatsApp Business",
        "url": "https://wa.me/919876543210?text=Hello!%20I%20am%20interested...",
        "icon": "💬",
        "description": "Contact us on WhatsApp for quick support",
        "isActive": true,
        "displayOrder": 1,
        "openInNewTab": true,
        "showOnMobile": true,
        "showOnWeb": true
      },
      {
        "platform": "facebook",
        "name": "Facebook Page",
        "url": "https://facebook.com/ghanshyammurtibhandar",
        "icon": "📘"
      }
    ],
    "count": 10
  }
}
```

**Usage in App:**

**Flutter:**
```dart
Future<List<SocialMediaLink>> getSocialMediaLinks() async {
  final response = await http.get(
    Uri.parse('${baseUrl}/api/social-media?active=true')
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    if (data['success']) {
      return data['data']['socialMediaLinks']
          .map<SocialMediaLink>((link) => SocialMediaLink.fromJson(link))
          .toList();
    }
  }
  return [];
}
```

**React Native:**
```javascript
const getSocialMediaLinks = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/social-media?active=true`);
    const data = await response.json();

    if (data.success) {
      return data.data.socialMediaLinks;
    }
    return [];
  } catch (error) {
    console.error('Error fetching social media links:', error);
    return [];
  }
};
```

---

## 2. 🔧 App Status Check (Public)

### Check App Activation/Maintenance Status
```http
GET {BASE_URL}/api/settings/public/app-status
```

**Response:**
```json
{
  "success": true,
  "message": "App status retrieved successfully",
  "data": {
    "appStatus": {
      "isActive": false,
      "maintenanceMode": true,
      "maintenanceMessage": "We are upgrading our servers for better performance",
      "estimatedDowntime": "2 hours",
      "reason": "Extended maintenance for security updates",
      "lastUpdated": "2025-08-09T17:28:14.278Z"
    },
    "serverTime": "2025-08-09T18:13:09.966Z"
  }
}
```

**Usage in App:**

**Flutter:**
```dart
Future<void> checkAppStatus() async {
  final response = await http.get(
    Uri.parse('${baseUrl}/api/settings/public/app-status')
  );

  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    if (data['success']) {
      final status = data['data']['appStatus'];

      if (status['isActive'] == false || status['maintenanceMode'] == true) {
        showMaintenanceDialog(
          message: status['maintenanceMessage'] ?? "App is under maintenance",
          estimatedTime: status['estimatedDowntime'],
          reason: status['reason']
        );
      } else {
        navigateToHome();
      }
    }
  }
}
```

**React Native:**
```javascript
const checkAppStatus = async () => {
  try {
    const response = await fetch(`${baseUrl}/api/settings/public/app-status`);
    const data = await response.json();

    if (data.success) {
      const status = data.data.appStatus;

      if (status.isActive === false || status.maintenanceMode === true) {
        // Show maintenance modal
        Alert.alert(
          'App Under Maintenance',
          status.maintenanceMessage || 'App is temporarily unavailable',
          [
            {
              text: 'Retry',
              onPress: () => checkAppStatus()
            }
          ]
        );
      } else {
        // App is active
        navigateToHome();
      }
    }
  } catch (error) {
    console.error('Error checking app status:', error);
  }
};
```

---

## 3. 📄 Invoice Download (User)

### Download Invoice PDF
```http
GET {BASE_URL}/api/orders/{orderId}/invoice/download?format=A4
Authorization: Bearer <user_token>
```

**Path Parameters:**
- `orderId`: MongoDB ObjectId of the order

**Query Parameters:**
- `format`: `A4` | `thermal` (default: `A4`)

**Response:**
- **Success**: PDF file download (Content-Type: application/pdf)
- **Error**: JSON error response

**Features:**
- ✅ Auto-generates invoice if not exists (same as admin panel)
- ✅ User can only download their own order invoices
- ✅ Same PDF quality as admin panel
- ✅ Both A4 and thermal receipt formats

**Usage in App:**

**Flutter:**
```dart
Future<void> downloadInvoice(String orderId, {String format = 'A4'}) async {
  try {
    final token = await getAuthToken();

    final response = await http.get(
      Uri.parse('${baseUrl}/api/orders/$orderId/invoice/download?format=$format'),
      headers: {'Authorization': 'Bearer $token'}
    );

    if (response.statusCode == 200) {
      final bytes = response.bodyBytes;
      await savePdfToDevice(bytes, 'Invoice-$orderId.pdf');
      showSuccessMessage('Invoice downloaded successfully!');
    } else {
      final error = json.decode(response.body);
      showErrorMessage(error['message'] ?? 'Download failed');
    }
  } catch (e) {
    showErrorMessage('Failed to download invoice');
  }
}
```

**React Native:**
```javascript
const downloadInvoice = async (orderId, format = 'A4') => {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${baseUrl}/api/orders/${orderId}/invoice/download?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.ok) {
      const blob = await response.blob();
      // Use react-native-fs or similar to save PDF
      const fileName = `Invoice-${orderId}.pdf`;
      await savePdfFile(blob, fileName);
      Alert.alert('Success', 'Invoice downloaded successfully!');
    } else {
      const error = await response.json();
      Alert.alert('Error', error.message || 'Download failed');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to download invoice');
  }
};
```

**Alternative Endpoint:**
```http
GET {BASE_URL}/api/invoices/order/{orderId}/download?format=A4
Authorization: Bearer <user_token>
```

---

## 4. ⚙️ Admin App Control (Admin Only)

### Get App Status (Admin)
```http
GET {BASE_URL}/api/settings/app-status
Authorization: Bearer <admin_token>
```

### Update App Status (Admin)
```http
PUT {BASE_URL}/api/settings/app-status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "isActive": false,
  "reason": "Server maintenance",
  "maintenanceMessage": "We are upgrading our servers for better performance",
  "estimatedDowntime": "2 hours"
}
```

**Request Body (all optional):**
- `isActive`: boolean - App activation status
- `reason`: string - Reason for status change
- `maintenanceMessage`: string - Message to show users
- `estimatedDowntime`: string - Expected downtime duration

**Response:**
```json
{
  "success": true,
  "message": "App status updated successfully",
  "data": {
    "appStatus": {
      "isActive": false,
      "maintenanceMode": true,
      "maintenanceMessage": "We are upgrading our servers for better performance",
      "estimatedDowntime": "2 hours",
      "reason": "Server maintenance",
      "lastUpdated": "2025-08-09T18:15:30.123Z",
      "updatedBy": "688207f40f3d6fff61e60631"
    }
  }
}
```

---

## 🔐 Authentication

All user and admin endpoints require authentication:

```http
Authorization: Bearer <jwt_token>
```

Get tokens from login endpoints:
- **User Login**: `POST /api/auth/login`
- **Admin Login**: `POST /api/auth/login` (with admin credentials)

---

## 📱 Mobile App Integration Checklist

### ✅ Social Media Section
- [ ] Fetch active social media links on app startup
- [ ] Display icons with proper click handlers
- [ ] Handle `openInNewTab` and `showOnMobile` flags
- [ ] Use `displayOrder` for proper sorting

### ✅ App Status Management
- [ ] Check app status on every app startup
- [ ] Show maintenance popup when `isActive = false`
- [ ] Display maintenance message and estimated downtime
- [ ] Implement retry mechanism for status check

### ✅ Invoice Download
- [ ] Add download button in order history
- [ ] Handle PDF file saving to device
- [ ] Show download progress indicator
- [ ] Handle error cases (no invoice, network issues)
- [ ] Support both A4 and thermal formats

### ✅ Admin Panel (if applicable)
- [ ] App activation/deactivation toggle
- [ ] Maintenance mode setup form
- [ ] Real-time status updates

---

## 🚨 Important Notes

1. **No Default Values**: All APIs return actual database values only - no dummy/fallback data
2. **Response Structure**: Standard response format maintained across all endpoints
3. **Auto Invoice Generation**: Invoice download automatically creates invoice if not exists
4. **Access Control**: Users can only access their own orders/invoices
5. **Real-time Updates**: App status changes reflect immediately in public API

---

## 🔧 Error Handling

All APIs follow standard error response format:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Detailed error messages"],
  "meta": {
    "timestamp": "2025-08-09T18:15:30.123Z",
    "request_id": "unique-request-id"
  }
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## 🧪 Quick Testing

You can test these APIs using curl commands:

```bash
# Test social media links
curl "https://server.ghanshyammurtibhandar.com/api/social-media?active=true"

# Test app status
curl "https://server.ghanshyammurtibhandar.com/api/settings/public/app-status"

# Test invoice download (requires user token)
curl -H "Authorization: Bearer YOUR_USER_TOKEN" \
  "https://server.ghanshyammurtibhandar.com/api/orders/ORDER_ID/invoice/download?format=A4" \
  --output invoice.pdf

# Test admin app control (requires admin token)
curl -X PUT "https://server.ghanshyammurtibhandar.com/api/settings/app-status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false, "reason": "Maintenance", "maintenanceMessage": "Server upgrade in progress"}'
```

---

## 📞 Support

For technical support or API issues:
- **Email**: support@ghanshyammurtibhandar.com
- **Phone**: +919876543210
- **WhatsApp**: +919876543210

---

**Document Version**: 1.0
**Last Updated**: August 9, 2025
**API Version**: 1.0
**Tested**: ✅ All endpoints verified working
