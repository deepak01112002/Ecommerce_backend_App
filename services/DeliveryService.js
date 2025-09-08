const DeliveryCompany = require('../models/DeliveryCompany');
const ShiprocketService = require('./ShiprocketService');

class DeliveryService {
    constructor() {
        this.deliveryMethod = process.env.DELIVERY_METHOD || 'manual';
    }

    /**
     * Get available delivery options for a location
     * @param {Object} location - Delivery location details
     * @param {Object} orderDetails - Order details for pricing calculation
     * @returns {Promise<Object>} Available delivery options
     */
    async getDeliveryOptions(location, orderDetails = {}) {
        const { state, city, postalCode } = location;
        const { weight = 1, codAmount = 0, orderValue = 0 } = orderDetails;

        try {
            switch (this.deliveryMethod) {
                case 'manual':
                    return this.getManualDeliveryOptions(location, orderDetails);
                
                case 'delivery_company':
                    return this.getDeliveryCompanyOptions(state, city, postalCode, weight, codAmount, orderValue);
                
                case 'shiprocket':
                    return this.getShiprocketOptions(location, orderDetails);
                
                default:
                    return this.getManualDeliveryOptions(location, orderDetails);
            }
        } catch (error) {
            console.error('Error getting delivery options:', error);
            return {
                success: false,
                error: error.message,
                options: []
            };
        }
    }

    /**
     * Get manual delivery options
     */
    async getManualDeliveryOptions(location, orderDetails) {
        const { orderValue = 0 } = orderDetails;
        const freeShippingThreshold = 500; // From system settings
        const standardShipping = 0;

        return {
            success: true,
            method: 'manual',
            options: [{
                id: 'manual_standard',
                name: 'Manual Delivery',
                type: 'standard',
                charges: orderValue >= freeShippingThreshold ? 0 : standardShipping,
                estimatedDays: 3,
                description: 'Standard manual delivery by our team',
                features: ['Cash on Delivery', 'Order Tracking', 'Customer Support']
            }]
        };
    }

    /**
     * Get delivery company options
     */
    async getDeliveryCompanyOptions(state, city, postalCode, weight, codAmount, orderValue) {
        const companies = await DeliveryCompany.findByLocation(state, city, postalCode);
        
        if (companies.length === 0) {
            // Fallback to manual delivery if no companies serve the area
            return this.getManualDeliveryOptions({ state, city, postalCode }, { weight, codAmount, orderValue });
        }

        const options = companies.map(company => {
            const charges = company.calculateCharges(weight, null, codAmount, orderValue);
            
            return {
                id: company._id.toString(),
                companyId: company._id,
                name: company.name,
                code: company.code,
                type: company.type,
                charges: charges,
                estimatedDays: company.deliveryTime.estimatedDays,
                description: `Delivery by ${company.name}`,
                features: this.getCompanyFeatures(company),
                rating: company.performance.rating,
                successRate: company.successRate,
                contact: {
                    phone: company.contactInfo.companyPhone,
                    email: company.contactInfo.companyEmail
                }
            };
        });

        return {
            success: true,
            method: 'delivery_company',
            options: options
        };
    }

    /**
     * Get Shiprocket options
     */
    async getShiprocketOptions(location, orderDetails) {
        const { postalCode: deliveryPostcode } = location;
        const { weight = 1, codAmount = 0 } = orderDetails;
        const pickupPostcode = process.env.PICKUP_POSTCODE || '110001';

        try {
            const serviceabilityResult = await ShiprocketService.checkServiceability(
                pickupPostcode,
                deliveryPostcode,
                weight,
                codAmount
            );

            if (!serviceabilityResult.success) {
                // Fallback to manual delivery
                return this.getManualDeliveryOptions(location, orderDetails);
            }

            const options = serviceabilityResult.couriers.map(courier => ({
                id: `shiprocket_${courier.courier_company_id}`,
                courierCompanyId: courier.courier_company_id,
                name: courier.courier_name,
                type: 'shiprocket',
                charges: courier.rate,
                estimatedDays: courier.estimated_delivery_days,
                description: `Delivery by ${courier.courier_name} via Shiprocket`,
                features: ['Real-time Tracking', 'Insurance Available', 'Pickup Service'],
                codAvailable: courier.cod === 1,
                rating: 4.0 // Default rating for Shiprocket couriers
            }));

            return {
                success: true,
                method: 'shiprocket',
                options: options
            };
        } catch (error) {
            console.error('Shiprocket serviceability error:', error);
            return this.getManualDeliveryOptions(location, orderDetails);
        }
    }

