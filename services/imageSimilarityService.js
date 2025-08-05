const sharp = require('sharp');
const crypto = require('crypto');

class ImageSimilarityService {
    constructor() {
        // Configuration for perceptual hashing
        this.hashSize = 8; // 8x8 grid for perceptual hash
        this.thumbnailSize = 32; // Resize to 32x32 for processing
    }

    /**
     * Generate perceptual hash for an image
     * This creates a hash that's similar for visually similar images
     */
    async generatePerceptualHash(imageBuffer) {
        try {
            // Step 1: Resize image to small fixed size and convert to grayscale
            const resized = await sharp(imageBuffer)
                .resize(this.thumbnailSize, this.thumbnailSize, { 
                    fit: 'fill',
                    kernel: sharp.kernel.nearest 
                })
                .grayscale()
                .raw()
                .toBuffer();

            // Step 2: Calculate average pixel value
            let sum = 0;
            for (let i = 0; i < resized.length; i++) {
                sum += resized[i];
            }
            const average = sum / resized.length;

            // Step 3: Create hash by comparing each pixel to average
            let hash = '';
            for (let i = 0; i < resized.length; i++) {
                hash += resized[i] >= average ? '1' : '0';
            }

            // Step 4: Convert binary string to hexadecimal for storage efficiency
            const hexHash = this.binaryToHex(hash);

            return {
                success: true,
                hash: hexHash,
                binaryHash: hash
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate multiple hash variants for better matching
     */
    async generateMultipleHashes(imageBuffer) {
        try {
            const hashes = {};

            // Standard perceptual hash
            const standardHash = await this.generatePerceptualHash(imageBuffer);
            if (standardHash.success) {
                hashes.standard = standardHash.hash;
            }

            // Rotated versions for rotation-invariant matching
            const rotations = [90, 180, 270];
            for (const rotation of rotations) {
                const rotated = await sharp(imageBuffer)
                    .rotate(rotation)
                    .toBuffer();
                
                const rotatedHash = await this.generatePerceptualHash(rotated);
                if (rotatedHash.success) {
                    hashes[`rotated_${rotation}`] = rotatedHash.hash;
                }
            }

            // Flipped versions
            const flipped = await sharp(imageBuffer)
                .flip()
                .toBuffer();
            
            const flippedHash = await this.generatePerceptualHash(flipped);
            if (flippedHash.success) {
                hashes.flipped = flippedHash.hash;
            }

            const flopped = await sharp(imageBuffer)
                .flop()
                .toBuffer();
            
            const floppedHash = await this.generatePerceptualHash(flopped);
            if (floppedHash.success) {
                hashes.flopped = floppedHash.hash;
            }

            return {
                success: true,
                hashes
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate Hamming distance between two binary hashes
     * Lower distance means more similar images
     */
    calculateHammingDistance(hash1, hash2) {
        if (hash1.length !== hash2.length) {
            throw new Error('Hash lengths must be equal');
        }

        let distance = 0;
        for (let i = 0; i < hash1.length; i++) {
            if (hash1[i] !== hash2[i]) {
                distance++;
            }
        }

        return distance;
    }

    /**
     * Calculate similarity percentage between two hashes
     */
    calculateSimilarity(hash1, hash2) {
        try {
            // Convert hex hashes back to binary for comparison
            const binary1 = this.hexToBinary(hash1);
            const binary2 = this.hexToBinary(hash2);

            const distance = this.calculateHammingDistance(binary1, binary2);
            const maxDistance = binary1.length;
            const similarity = ((maxDistance - distance) / maxDistance) * 100;

            return Math.round(similarity * 100) / 100; // Round to 2 decimal places
        } catch (error) {
            return 0;
        }
    }

    /**
     * Find similar images based on hash comparison
     */
    findSimilarHashes(targetHash, hashList, threshold = 85) {
        const similarities = [];

        for (const item of hashList) {
            // Check against all hash variants
            let maxSimilarity = 0;
            let bestMatchType = 'standard';

            // Compare with standard hash
            if (item.hashes && item.hashes.standard) {
                const similarity = this.calculateSimilarity(targetHash, item.hashes.standard);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestMatchType = 'standard';
                }
            }

            // Compare with rotated versions
            if (item.hashes) {
                for (const [key, hash] of Object.entries(item.hashes)) {
                    if (key !== 'standard') {
                        const similarity = this.calculateSimilarity(targetHash, hash);
                        if (similarity > maxSimilarity) {
                            maxSimilarity = similarity;
                            bestMatchType = key;
                        }
                    }
                }
            }

            if (maxSimilarity >= threshold) {
                similarities.push({
                    ...item,
                    similarity: maxSimilarity,
                    matchType: bestMatchType
                });
            }
        }

        // Sort by similarity (highest first)
        return similarities.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Convert binary string to hexadecimal
     */
    binaryToHex(binary) {
        let hex = '';
        for (let i = 0; i < binary.length; i += 4) {
            const chunk = binary.substr(i, 4);
            const decimal = parseInt(chunk, 2);
            hex += decimal.toString(16);
        }
        return hex;
    }

    /**
     * Convert hexadecimal string to binary
     */
    hexToBinary(hex) {
        let binary = '';
        for (let i = 0; i < hex.length; i++) {
            const decimal = parseInt(hex[i], 16);
            binary += decimal.toString(2).padStart(4, '0');
        }
        return binary;
    }

    /**
     * Generate color histogram for additional matching
     */
    async generateColorHistogram(imageBuffer) {
        try {
            // Resize and get RGB values
            const { data, info } = await sharp(imageBuffer)
                .resize(16, 16)
                .raw()
                .toBuffer({ resolveWithObject: true });

            const histogram = {
                red: new Array(256).fill(0),
                green: new Array(256).fill(0),
                blue: new Array(256).fill(0)
            };

            // Count pixel values
            for (let i = 0; i < data.length; i += 3) {
                histogram.red[data[i]]++;
                histogram.green[data[i + 1]]++;
                histogram.blue[data[i + 2]]++;
            }

            return {
                success: true,
                histogram
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Compare color histograms
     */
    compareColorHistograms(hist1, hist2) {
        let correlation = 0;
        const channels = ['red', 'green', 'blue'];

        for (const channel of channels) {
            let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;

            for (let i = 0; i < 256; i++) {
                sum1 += hist1[channel][i];
                sum2 += hist2[channel][i];
                sum1Sq += hist1[channel][i] * hist1[channel][i];
                sum2Sq += hist2[channel][i] * hist2[channel][i];
                pSum += hist1[channel][i] * hist2[channel][i];
            }

            const num = pSum - (sum1 * sum2 / 256);
            const den = Math.sqrt((sum1Sq - sum1 * sum1 / 256) * (sum2Sq - sum2 * sum2 / 256));

            if (den === 0) {
                correlation += 0;
            } else {
                correlation += num / den;
            }
        }

        return (correlation / 3) * 100; // Average across channels, convert to percentage
    }

    /**
     * Comprehensive image analysis combining multiple techniques
     */
    async analyzeImage(imageBuffer) {
        try {
            const results = {};

            // Generate perceptual hashes
            const hashResult = await this.generateMultipleHashes(imageBuffer);
            if (hashResult.success) {
                results.hashes = hashResult.hashes;
            }

            // Generate color histogram
            const histogramResult = await this.generateColorHistogram(imageBuffer);
            if (histogramResult.success) {
                results.colorHistogram = histogramResult.histogram;
            }

            // Get basic image metadata
            const metadata = await sharp(imageBuffer).metadata();
            results.metadata = {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                aspectRatio: metadata.width / metadata.height
            };

            return {
                success: true,
                analysis: results
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const imageSimilarityService = new ImageSimilarityService();

module.exports = imageSimilarityService;
