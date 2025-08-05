# Image Search API Documentation

## Overview

The Image Search API provides Google Lens-like functionality for your ecommerce platform, allowing users to search for similar products by uploading images. The system uses perceptual hashing and advanced image analysis techniques to find visually similar products.

## Features

- **Multiple Input Methods**: Support for file uploads, image URLs, and base64 encoded images
- **Perceptual Hashing**: Advanced image similarity detection using multiple hash variants
- **Rotation Invariant**: Finds similar images even when rotated or flipped
- **Color Analysis**: Additional matching using color histograms
- **Flexible Search Parameters**: Configurable similarity thresholds and filters
- **Performance Optimized**: Efficient database indexing and batch processing
- **Admin Tools**: Hash generation and system statistics

## API Endpoints

### 1. Search by Image
**POST** `/api/image-search/search`

Search for similar products using an uploaded image.

#### Request Methods

**Method 1: File Upload (multipart/form-data)**
```bash
curl -X POST http://localhost:8080/api/image-search/search \
  -F "image=@/path/to/image.jpg" \
  -G -d "threshold=60" -d "limit=20"
```

**Method 2: Image URL (JSON)**
```bash
curl -X POST http://localhost:8080/api/image-search/search \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg"
  }' \
  -G -d "threshold=60" -d "limit=20"
```

**Method 3: Base64 Image (JSON)**
```bash
curl -X POST http://localhost:8080/api/image-search/search \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  }' \
  -G -d "threshold=60" -d "limit=20"
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | number | 60 | Minimum similarity percentage (0-100) |
| `limit` | number | 20 | Maximum number of results (1-100) |
| `category` | string | - | Filter by category ID |
| `minPrice` | number | - | Minimum price filter |
| `maxPrice` | number | - | Maximum price filter |
| `includeInactive` | boolean | false | Include inactive products |

#### Response

```json
{
  "success": true,
  "message": "Found 5 similar products",
  "data": {
    "results": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Red Cotton T-Shirt",
        "price": 29.99,
        "originalPrice": 39.99,
        "images": ["https://example.com/image1.jpg"],
        "category": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Clothing"
        },
        "similarity": 87.5,
        "bestMatch": {
          "imageUrl": "https://example.com/image1.jpg",
          "matchType": "standard"
        }
      }
    ],
    "searchInfo": {
      "totalProducts": 1500,
      "similarProducts": 5,
      "threshold": 60,
      "processingTime": "245ms",
      "uploadedImageInfo": {
        "hasMultipleHashes": true,
        "hashTypes": ["standard", "rotated_90", "rotated_180", "rotated_270", "flipped", "flopped"]
      }
    }
  }
}
```

### 2. Generate Product Hashes
**POST** `/api/image-search/products/:productId/generate-hashes`

Generate and store image hashes for a specific product (Admin only).

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `forceRegenerate` | boolean | false | Force regeneration of existing hashes |

#### Response
```json
{
  "success": true,
  "message": "Generated hashes for 3 images",
  "data": {
    "productId": "507f1f77bcf86cd799439011",
    "productName": "Red Cotton T-Shirt",
    "processedImages": 3,
    "totalImages": 3,
    "errors": []
  }
}
```

### 3. Get Search Statistics
**GET** `/api/image-search/stats`

Get system statistics and hash coverage (Admin only).

#### Headers
```
Authorization: Bearer <admin_jwt_token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalProducts": 1500,
      "productsWithHashes": 1200,
      "hashCoverage": 80.0,
      "readyForSearch": true
    },
    "recentActivity": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "productName": "Red Cotton T-Shirt",
        "lastHashGenerated": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### 4. Demo Endpoint
**POST** `/api/image-search/demo`

Demo endpoint for testing the API functionality.

#### Response
```json
{
  "success": true,
  "message": "Image Search API Demo",
  "data": {
    "info": "This is a demo endpoint. To use the actual search functionality:",
    "steps": [
      "1. First, generate hashes for your products using POST /api/image-search/products/{productId}/generate-hashes",
      "2. Then use POST /api/image-search/search to find similar products",
      "3. Check system status with GET /api/image-search/stats"
    ],
    "supportedFormats": ["JPEG/JPG", "PNG", "WebP", "GIF", "BMP", "TIFF"],
    "inputMethods": [
      "File upload (multipart/form-data)",
      "Image URL (JSON body with imageUrl)",
      "Base64 encoded image (JSON body with imageBase64)"
    ]
  }
}
```

### 5. Health Check
**GET** `/api/image-search/health`

Check if the Image Search API is running.

