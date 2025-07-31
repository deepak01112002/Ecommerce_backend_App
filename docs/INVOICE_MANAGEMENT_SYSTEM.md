# Invoice Management System Documentation

## Overview

The Invoice Management System provides comprehensive invoice generation, management, and printing capabilities for the Ghanshyam Murti Bhandar ecommerce platform. It supports both standard A4 invoices and thermal printer (4x6 inch) formats with complete GST compliance.

## Features

### 1. Invoice Generation
- **Automatic Generation**: Invoices are automatically generated from orders
- **GST Compliance**: Full GST calculation with CGST, SGST, and IGST support
- **Multiple Formats**: Standard A4 and thermal printer (4x6 inch) formats
- **PDF Generation**: High-quality PDF invoices with company branding
- **Barcode Support**: Order tracking barcodes for thermal prints

### 2. Invoice Formats

#### Standard A4 Invoice
- Professional layout matching Amazon invoice format
- Company details with GST registration
- Customer billing and shipping addresses
- Itemized product table with specifications
- Tax calculations (CGST, SGST, IGST)
- Amount in words conversion
- Payment transaction details
- Authorized signatory section

#### Thermal Printer (4x6 inch)
- Compact format optimized for thermal printers
- Essential order information
- Customer details
- Item summary with totals
- Payment method
- Order barcode for tracking
- AWB code integration

### 3. Admin Panel Integration

#### Order Table Enhancements
- **View Button**: Opens order bill in modal format
- **Fixed Total Amount**: Proper calculation from order.pricing.total
- **Print Options**: Both A4 and thermal print support
- **Download PDF**: Direct PDF download functionality

#### Order Bill Modal Features
- **Exact Amazon Format**: Matches provided invoice layout
- **Product Specifications**: Displays height, weight, material, finish
- **GST Calculations**: Automatic 18% GST with breakdown
- **Payment Details**: Transaction ID and payment method
- **Print Controls**: Separate buttons for A4 and thermal printing
- **Responsive Design**: Works on all screen sizes

## API Endpoints

### Enhanced Invoice Routes

#### Generate Invoice from Order
```
POST /api/invoices/enhanced/generate/:orderId
```
**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```
**Body:**
```json
{
  "generatePDF": true,
  "thermalFormat": false
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "_id": "invoice_id",
      "invoiceNumber": "IN-202507-0001",
      "orderNumber": "ORD2507260001",
      "customerName": "John Doe",
      "total": 2360,
      "status": "sent",
      "createdAt": "2025-07-26T10:30:00Z",
      "pdfUrl": "/uploads/invoices/invoice-IN-202507-0001.pdf",
      "thermalPrintUrl": null
    }
  }
}
```

#### Get All Invoices
```
GET /api/invoices/enhanced/all?page=1&limit=20&status=sent&search=john
```
**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Get Single Invoice
```
GET /api/invoices/enhanced/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "_id": "invoice_id",
      "invoiceNumber": "IN-202507-0001",
      "order": {...},
      "customerDetails": {...},
      "companyDetails": {...},
      "items": [...],
      "pricing": {...},
      "paymentDetails": {...},
      "taxDetails": {...}
    }
  }
}
```

## Database Schema

### Invoice Model Structure
```javascript
{
  invoiceNumber: "IN-202507-0001", // Auto-generated
  order: ObjectId, // Reference to Order
  customerDetails: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+91-9876543210",
    address: "Complete address",
    gstin: "", // Customer GSTIN if available
    stateCode: "36"
  },
  companyDetails: {
    name: "GHANSHYAM MURTI BHANDAR",
    address: "Complete company address",
    phone: "+91-9876543210",
    email: "info@ghanshyammurtibhandar.com",
    gstin: "24BYAPD0171N1ZP",
    pan: "BYAPD0171N",
    stateCode: "24"
  },
  items: [{
    product: ObjectId,
    name: "Product Name",
    description: "Material: Brass, Height: 12 inches, Weight: 2 kg",
    hsnCode: "9999",
    quantity: 1,
    unit: "PCS",
    rate: 2000,
    discount: 0,
    taxableAmount: 2000,
    gstRate: 18,
    cgst: 180, // Central GST
    sgst: 180, // State GST
    igst: 0,   // Inter-state GST
    totalAmount: 2360
  }],
  pricing: {
    subtotal: 2000,
    cgst: 180,
    sgst: 180,
    igst: 0,
    shipping: 0,
    discount: 0,
    grandTotal: 2360
  },
  paymentDetails: {
    method: "razorpay",
    status: "paid",
    paidAmount: 2360,
    balanceAmount: 0,
    paymentDate: "2025-07-26T10:30:00Z",
    transactionId: "pay_xyz123"
  },
  taxDetails: {
    placeOfSupply: "GUJARAT",
    isInterState: false,
    reverseCharge: false,
    taxType: "GST"
  },
  status: "sent", // draft, sent, paid, cancelled, refunded
  pdfUrl: "/uploads/invoices/invoice-IN-202507-0001.pdf",
  thermalPrintUrl: "/uploads/invoices/thermal/thermal-invoice-IN-202507-0001.pdf"
}
```

## File Structure

### Backend Files
```
App_Backend/
├── controllers/
│   ├── invoiceController.js (Legacy)
│   └── invoiceManagementController.js (Enhanced)
├── models/
│   └── Invoice.js
├── routes/
│   └── invoiceRoutes.js (Enhanced with new endpoints)
├── uploads/
│   └── invoices/
│       ├── *.pdf (Standard invoices)
│       └── thermal/
│           └── *.pdf (Thermal invoices)
└── docs/
    └── INVOICE_MANAGEMENT_SYSTEM.md
