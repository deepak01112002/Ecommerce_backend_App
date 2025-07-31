const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Generate QR code for a category
const generateCategoryQR = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findById(categoryId);
        
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const qrData = JSON.stringify({
            type: 'category',
            id: category._id,
            name: category.name,
            description: category.description,
            url: `https://ghanshyammurtibhandar.com/category/${category._id}`,
            companyName: 'GHANSHYAM MURTI BHANDAR'
        });

        // Generate QR code as data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Also save as file
        const filename = `category-qr-${category._id}.png`;
        const filepath = path.join(__dirname, '../uploads/qr-codes/categories', filename);
        
        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Convert data URL to buffer and save
        const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
        fs.writeFileSync(filepath, qrBuffer);

        res.json({
            success: true,
            category: {
                id: category._id,
                name: category.name
            },
            qrCode: {
                dataURL: qrCodeDataURL,
                filePath: `/uploads/qr-codes/categories/${filename}`,
                downloadUrl: `${req.protocol}://${req.get('host')}/uploads/qr-codes/categories/${filename}`
            }
        });

    } catch (error) {
        console.error('Error generating category QR code:', error);
        res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
    }
};

// Generate QR code for a product
const generateProductQR = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).populate('category');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const qrData = JSON.stringify({
            type: 'product',
            id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category?.name || 'Uncategorized',
            specifications: product.specifications || {},
            url: `https://ghanshyammurtibhandar.com/product/${product._id}`,
            companyName: 'GHANSHYAM MURTI BHANDAR'
        });

        // Generate QR code as data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Also save as file
        const filename = `product-qr-${product._id}.png`;
        const filepath = path.join(__dirname, '../uploads/qr-codes/products', filename);
        
        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Convert data URL to buffer and save
        const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
        fs.writeFileSync(filepath, qrBuffer);

        res.json({
            success: true,
            product: {
                id: product._id,
                name: product.name,
                price: product.price
            },
            qrCode: {
                dataURL: qrCodeDataURL,
                filePath: `/uploads/qr-codes/products/${filename}`,
                downloadUrl: `${req.protocol}://${req.get('host')}/uploads/qr-codes/products/${filename}`
            }
        });

    } catch (error) {
        console.error('Error generating product QR code:', error);
        res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
    }
};

// Generate QR codes for all categories
const generateAllCategoryQRs = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const results = [];

        for (const category of categories) {
            try {
                const qrData = JSON.stringify({
                    type: 'category',
                    id: category._id,
                    name: category.name,
                    description: category.description,
                    url: `https://ghanshyammurtibhandar.com/category/${category._id}`,
                    companyName: 'GHANSHYAM MURTI BHANDAR'
                });

                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                const filename = `category-qr-${category._id}.png`;
                const filepath = path.join(__dirname, '../uploads/qr-codes/categories', filename);
                
                // Ensure directory exists
                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
                fs.writeFileSync(filepath, qrBuffer);

                results.push({
                    category: {
                        id: category._id,
                        name: category.name
                    },
                    qrCode: {
                        filePath: `/uploads/qr-codes/categories/${filename}`,
                        downloadUrl: `${req.protocol}://${req.get('host')}/uploads/qr-codes/categories/${filename}`
                    }
                });

            } catch (error) {
                console.error(`Error generating QR for category ${category._id}:`, error);
                results.push({
                    category: {
                        id: category._id,
                        name: category.name
                    },
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Generated QR codes for ${results.filter(r => !r.error).length} categories`,
            results
        });

    } catch (error) {
        console.error('Error generating category QR codes:', error);
        res.status(500).json({ message: 'Failed to generate QR codes', error: error.message });
    }
};

// Generate QR codes for all products
const generateAllProductQRs = async (req, res) => {
    try {
        const products = await Product.find({ isActive: true }).populate('category');
        const results = [];

        for (const product of products) {
            try {
                const qrData = JSON.stringify({
                    type: 'product',
                    id: product._id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category?.name || 'Uncategorized',
                    specifications: product.specifications || {},
                    url: `https://ghanshyammurtibhandar.com/product/${product._id}`,
                    companyName: 'GHANSHYAM MURTI BHANDAR'
                });

                const qrCodeDataURL = await QRCode.toDataURL(qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });

                const filename = `product-qr-${product._id}.png`;
                const filepath = path.join(__dirname, '../uploads/qr-codes/products', filename);
                
                // Ensure directory exists
                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');
                fs.writeFileSync(filepath, qrBuffer);

                results.push({
                    product: {
                        id: product._id,
                        name: product.name,
                        price: product.price
                    },
                    qrCode: {
                        filePath: `/uploads/qr-codes/products/${filename}`,
                        downloadUrl: `${req.protocol}://${req.get('host')}/uploads/qr-codes/products/${filename}`
                    }
                });

            } catch (error) {
                console.error(`Error generating QR for product ${product._id}:`, error);
                results.push({
                    product: {
                        id: product._id,
                        name: product.name
                    },
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `Generated QR codes for ${results.filter(r => !r.error).length} products`,
            results
        });

    } catch (error) {
        console.error('Error generating product QR codes:', error);
        res.status(500).json({ message: 'Failed to generate QR codes', error: error.message });
    }
};

