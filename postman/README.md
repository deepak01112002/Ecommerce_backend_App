# 🚀 Contabo Storage API Testing

## 📋 Overview

This folder contains Postman collection and environment files for testing the Contabo Object Storage integration. The implementation is 100% multer-free, using pure Contabo cloud storage for all image uploads.

## 📁 Files

- **`Contabo_Storage_APIs.postman_collection.json`** - Complete API collection
- **`Contabo_Environment.postman_environment.json`** - Environment variables
- **`POSTMAN_TESTING_GUIDE.md`** - Detailed testing instructions

## 🔧 Quick Setup

1. Import both files into Postman
2. Select the "🌐 Contabo Storage Environment" environment
3. Start testing with "Get Storage Info" request

## 🧪 Testing Categories

The collection includes:

- **🔐 Authentication** - Admin login
- **📤 Upload Management APIs** - All upload/delete operations
- **📦 Product APIs** - Create/update with images
- **📂 Category APIs** - Create/update with images
- **⭐ Review APIs** - Create/update with images
- **🔍 Testing & Verification** - Health checks and verification

## 🔑 Authentication

The collection is pre-configured with an admin token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2JkOTdkMzU0ODQ3NDk0NmRkOWY2YyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MzEyNDExNywiZXhwIjoxNzUzNzI4OTE3fQ.6RiSm_fw_XV9VmTZoQam4IDVPhBJCBFDvNlFi35ok8o
```

If the token expires, use the "Admin Login" request to get a new one.

## 📝 Important Notes

1. **Server** - Make sure your backend server is running on port 8080
2. **Images** - Use real image files for testing (JPG, PNG, GIF, WebP)
3. **Credentials** - The Contabo connection test will fail with dummy credentials (expected)
4. **IDs** - Update product_id, category_id in environment if needed

## 🎯 Expected Results

- All upload APIs should return Contabo URLs (not local paths)
- URLs should follow pattern: `https://eu-central-1.contabostorage.com/ecommerce-images/folder/filename.ext`
- File validation should reject non-image files
- Size validation should reject files > 5MB

## 📚 For More Details

See the `POSTMAN_TESTING_GUIDE.md` file for comprehensive testing instructions.

## 🚀 Command Line Testing

For basic API testing without file uploads, you can also use the `test_apis.sh` script in the root directory:

```bash
./test_apis.sh
```