```

### Frontend Files
```
Application_Admin/
├── components/
│   └── orders/
│       ├── order-table.tsx (Enhanced)
│       └── order-bill-modal.tsx (New)
├── app/
│   └── orders/
│       └── page.tsx (Enhanced)
└── lib/
    └── services.ts (Invoice services)
```

## Invoice Numbering System

### Format: `IN-YYYYMM-NNNN`
- **IN**: Invoice prefix
- **YYYY**: Current year (2025)
- **MM**: Current month (01-12)
- **NNNN**: Sequential number (0001, 0002, etc.)

### Examples:
- `IN-202507-0001` - First invoice of July 2025
- `IN-202507-0002` - Second invoice of July 2025
- `IN-202508-0001` - First invoice of August 2025

## Thermal Printer Setup

### Supported Printers
- Any ESC/POS compatible thermal printer
- 4x6 inch (102mm x 152mm) paper size
- USB or Network connectivity

### Print Settings
- **Paper Size**: 4 inches x 6 inches
- **Resolution**: 203 DPI
- **Font**: Courier New (monospace)
- **Margins**: 0.1 inch all sides
- **Orientation**: Portrait

### Browser Print Setup
1. Set paper size to 4x6 inches in browser print settings
2. Remove headers and footers
3. Set margins to minimum
4. Use "More settings" → "Paper size" → "Custom" → 4x6 inches

## Invoice Management Workflow

### 1. Order Completion
- Customer places order and payment is processed
- Order status changes to "confirmed" or "processing"
- Admin can generate invoice from order details

### 2. Invoice Generation
- Admin clicks "View" button in orders table
- Order bill modal opens with complete invoice format
- Admin can print (A4 or thermal) or download PDF

### 3. Invoice Storage
- All invoices are stored in database with complete details
- PDF files are generated and stored in uploads/invoices/
- Thermal format PDFs stored in uploads/invoices/thermal/

### 4. Invoice Tracking
- Each invoice has unique number for tracking
- Status tracking: draft → sent → paid → completed
- Payment status: pending → paid → partial → overdue

### 5. Reporting & Analytics
- Monthly invoice summaries
- GST reports for tax filing
- Customer invoice history
- Payment tracking and follow-ups

## GST Compliance Features

### Tax Calculations
- **CGST**: 9% (Central GST) for intra-state transactions
- **SGST**: 9% (State GST) for intra-state transactions  
- **IGST**: 18% (Integrated GST) for inter-state transactions
- **HSN Codes**: Product-wise HSN classification

### GST Reports
- Monthly GST summary
- GSTR-1 data preparation
- Tax liability calculations
- Input tax credit tracking

### Compliance Documents
- GST registration number display
- PAN number inclusion
- State code identification
- Place of supply declaration

## Testing & Quality Assurance

### Test Scenarios
1. **Order to Invoice Flow**: Complete order → invoice generation
2. **PDF Generation**: Both A4 and thermal formats
3. **Print Testing**: Actual printer compatibility
4. **GST Calculations**: Verify tax amounts
5. **Data Accuracy**: Customer and product details
6. **File Storage**: PDF file generation and storage

### Quality Checks
- Invoice number uniqueness
- Tax calculation accuracy
- Customer data completeness
- Product specification display
- Payment information accuracy
- Barcode generation for thermal prints

## Maintenance & Support

### Regular Tasks
- Monthly invoice number sequence reset
- PDF file cleanup (archive old files)
- Database optimization
- Printer maintenance
- GST rate updates

### Troubleshooting
- **PDF Generation Issues**: Check file permissions and disk space
- **Print Problems**: Verify printer drivers and paper size
- **Tax Calculation Errors**: Update GST rates in system
- **Missing Data**: Ensure order completion before invoice generation

## Future Enhancements

### Planned Features
1. **Email Integration**: Automatic invoice sending to customers
2. **WhatsApp Integration**: Invoice sharing via WhatsApp
3. **Bulk Operations**: Generate multiple invoices at once
4. **Custom Templates**: Multiple invoice design templates
5. **Multi-language Support**: Hindi and Gujarati invoice formats
6. **Digital Signatures**: Electronic signature integration
7. **QR Code Payments**: UPI payment QR codes on invoices
8. **Inventory Integration**: Real-time stock updates from invoices

This comprehensive invoice management system ensures professional invoice generation, complete GST compliance, and seamless integration with the existing ecommerce platform.
