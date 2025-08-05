const cron = require('node-cron');
const delhiveryService = require('./delhiveryService');

class DelhiveryAutoSyncService {
    constructor() {
        this.isRunning = false;
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.syncStats = {
            totalSynced: 0,
            totalErrors: 0,
            lastSyncDuration: 0
        };
    }

    // Start automatic syncing every 30 minutes
    start() {
        if (this.isRunning) {
            console.log('⚠️ Delhivery auto-sync is already running');
            return;
        }

        console.log('🚀 Starting Delhivery auto-sync service...');
        
        // Run every 30 minutes
        this.syncInterval = cron.schedule('*/30 * * * *', async () => {
            await this.performSync();
        }, {
            scheduled: false
        });

        this.syncInterval.start();
        this.isRunning = true;
        
        console.log('✅ Delhivery auto-sync service started (runs every 30 minutes)');
        
        // Run initial sync after 2 minutes
        setTimeout(() => {
            this.performSync();
        }, 2 * 60 * 1000);
    }

    // Stop automatic syncing
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Delhivery auto-sync is not running');
            return;
        }

        if (this.syncInterval) {
            this.syncInterval.stop();
            this.syncInterval = null;
        }

        this.isRunning = false;
        console.log('🛑 Delhivery auto-sync service stopped');
    }

    // Perform the actual sync
    async performSync() {
        if (!this.isRunning) return;

        const startTime = Date.now();
        console.log('🔄 Starting automatic Delhivery sync...');

        try {
            // Get Order model dynamically to avoid circular dependencies
            const getOrderModel = () => {
                try {
                    return require('../models/Order');
                } catch (error) {
                    console.error('Error loading Order model:', error);
                    return null;
                }
            };

            const Order = getOrderModel();
            if (!Order) {
                console.error('❌ Could not load Order model for auto-sync');
                return;
            }

            // Find all orders with Delhivery delivery method and real tracking numbers
            const delhiveryOrders = await Order.find({
                'shipping.deliveryMethod': 'delhivery',
                'shipping.trackingNumber': { 
                    $exists: true, 
                    $ne: null,
                    $not: /^MOCK_/ // Exclude mock tracking numbers
                },
                status: { $nin: ['delivered', 'cancelled'] }
            }).populate('user', 'firstName lastName email phone');

            console.log(`📦 Found ${delhiveryOrders.length} Delhivery orders to auto-sync`);

            if (delhiveryOrders.length === 0) {
                console.log('✅ No Delhivery orders to sync');
                this.lastSyncTime = new Date();
                return;
            }

            let syncedCount = 0;
            let errorCount = 0;

            // Sync each order with rate limiting (1 request per second)
            for (let i = 0; i < delhiveryOrders.length; i++) {
                const order = delhiveryOrders[i];
                
                try {
                    console.log(`🔄 Auto-syncing order ${order.orderNumber} (${i + 1}/${delhiveryOrders.length})`);
                    
                    // Get tracking info from Delhivery
                    const trackingResult = await delhiveryService.trackShipment(order.shipping.trackingNumber);
                    
                    if (trackingResult.success) {
                        const trackingData = trackingResult.data;
                        
                        // Update order with latest tracking info
                        order.shipping.delhiveryStatus = trackingData.status;
                        order.shipping.currentLocation = trackingData.currentLocation;
                        order.shipping.estimatedDelivery = trackingData.estimatedDelivery;
                        order.shipping.lastTracked = new Date();
                        
                        // Update order status based on Delhivery status
                        if (trackingData.status.toLowerCase().includes('delivered')) {
                            order.status = 'delivered';
                            order.deliveredAt = new Date();
                        } else if (trackingData.status.toLowerCase().includes('out for delivery')) {
                            order.status = 'shipped';
                        } else if (trackingData.status.toLowerCase().includes('in transit')) {
                            order.status = 'shipped';
                        }
                        
                        await order.save();
                        syncedCount++;
                        
                        console.log(`✅ Auto-synced ${order.orderNumber}: ${trackingData.status}`);
                    } else {
                        console.log(`⚠️ Failed to auto-sync ${order.orderNumber}: ${trackingResult.error}`);
                        errorCount++;
                    }
                } catch (error) {
                    console.error(`❌ Error auto-syncing order ${order.orderNumber}:`, error);
                    errorCount++;
                }

                // Rate limiting: wait 1 second between requests
                if (i < delhiveryOrders.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            const duration = Date.now() - startTime;
            this.syncStats = {
                totalSynced: this.syncStats.totalSynced + syncedCount,
                totalErrors: this.syncStats.totalErrors + errorCount,
                lastSyncDuration: duration
            };

            this.lastSyncTime = new Date();

            console.log(`🎯 Auto-sync complete: ${syncedCount}/${delhiveryOrders.length} orders synced in ${duration}ms`);
            console.log(`📊 Total stats: ${this.syncStats.totalSynced} synced, ${this.syncStats.totalErrors} errors`);

        } catch (error) {
            console.error('❌ Error in automatic Delhivery sync:', error);
        }
    }

    // Get sync status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastSyncTime: this.lastSyncTime,
            stats: this.syncStats
        };
    }

    // Manual sync trigger
    async triggerManualSync() {
        console.log('🔄 Manual Delhivery sync triggered');
        await this.performSync();
    }
}

module.exports = new DelhiveryAutoSyncService();
