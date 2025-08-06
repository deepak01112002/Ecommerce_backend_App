# User Invoice Download API Guide

This guide explains how to use the new user-side invoice download APIs that allow users to download invoices for their orders using the same format as the admin panel.

## Overview

The system now provides user-friendly APIs that allow authenticated users to:
1. View their invoices
2. Get invoice details by order ID
3. Download invoice PDFs in both A4 and thermal formats
4. Download invoices directly from order endpoints

## API Endpoints

### 1. Get User's Invoices

```
GET /api/invoices/my-invoices
```

**Authentication:** Required (User token)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 50)
- `status` (optional): Filter by invoice status (`draft`, `sent`, `paid`, `cancelled`, `refunded`)
- `paymentStatus` (optional): Filter by payment status (`pending`, `paid`, `partial`, `overdue`, `cancelled`)

**Response:**
```json
{
  "success": true,
  "message": "User invoices retrieved successfully",
  "data": {
    "invoices": [
      {
        "_id": "invoice_id",
        "invoiceNumber": "INV-202507-0001",
        "invoiceDate": "2025-07-26T10:30:00Z",
        "orderNumber": "ORD2507260001",
        "status": "paid",
        "paymentStatus": "paid",
        "amount": 2360
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Invoice by Order ID

```
GET /api/invoices/order/:orderId
```

**Authentication:** Required (User token)

**Parameters:**
- `orderId`: MongoDB ObjectId of the order

**Response:**
```json
{
  "success": true,
  "message": "Invoice retrieved successfully",
  "data": {
    "invoice": {
      "_id": "invoice_id",
      "invoiceNumber": "INV-202507-0001",
      "invoiceDate": "2025-07-26T10:30:00Z",
      "dueDate": "2025-08-25T10:30:00Z",
      "status": "paid",
      "paymentDetails": {
        "method": "online",
        "status": "paid",
        "paidAmount": 2360,
        "balanceAmount": 0
      },
      "customerDetails": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+919876543210",
        "address": "123 Main St, City"
      },
      "companyDetails": {
        "name": "Ghanshyam Murti Bhandar",
        "address": "Religious Items Store",
        "phone": "+919876543210",
        "email": "support@ghanshyammurtibhandar.com",
        "gstin": "GST123456789"
      },
      "items": [
        {
          "product": "product_id",
          "name": "Ganesh Murti",
          "quantity": 2,
          "rate": 1000,
          "taxableAmount": 2000,
          "gstRate": 18,
          "cgst": 180,
          "sgst": 180,
          "totalAmount": 2360
        }
      ],
      "pricing": {
        "subtotal": 2000,
        "totalGST": 360,
        "grandTotal": 2360
      },
      "qrCode": "upi://pay?pa=merchant@upi&pn=Ghanshyam%20Murti%20Bhandar&am=2360&tn=Invoice%20INV-202507-0001"
    }
  }
}
```

### 3. Download Invoice PDF by Order ID

```
GET /api/invoices/order/:orderId/download
```

**Authentication:** Required (User token)

**Parameters:**
- `orderId`: MongoDB ObjectId of the order

**Query Parameters:**
- `format` (optional): PDF format (`A4` or `thermal`, default: `A4`)

**Response:** PDF file download

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Invoice-INV-202507-0001.pdf"`

### 4. Download Invoice from Order Endpoint

```
GET /api/orders/:orderId/invoice/download
```

**Authentication:** Required (User token)

**Parameters:**
- `orderId`: MongoDB ObjectId of the order

**Query Parameters:**
- `format` (optional): PDF format (`A4` or `thermal`, default: `A4`)

**Response:** PDF file download

## System Settings Integration

The invoice download functionality respects the system settings:

### Check if Invoice Download is Enabled

```
GET /api/settings/public/invoice-settings
```

**Authentication:** Not required

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
    }
  }
}
```

## Error Responses

### Common Error Codes

- `400`: Invalid request parameters
- `401`: Authentication required
- `403`: Invoice download disabled or access denied
- `404`: Order/Invoice not found
- `500`: Server error during PDF generation

### Example Error Response

```json
{
  "success": false,
  "message": "Order not found or access denied",
  "errors": [],
  "statusCode": 404
}
```

## Usage Examples

### Frontend Integration

```javascript
// Get user's invoices
const getUserInvoices = async (page = 1, limit = 20) => {
  const response = await fetch(`/api/invoices/my-invoices?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Download invoice by order ID
const downloadInvoice = async (orderId, format = 'A4') => {
  const response = await fetch(`/api/invoices/order/${orderId}/download?format=${format}`, {
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${orderId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// Check if invoice download is enabled
const checkInvoiceSettings = async () => {
  const response = await fetch('/api/settings/public/invoice-settings');
  const data = await response.json();
  return data.data.invoiceSettings.downloadEnabled;
};
```

## Security Features

1. **User Authentication**: All endpoints require valid user authentication
2. **Order Ownership**: Users can only access invoices for their own orders
3. **System Settings**: Respects global invoice download enable/disable setting
4. **Input Validation**: All parameters are validated for security
5. **Error Handling**: Secure error messages without sensitive information exposure

## PDF Formats

### A4 Format
- Standard business invoice format
- Suitable for printing and official records
- Includes company logo, detailed item breakdown, GST details
- Professional layout with proper spacing

### Thermal Format
- Optimized for thermal printers (58mm width)
- Compact layout for quick printing
- Essential information only
- Suitable for receipts and quick references

## Integration with Admin Panel

The user-side APIs use the same PDF generation logic as the admin panel, ensuring:
- Consistent invoice formatting
- Same company branding and details
- Identical tax calculations
- Unified invoice numbering system