    /**
     * Create shipment based on delivery method
     */
    async createShipment(orderData, deliveryOption) {
        try {
            switch (this.deliveryMethod) {
                case 'manual':
                    return this.createManualShipment(orderData, deliveryOption);
                
                case 'delivery_company':
                    return this.createDeliveryCompanyShipment(orderData, deliveryOption);
                
                case 'shiprocket':
                    return this.createShiprocketShipment(orderData, deliveryOption);
                
                default:
                    return this.createManualShipment(orderData, deliveryOption);
            }
        } catch (error) {
            console.error('Error creating shipment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create manual shipment
     */
    async createManualShipment(orderData, deliveryOption) {
        const trackingNumber = this.generateTrackingNumber('MAN');
        
        return {
            success: true,
            method: 'manual',
            trackingNumber: trackingNumber,
            carrier: 'Manual Delivery',
            estimatedDelivery: this.calculateEstimatedDelivery(3),
            charges: deliveryOption.charges || 50,
            shipmentData: {
                method: 'manual',
                trackingNumber: trackingNumber,
                carrier: 'Manual Delivery Team',
                status: 'processing'
            }
        };
    }

    /**
     * Create delivery company shipment
     */
    async createDeliveryCompanyShipment(orderData, deliveryOption) {
        const company = await DeliveryCompany.findById(deliveryOption.companyId);
        
        if (!company) {
            throw new Error('Delivery company not found');
        }

        const trackingNumber = this.generateTrackingNumber(company.code);
        
        // If company has API integration, use it
        if (company.apiConfig.hasApi && company.apiConfig.isActive) {
            // TODO: Implement API integration for delivery companies
            console.log(`API integration for ${company.name} not implemented yet`);
        }

        return {
            success: true,
            method: 'delivery_company',
            companyId: company._id,
            companyName: company.name,
            trackingNumber: trackingNumber,
            carrier: company.name,
            estimatedDelivery: this.calculateEstimatedDelivery(company.deliveryTime.estimatedDays),
            charges: deliveryOption.charges,
            contact: {
                phone: company.contactInfo.companyPhone,
                email: company.contactInfo.companyEmail
            },
            shipmentData: {
                method: 'delivery_company',
                trackingNumber: trackingNumber,
                carrier: company.name,
                deliveryCompanyId: company._id,
                status: 'processing'
            }
        };
    }

    /**
     * Create Shiprocket shipment
     */
    async createShiprocketShipment(orderData, deliveryOption) {
        // Use existing Shiprocket service
        const shiprocketResult = await ShiprocketService.createOrder(orderData);
        
        if (!shiprocketResult.success) {
            throw new Error(shiprocketResult.error);
        }

        return {
            success: true,
            method: 'shiprocket',
            shiprocketOrderId: shiprocketResult.shiprocketOrderId,
            shiprocketShipmentId: shiprocketResult.shipmentId,
            trackingNumber: shiprocketResult.awbCode,
            carrier: shiprocketResult.courierName,
            courierCompanyId: shiprocketResult.courierCompanyId,
            charges: deliveryOption.charges,
            shipmentData: {
                method: 'shiprocket',
                trackingNumber: shiprocketResult.awbCode,
                carrier: shiprocketResult.courierName,
                shiprocketOrderId: shiprocketResult.shiprocketOrderId,
                shiprocketShipmentId: shiprocketResult.shipmentId,
                courierCompanyId: shiprocketResult.courierCompanyId,
                status: 'processing'
            }
        };
    }

    /**
     * Track shipment based on method
     */
    async trackShipment(trackingNumber, method = null) {
        const detectedMethod = method || this.detectMethodFromTracking(trackingNumber);
        
        switch (detectedMethod) {
            case 'manual':
                return this.trackManualShipment(trackingNumber);
            
            case 'delivery_company':
                return this.trackDeliveryCompanyShipment(trackingNumber);
            
            case 'shiprocket':
                return ShiprocketService.trackShipment(trackingNumber);
            
            default:
                return {
                    success: false,
                    error: 'Unable to determine tracking method'
                };
        }
    }

    /**
     * Helper methods
     */
    generateTrackingNumber(prefix = 'TRK') {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${timestamp.slice(-6)}${random}`;
    }

    calculateEstimatedDelivery(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date;
    }

    detectMethodFromTracking(trackingNumber) {
        if (trackingNumber.startsWith('MAN')) return 'manual';
        if (trackingNumber.length === 12 && /^[A-Z0-9]+$/.test(trackingNumber)) return 'shiprocket';
        return 'delivery_company';
    }

    getCompanyFeatures(company) {
        const features = [];
        if (company.services.codAvailable) features.push('Cash on Delivery');
        if (company.services.trackingAvailable) features.push('Order Tracking');
        if (company.services.expressDelivery) features.push('Express Delivery');
        if (company.services.sameDay) features.push('Same Day Delivery');
        if (company.services.returnService) features.push('Return Service');
        if (company.services.insuranceAvailable) features.push('Insurance Available');
        return features;
    }

    trackManualShipment(trackingNumber) {
        // Manual tracking - basic implementation
        return {
            success: true,
            trackingNumber: trackingNumber,
            status: 'in_transit',
            statusHistory: [
                {
                    status: 'order_placed',
                    timestamp: new Date(),
                    location: 'Warehouse',
                    description: 'Order placed and being prepared'
                }
            ]
        };
    }

    trackDeliveryCompanyShipment(trackingNumber) {
        // Delivery company tracking - basic implementation
        return {
            success: true,
            trackingNumber: trackingNumber,
            status: 'in_transit',
            statusHistory: [
                {
                    status: 'picked_up',
                    timestamp: new Date(),
                    location: 'Origin',
                    description: 'Package picked up by delivery partner'
                }
            ]
        };
    }

    /**
     * Get current delivery method
     */
    getCurrentMethod() {
        return this.deliveryMethod;
    }

    /**
     * Set delivery method
     */
    setDeliveryMethod(method) {
        if (['manual', 'delivery_company', 'shiprocket'].includes(method)) {
            this.deliveryMethod = method;
            return true;
        }
        return false;
    }
}

module.exports = new DeliveryService();
