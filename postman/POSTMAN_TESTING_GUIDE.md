# 🧪 POSTMAN TESTING GUIDE - CONTABO STORAGE APIS

## 📋 COMPLETE TESTING SETUP

### **🚀 Quick Setup (3 Steps):**

#### **Step 1: Import Collection**
1. Open Postman
2. Click **Import** button
3. Select file: `Contabo_Storage_APIs.postman_collection.json`
4. Click **Import**

#### **Step 2: Import Environment**
1. Click **Environments** tab
2. Click **Import** button  
3. Select file: `Contabo_Environment.postman_environment.json`
4. Click **Import**
5. Select **"🌐 Contabo Storage Environment"** from dropdown

#### **Step 3: Start Testing**
1. Make sure your backend server is running on port 8080
2. Start with **"Get Storage Info"** to verify setup
3. Test upload APIs with actual image files

---

## 🔐 AUTHENTICATION SETUP

### **Admin Token (Already Configured):**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2JkOTdkMzU0ODQ3NDk0NmRkOWY2YyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzEyNDExNywiZXhwIjoxNzUzNzI4OTE3fQ.6RiSm_fw_XV9VmTZoQam4IDVPhBJCBFDvNlFi35ok8o
```

### **If Token Expires:**
1. Use **"Admin Login"** request
2. Copy new token from response
3. Update `admin_token` in environment variables

---

## 🧪 TESTING WORKFLOW

### **🔍 Phase 1: Basic Verification**
```
1. ✅ Check Server Health
2. ✅ Get Storage Info  
3. ✅ Test Contabo Connection (will fail with dummy credentials - expected)
4. ✅ Get Admin Dashboard Stats
```

### **📤 Phase 2: Upload Testing**
```
1. ✅ Upload Single Image
   - Select any image file (JPG, PNG, GIF, WebP)
   - Check response for Contabo URL
   
2. ✅ Upload Multiple Images
   - Select 2-3 image files
   - Verify all files uploaded
   
3. ✅ Upload Product Images
   - Select main + gallery images
   - Check main/gallery separation
   
4. ✅ Upload Category Image
   - Select category image
   - Verify proper folder structure
```

### **🗑️ Phase 3: Delete Testing**
```
1. ✅ Delete Single Image
   - Use URL from upload response
   - Verify deletion success
   
2. ✅ Delete Multiple Images
   - Use multiple URLs from uploads
   - Verify batch deletion
```

### **📦 Phase 4: Integration Testing**
```
1. ✅ Create Product with Images
   - Fill product details
   - Upload product images
   - Verify product created with Contabo URLs
   
2. ✅ Update Product with Images
   - Update existing product
   - Upload new images
   - Verify old images replaced
   
3. ✅ Create Category with Image
   - Fill category details
   - Upload category image
   - Verify category created
   
4. ✅ Create Review with Images
   - Fill review details
   - Upload review images
   - Verify review created
```

---

## 📝 TESTING CHECKLIST

### **✅ Before Testing:**
- [ ] Backend server running on port 8080
- [ ] MongoDB connected
- [ ] Postman collection imported
- [ ] Environment variables set
- [ ] Test image files ready (JPG, PNG, GIF, WebP)

### **✅ Upload API Tests:**
- [ ] Single image upload works
- [ ] Multiple images upload works
- [ ] Product images upload works
- [ ] Category image upload works
- [ ] File validation works (try invalid file types)
- [ ] Size validation works (try large files)

### **✅ Integration Tests:**
- [ ] Product creation with images works
- [ ] Product update with images works
- [ ] Category creation with images works
- [ ] Category update with images works
- [ ] Review creation with images works
- [ ] Review update with images works

### **✅ Response Verification:**
- [ ] All responses have proper JSON structure
- [ ] Image URLs are Contabo URLs (not local paths)
- [ ] File names follow naming convention
- [ ] Folder structure is correct (products/, categories/, reviews/)
- [ ] Error handling works properly

---

## 🔧 TROUBLESHOOTING

### **❌ Common Issues & Solutions:**

#### **1. Server Not Running:**
```
Error: "Could not get any response"
Solution: Start backend server with `npm start`
```

#### **2. Authentication Failed:**
```
Error: "Unauthorized" or "Invalid token"
Solution: Use "Admin Login" to get new token
```

#### **3. File Upload Failed:**
```
Error: "Only image files are allowed"
Solution: Use JPG, PNG, GIF, or WebP files only
```

#### **4. Contabo Connection Failed:**
```
Error: "getaddrinfo ENOTFOUND"
Solution: Expected with dummy credentials - will work with real credentials
```

#### **5. Product/Category Not Found:**
```
Error: "Product not found" or "Category not found"
Solution: Update product_id/category_id in environment variables
```

---

## 📊 EXPECTED RESPONSES

### **✅ Storage Info Response:**
```json
{
  "success": true,
  "data": {
    "provider": "Contabo Object Storage",
    "endpoint": "https://eu-central-1.contabostorage.com",
    "bucket": "ecommerce-images",
    "region": "eu-central-1",
    "maxFileSize": "5MB",
    "allowedTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"]
  }
}
```

### **✅ Upload Success Response:**
```json
{
  "success": true,
  "data": {
    "file": {
      "fileName": "products/1703123456789-a1b2c3d4-test-image.jpg",
      "url": "https://eu-central-1.contabostorage.com/ecommerce-images/products/1703123456789-a1b2c3d4-test-image.jpg",
      "size": 245760,
      "mimeType": "image/jpeg"
    }
  }
}
```

### **✅ Product Creation Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "...",
      "name": "Test Product with Contabo Images",
      "images": [
        "https://eu-central-1.contabostorage.com/ecommerce-images/products/image1.jpg",
        "https://eu-central-1.contabostorage.com/ecommerce-images/products/image2.jpg"
      ]
    }
  }
}
```

---

## 🎯 SUCCESS CRITERIA

### **✅ All Tests Pass When:**
1. **Server Health:** Returns "OK" status
2. **Storage Info:** Returns Contabo configuration
3. **Upload APIs:** Return Contabo URLs (not local paths)
4. **Integration APIs:** Create/update with Contabo images
5. **Error Handling:** Proper error messages for invalid inputs
6. **File Validation:** Rejects non-image files
7. **Size Validation:** Rejects files > 5MB
8. **Authentication:** Requires admin token for all operations

### **✅ Image URLs Should:**
- Start with: `https://eu-central-1.contabostorage.com/ecommerce-images/`
- Include folder: `products/`, `categories/`, `reviews/`, or `uploads/`
- Have format: `{timestamp}-{random}-{clean-name}.{ext}`
- Be publicly accessible (when real credentials are used)

---

## 🎉 TESTING COMPLETE!

**Bhai, ab aap easily sab APIs test kar sakte hain:**

### **✅ Ready to Test:**
- **25+ API Endpoints** - Complete coverage
- **File Upload Testing** - All image types
- **Integration Testing** - Products, Categories, Reviews
- **Error Testing** - Validation and authentication
- **Real Scenarios** - Complete user workflows

### **✅ Production Verification:**
- **Pure Contabo Integration** - No multer dependencies
- **Cloud Storage** - All images on Contabo
- **Proper URLs** - CDN-ready image URLs
- **Error Handling** - Robust validation

**Import karo aur test karo - sab kuch ready hai! 🚀**