// Scan QR code and get details with different formats for admin vs public
const scanQRCode = async (req, res) => {
    try {
        const { qrData, viewType = 'public' } = req.body; // viewType: 'admin' or 'public'

        if (!qrData) {
            return res.status(400).json({
                success: false,
                message: 'QR data is required'
            });
        }

        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code format'
            });
        }

        const { type, id } = parsedData;

        if (!type || !id) {
            return res.status(400).json({
                success: false,
                message: 'QR code missing required data'
            });
        }

        let result;
        if (type === 'product') {
            const product = await Product.findById(id).populate('category', 'name description slug');
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (viewType === 'admin') {
                // Admin view - comprehensive details
                result = {
                    type: 'product',
                    viewType: 'admin',
                    data: {
                        id: product._id,
                        name: product.name,
                        description: product.description,
                        slug: product.slug,
                        sku: product.sku,
                        price: product.price,
                        discountPrice: product.discountPrice,
                        originalPrice: product.originalPrice,
                        discountPercentage: product.discountPercentage,
                        category: product.category,
                        images: product.images,
                        specifications: product.specifications,
                        stock: product.stock,
                        minOrderQuantity: product.minOrderQuantity,
                        maxOrderQuantity: product.maxOrderQuantity,
                        isActive: product.isActive,
                        isFeatured: product.isFeatured,
                        isBestseller: product.isBestseller,
                        isNewArrival: product.isNewArrival,
                        tags: product.tags,
                        rating: product.rating,
                        reviewCount: product.reviewCount,
                        salesCount: product.salesCount,
                        viewCount: product.viewCount,
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt,
                        adminInfo: {
                            totalRevenue: product.salesCount * (product.discountPrice || product.price),
                            profitMargin: product.discountPrice ?
                                ((product.price - product.discountPrice) / product.price * 100).toFixed(2) + '%' : '0%',
                            stockStatus: product.stock > 10 ? 'Good Stock' :
                                        product.stock > 0 ? 'Low Stock' : 'Out of Stock',
                            lastUpdated: product.updatedAt
                        }
                    }
                };
            } else {
                // Public/Customer view - customer-friendly format
                result = {
                    type: 'product',
                    viewType: 'public',
                    data: {
                        id: product._id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        discountPrice: product.discountPrice,
                        originalPrice: product.originalPrice,
                        discountPercentage: product.discountPercentage,
                        category: {
                            name: product.category?.name,
                            slug: product.category?.slug
                        },
                        images: product.images,
                        specifications: product.specifications,
                        availability: (product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock',
                        stockStatus: (product.stock || 0) > 0 ? 'available' : 'unavailable',
                        rating: product.rating || 0,
                        reviewCount: product.reviewCount || 0,
                        isFeatured: product.isFeatured,
                        isBestseller: product.isBestseller,
                        isNewArrival: product.isNewArrival,
                        tags: product.tags,
                        minOrderQuantity: product.minOrderQuantity || 1,
                        maxOrderQuantity: product.maxOrderQuantity || 10,
                        customerInfo: {
                            savings: product.discountPrice ?
                                `₹${(product.price - product.discountPrice).toFixed(2)} saved` : null,
                            deliveryInfo: 'Free delivery on orders above ₹500',
                            returnPolicy: '7-day return policy',
                            warranty: product.specifications?.warranty || 'Standard warranty applies'
                        }
                    }
                };
            }
        } else if (type === 'category') {
            const category = await Category.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            // Get products in this category
            const products = await Product.find({ category: id, isActive: true })
                .select('name price discountPrice images rating reviewCount isFeatured')
                .limit(viewType === 'admin' ? 20 : 8);

            const totalProducts = await Product.countDocuments({ category: id, isActive: true });
            const featuredProducts = await Product.countDocuments({ category: id, isActive: true, isFeatured: true });

            if (viewType === 'admin') {
                // Admin view - comprehensive category analytics
                const avgPrice = await Product.aggregate([
                    { $match: { category: category._id, isActive: true } },
                    { $group: { _id: null, avgPrice: { $avg: '$price' } } }
                ]);

                result = {
                    type: 'category',
                    viewType: 'admin',
                    data: {
                        id: category._id,
                        name: category.name,
                        description: category.description,
                        slug: category.slug,
                        image: category.image,
                        isActive: category.isActive,
                        createdAt: category.createdAt,
                        updatedAt: category.updatedAt,
                        productsCount: totalProducts,
                        featuredProductsCount: featuredProducts,
                        sampleProducts: products,
                        adminInfo: {
                            averagePrice: avgPrice[0]?.avgPrice ? `₹${avgPrice[0].avgPrice.toFixed(2)}` : 'N/A',
                            categoryPerformance: featuredProducts > 0 ? 'Good' : 'Needs Attention',
                            lastUpdated: category.updatedAt,
                            status: category.isActive ? 'Active' : 'Inactive'
                        }
                    }
                };
            } else {
                // Public/Customer view - customer-friendly category display
                result = {
                    type: 'category',
                    viewType: 'public',
                    data: {
                        id: category._id,
                        name: category.name,
                        description: category.description,
                        image: category.image,
                        productsCount: totalProducts,
                        featuredProductsCount: featuredProducts,
                        sampleProducts: products.map(product => ({
                            id: product._id,
                            name: product.name,
                            price: product.price,
                            discountPrice: product.discountPrice,
                            images: product.images,
                            rating: product.rating || 0,
                            reviewCount: product.reviewCount || 0,
                            isFeatured: product.isFeatured,
                            savings: product.discountPrice ?
                                `₹${(product.price - product.discountPrice).toFixed(2)} off` : null
                        })),
                        customerInfo: {
                            totalProducts: `${totalProducts} products available`,
                            featuredProducts: `${featuredProducts} featured items`,
                            shopNow: 'Browse all products in this category',
                            offers: 'Special discounts available on selected items'
                        }
                    }
                };
            }
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid QR code type'
            });
        }

        res.json({
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} details retrieved successfully`,
            ...result
        });

    } catch (error) {
        console.error('Error scanning QR code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to scan QR code',
            error: error.message
        });
    }
};

module.exports = {
    generateCategoryQR,
    generateProductQR,
    generateAllCategoryQRs,
    generateAllProductQRs,
    scanQRCode
};
