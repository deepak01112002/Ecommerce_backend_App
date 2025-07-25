const axios = require('axios');
const Shipment = require('../models/Shipment');
const ShipmentTracking = require('../models/ShipmentTracking');

class ShiprocketService {
    constructor() {
        this.baseURL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
        this.email = process.env.SHIPROCKET_EMAIL;
        this.password = process.env.SHIPROCKET_PASSWORD;
        this.token = null;
        this.tokenExpiry = null;
    }

    // Authenticate with Shiprocket
    async authenticate() {
        try {
            if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
                return this.token;
            }

            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email: this.email,
                password: this.password
            });

            if (response.data && response.data.token) {
                this.token = response.data.token;
                // Token expires in 10 days, set expiry to 9 days for safety
                this.tokenExpiry = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
                return this.token;
            }

            throw new Error('Authentication failed');
        } catch (error) {
            console.error('Shiprocket authentication error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with Shiprocket');
        }
    }

    // Make authenticated API request
    async makeRequest(method, endpoint, data = null) {
        try {
            const token = await this.authenticate();
            
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`Shiprocket API error (${method} ${endpoint}):`, error.response?.data || error.message);
            throw error;
        }
    }

    // Create order in Shiprocket
    async createOrder(orderData) {
        try {
            const shiprocketOrderData = {
                order_id: orderData.orderNumber,
                order_date: orderData.orderDate || new Date().toISOString().split('T')[0],
                pickup_location: orderData.pickupLocation || "Primary",
                channel_id: orderData.channelId || "",
                comment: orderData.comment || "",
                billing_customer_name: orderData.billingAddress.name,
                billing_last_name: orderData.billingAddress.lastName || "",
                billing_address: orderData.billingAddress.address,
                billing_address_2: orderData.billingAddress.address2 || "",
                billing_city: orderData.billingAddress.city,
                billing_pincode: orderData.billingAddress.pincode,
                billing_state: orderData.billingAddress.state,
                billing_country: orderData.billingAddress.country,
                billing_email: orderData.billingAddress.email || "",
                billing_phone: orderData.billingAddress.phone,
                shipping_is_billing: orderData.shippingIsBilling || true,
                shipping_customer_name: orderData.shippingAddress.name,
                shipping_last_name: orderData.shippingAddress.lastName || "",
                shipping_address: orderData.shippingAddress.address,
                shipping_address_2: orderData.shippingAddress.address2 || "",
                shipping_city: orderData.shippingAddress.city,
                shipping_pincode: orderData.shippingAddress.pincode,
                shipping_country: orderData.shippingAddress.country,
                shipping_state: orderData.shippingAddress.state,
                shipping_email: orderData.shippingAddress.email || "",
                shipping_phone: orderData.shippingAddress.phone,
                order_items: orderData.items.map(item => ({
                    name: item.name,
                    sku: item.sku || item.name.replace(/\s+/g, '-').toLowerCase(),
                    units: item.units,
                    selling_price: item.sellingPrice,
                    discount: item.discount || 0,
                    tax: item.tax || 0,
                    hsn: item.hsn || ""
                })),
                payment_method: orderData.paymentMethod, // "Prepaid" or "COD"
                shipping_charges: orderData.shippingCharges || 0,
                giftwrap_charges: orderData.giftwrapCharges || 0,
                transaction_charges: orderData.transactionCharges || 0,
                total_discount: orderData.totalDiscount || 0,
                sub_total: orderData.subTotal,
                length: orderData.dimensions?.length || 10,
                breadth: orderData.dimensions?.breadth || 10,
                height: orderData.dimensions?.height || 10,
                weight: orderData.dimensions?.weight || 0.5
            };

            const response = await this.makeRequest('POST', '/orders/create/adhoc', shiprocketOrderData);
            
            if (response && response.order_id) {
                return {
                    success: true,
                    shiprocketOrderId: response.order_id,
                    shipmentId: response.shipment_id,
                    status: response.status,
                    statusCode: response.status_code,
                    onboardingCompletedNow: response.onboarding_completed_now,
                    awbCode: response.awb_code,
                    courierCompanyId: response.courier_company_id,
                    courierName: response.courier_name,
                    response: response
                };
            }

            throw new Error('Invalid response from Shiprocket');
        } catch (error) {
            console.error('Create order error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                response: error.response?.data
            };
        }
    }

    // Generate AWB (Air Waybill)
    async generateAWB(shipmentId, courierCompanyId) {
        try {
            const response = await this.makeRequest('POST', '/courier/assign/awb', {
                shipment_id: shipmentId,
                courier_company_id: courierCompanyId
            });

            return {
                success: true,
                awbCode: response.awb_code,
                courierName: response.courier_name,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Get courier serviceability
    async checkServiceability(pickupPostcode, deliveryPostcode, weight, codAmount = 0) {
        try {
            const response = await this.makeRequest('GET', 
                `/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weight}&cod=${codAmount > 0 ? 1 : 0}`
            );

            return {
                success: true,
                couriers: response.data?.available_courier_companies || [],
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Track shipment
    async trackShipment(awbCode) {
        try {
            const response = await this.makeRequest('GET', `/courier/track/awb/${awbCode}`);
            
            if (response && response.tracking_data) {
                return {
                    success: true,
                    trackingData: response.tracking_data,
                    response: response
                };
            }

            return {
                success: false,
                error: 'No tracking data found'
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Cancel shipment
    async cancelShipment(awbCodes) {
        try {
            const awbArray = Array.isArray(awbCodes) ? awbCodes : [awbCodes];
            
            const response = await this.makeRequest('POST', '/orders/cancel', {
                awbs: awbArray
            });

            return {
                success: true,
                message: response.message,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Generate pickup request
    async generatePickup(shipmentIds, pickupDate) {
        try {
            const response = await this.makeRequest('POST', '/courier/generate/pickup', {
                shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds],
                pickup_date: pickupDate
            });

            return {
                success: true,
                pickupStatus: response.pickup_status,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Get order details
    async getOrderDetails(orderId) {
        try {
            const response = await this.makeRequest('GET', `/orders/show/${orderId}`);
            
            return {
                success: true,
                order: response.data,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Generate manifest
    async generateManifest(shipmentIds) {
        try {
            const response = await this.makeRequest('POST', '/manifests/generate', {
                shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds]
            });

            return {
                success: true,
                manifestUrl: response.manifest_url,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Generate invoice
    async generateInvoice(orderIds) {
        try {
            const response = await this.makeRequest('POST', '/orders/print/invoice', {
                ids: Array.isArray(orderIds) ? orderIds : [orderIds]
            });

            return {
                success: true,
                invoiceUrl: response.invoice_url,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Generate label
    async generateLabel(shipmentIds) {
        try {
            const response = await this.makeRequest('POST', '/orders/print/label', {
                shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds]
            });

            return {
                success: true,
                labelUrl: response.label_url,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Process webhook data
    async processWebhook(webhookData) {
        try {
            const { awb, current_status, status_date, courier_name, shipment_id } = webhookData;
            
            // Find shipment
            const shipment = await Shipment.findOne({ awbCode: awb });
            if (!shipment) {
                console.log(`Shipment not found for AWB: ${awb}`);
                return { success: false, error: 'Shipment not found' };
            }

            // Create or update tracking
            await ShipmentTracking.createOrUpdateTracking({
                shipment: shipment._id,
                order: shipment.order,
                awbCode: awb,
                courierName: courier_name,
                status: current_status,
                statusDate: new Date(status_date),
                location: webhookData.location,
                remarks: webhookData.remarks,
                activity: webhookData.activity,
                deliveryBoy: webhookData.delivery_boy ? {
                    name: webhookData.delivery_boy.name,
                    phone: webhookData.delivery_boy.phone
                } : undefined,
                webhookData: webhookData,
                source: 'webhook'
            });

            return { success: true, message: 'Webhook processed successfully' };
        } catch (error) {
            console.error('Webhook processing error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new ShiprocketService();