#### Response
```json
{
  "success": true,
  "message": "Image Search API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Setup and Configuration

### 1. Generate Hashes for Existing Products

Before using the search functionality, you need to generate hashes for your existing products:

```bash
# Generate hashes for all products
node scripts/generateImageHashes.js all

# Generate hashes with custom settings
node scripts/generateImageHashes.js all --force --batch=5 --concurrent=2

# Generate hashes for specific products
node scripts/generateImageHashes.js products 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012
```

### 2. Test the API

Run the comprehensive test suite:

```bash
node scripts/testImageSearchAPI.js
```

## How It Works

### Perceptual Hashing

The system uses perceptual hashing to create fingerprints of images that remain similar even when the image is:
- Resized
- Compressed
- Slightly modified
- Rotated or flipped

### Multiple Hash Variants

For better matching accuracy, the system generates multiple hash variants:
- **Standard**: Basic perceptual hash
- **Rotated**: Hashes for 90°, 180°, 270° rotations
- **Flipped**: Vertical flip hash
- **Flopped**: Horizontal flip hash

### Color Analysis

Additional matching using color histograms to improve accuracy for products with distinctive color patterns.

### Similarity Calculation

Similarity is calculated using Hamming distance between hashes, converted to a percentage:
- **90-100%**: Nearly identical images
- **80-89%**: Very similar images
- **70-79%**: Similar images
- **60-69%**: Somewhat similar images
- **Below 60%**: Different images

## Performance Considerations

### Database Indexing

The system creates optimized indexes for:
- Image hash fields
- Product categories
- Active status

### Batch Processing

Hash generation supports:
- Configurable batch sizes
- Concurrent processing limits
- Progress tracking
- Error handling

### Caching

Consider implementing caching for:
- Frequently searched images
- Popular product results
- Hash generation results

## Error Handling

### Common Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Invalid image format, missing parameters, or validation errors |
| 401 | Unauthorized | Missing or invalid authentication token (admin endpoints) |
| 404 | Not Found | Product not found (hash generation) |
| 413 | Payload Too Large | Image file exceeds 10MB limit |
| 500 | Internal Server Error | Server-side processing errors |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)",
  "errors": [
    {
      "field": "threshold",
      "message": "Threshold must be a number between 0 and 100"
    }
  ]
}
```

## Integration Examples

### Android Integration

```java
// Using OkHttp for file upload
RequestBody requestBody = new MultipartBody.Builder()
    .setType(MultipartBody.FORM)
    .addFormDataPart("image", "photo.jpg",
        RequestBody.create(MediaType.parse("image/jpeg"), imageFile))
    .build();

Request request = new Request.Builder()
    .url("http://your-api.com/api/image-search/search?threshold=60&limit=10")
    .post(requestBody)
    .build();
```

### React/JavaScript Integration

```javascript
// File upload
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/image-search/search?threshold=60&limit=10', {
  method: 'POST',
  body: formData
});

// URL-based search
const response = await fetch('/api/image-search/search?threshold=60&limit=10', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg'
  })
});
```

## Monitoring and Maintenance

### Regular Tasks

1. **Monitor Hash Coverage**: Ensure new products get hashes generated
2. **Performance Monitoring**: Track search response times
3. **Storage Management**: Monitor database size growth
4. **Error Tracking**: Monitor failed hash generations

### Recommended Monitoring

- Hash coverage percentage (target: >80%)
- Average search response time (target: <2 seconds)
- Failed hash generation rate (target: <5%)
- API error rate (target: <1%)

## Troubleshooting

### Common Issues

1. **No Search Results**: Check if products have generated hashes
2. **Slow Performance**: Reduce batch size or concurrent processing
3. **High Memory Usage**: Limit image sizes and concurrent operations
4. **Hash Generation Failures**: Check image URLs and network connectivity

### Debug Commands

```bash
# Check hash coverage
node -e "
const mongoose = require('mongoose');
const Product = require('./models/Product');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const total = await Product.countDocuments({images: {\$ne: []}});
  const withHashes = await Product.countDocuments({imageHashes: {\$ne: []}});
  console.log(\`Coverage: \${withHashes}/\${total} (\${(withHashes/total*100).toFixed(1)}%)\`);
  process.exit(0);
});
"
```

## Security Considerations

- File upload size limits (10MB)
- Image format validation
- Rate limiting on search endpoints
- Admin authentication for management endpoints
- Input sanitization for URLs and base64 data

## Future Enhancements

- Machine learning-based similarity scoring
- Category-specific similarity models
- Real-time hash generation on product creation
- Advanced filtering options
- Similarity clustering and recommendations
