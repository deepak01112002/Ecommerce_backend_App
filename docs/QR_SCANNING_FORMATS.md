# QR Code Scanning Formats Documentation

## Overview

The QR code scanning system provides different formatted responses based on the viewer type:
- **Admin View**: Comprehensive details with analytics and management information
- **Public View**: Customer-friendly format with shopping-focused information

## API Endpoint

```
POST /api/qr-codes/scan
```

### Request Body
```json
{
  "qrData": "{\"type\":\"product\",\"id\":\"product_id_here\"}",
  "viewType": "admin" // or "public"
}
```

## Response Formats

### 1. Product Scanning

#### Admin View Response
```json
{
  "success": true,
  "message": "Product details retrieved successfully",
  "type": "product",
  "viewType": "admin",
  "data": {
    "id": "688bbdec362503685d9225b2",
    "name": "Ganesh Murti",
    "description": "Beautiful Ganesh statue",
    "slug": "ganesh-murti",
    "sku": "GM001",
    "price": 250,
    "discountPrice": 200,
    "originalPrice": 300,
    "discountPercentage": 20,
    "category": {
      "_id": "68845d5a10cebc7513135c10",
      "name": "Metal",
      "slug": "metal"
    },
    "images": ["image_url_1", "image_url_2"],
    "specifications": {
      "material": "Marble",
      "height": "12",
      "weight": "4.5",
      "finish": "gold"
    },
    "stock": 120,
    "isActive": true,
    "isFeatured": true,
    "isBestseller": false,
    "isNewArrival": true,
    "rating": 4.5,
    "reviewCount": 25,
    "salesCount": 150,
    "viewCount": 1200,
    "adminInfo": {
      "totalRevenue": "₹30,000",
      "profitMargin": "20%",
      "stockStatus": "Good Stock",
      "lastUpdated": "2025-07-31T19:03:08.081Z"
    }
  }
}
```

#### Public View Response
```json
{
  "success": true,
  "message": "Product details retrieved successfully",
  "type": "product",
  "viewType": "public",
  "data": {
    "id": "688bbdec362503685d9225b2",
    "name": "Ganesh Murti",
    "description": "Beautiful Ganesh statue",
    "price": 250,
    "discountPrice": 200,
    "category": {
      "name": "Metal",
      "slug": "metal"
    },
    "images": ["image_url_1", "image_url_2"],
    "specifications": {
      "material": "Marble",
      "height": "12",
      "weight": "4.5"
    },
    "availability": "In Stock",
    "stockStatus": "available",
    "rating": 4.5,
    "reviewCount": 25,
    "isFeatured": true,
    "minOrderQuantity": 1,
    "maxOrderQuantity": 10,
    "customerInfo": {
      "savings": "₹50.00 saved",
      "deliveryInfo": "Free delivery on orders above ₹500",
      "returnPolicy": "7-day return policy",
      "warranty": "Standard warranty applies"
    }
  }
}
```

### 2. Category Scanning

#### Admin View Response
```json
{
  "success": true,
  "message": "Category details retrieved successfully",
  "type": "category",
  "viewType": "admin",
  "data": {
    "id": "68845d5a10cebc7513135c10",
    "name": "Metal",
    "description": "Metal religious items",
    "slug": "metal",
    "image": "category_image_url",
    "isActive": true,
    "productsCount": 25,
    "featuredProductsCount": 8,
    "sampleProducts": [
      {
        "id": "product_id",
        "name": "Product Name",
        "price": 100,
        "discountPrice": 80,
        "images": ["image_url"],
        "rating": 4.2,
        "isFeatured": true
      }
    ],
    "adminInfo": {
      "averagePrice": "₹185.50",
      "categoryPerformance": "Good",
      "lastUpdated": "2025-07-31T19:03:08.081Z",
      "status": "Active"
    }
  }
}
```

#### Public View Response
```json
{
  "success": true,
  "message": "Category details retrieved successfully",
  "type": "category",
  "viewType": "public",
  "data": {
    "id": "68845d5a10cebc7513135c10",
    "name": "Metal",
    "description": "Metal religious items",
    "image": "category_image_url",
    "productsCount": 25,
    "featuredProductsCount": 8,
    "sampleProducts": [
      {
        "id": "product_id",
        "name": "Product Name",
        "price": 100,
        "discountPrice": 80,
        "images": ["image_url"],
        "rating": 4.2,
        "isFeatured": true,
        "savings": "₹20.00 off"
      }
    ],
    "customerInfo": {
      "totalProducts": "25 products available",
      "featuredProducts": "8 featured items",
      "shopNow": "Browse all products in this category",
      "offers": "Special discounts available on selected items"
    }
  }
}
```

## Access Methods

### 1. Admin Panel Scanner
- **Location**: Available in admin panel sidebar
- **Access**: Click "QR Scanner" button
- **View Type**: Automatically set to "admin"
- **Features**: 
  - Comprehensive product/category analytics
  - Stock management information
  - Revenue and profit data
  - Performance metrics

### 2. Public QR Scanner Page
- **URL**: `http://localhost:8080/api/qr-codes/scanner`
- **Access**: Public webpage, no authentication required
- **View Type**: Automatically set to "public"
- **Features**:
  - Customer-friendly product information
  - Shopping-focused details
  - Pricing and availability
  - Delivery and return policies

## QR Code Data Format

QR codes contain JSON data in the following format:

### Product QR Code
```json
{
  "type": "product",
  "id": "product_mongodb_id"
}
```

### Category QR Code
```json
{
  "type": "category",
  "id": "category_mongodb_id"
}
```

## Key Differences Between Views

| Feature | Admin View | Public View |
|---------|------------|-------------|
| **Product Info** | Complete details + analytics | Customer-focused essentials |
| **Pricing** | All price fields + profit margins | Customer pricing + savings |
| **Stock** | Exact numbers + status | Availability status only |
| **Analytics** | Revenue, margins, performance | None |
| **Management** | SKU, admin timestamps | None |
| **Customer Info** | None | Delivery, returns, warranty |
| **Category Products** | Up to 20 products | Up to 8 products |

## Error Handling

The system handles various error scenarios:

### Invalid QR Data
```json
{
  "success": false,
  "message": "Invalid QR code format"
}
```

### Missing QR Data
```json
{
  "success": false,
  "message": "QR data is required"
}
```

### Product/Category Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

## Usage Examples

### Admin Panel Usage
1. Click "QR Scanner" in admin sidebar
2. Paste QR code data from phone scan
3. View comprehensive admin analytics
4. Use data for inventory management

### Public/Customer Usage
1. Visit public scanner page
2. Scan QR code with phone camera
3. Copy QR data to scanner
4. View customer-friendly product details
5. Get shopping information and policies

This dual-format system ensures that both administrators and customers get the most relevant information for their needs when scanning QR codes.
