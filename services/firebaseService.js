const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You need to download the actual service account JSON file from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
// For now, we'll use environment variables or initialize without service account for testing

let firebaseInitialized = false;

try {
  // Try to initialize with service account if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || "ghanshyammurtibhandar-f5ced"
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized with service account');
  } else {
    // Initialize with project ID only for testing
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "ghanshyammurtibhandar-f5ced"
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized with project ID only (limited functionality)');
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  console.log('Firebase notifications will be disabled');
}

class FirebaseService {
  constructor() {
    try {
      this.messaging = firebaseInitialized ? admin.messaging() : null;
    } catch (error) {
      console.error('Failed to initialize Firebase messaging:', error.message);
      this.messaging = null;
    }
  }

  // Check if Firebase is properly initialized
  isInitialized() {
    return this.messaging !== null;
  }

  // Send notification to a single device
  async sendToDevice(token, notification, data = {}) {
    if (!this.isInitialized()) {
      console.log('Firebase not initialized, skipping notification:', notification.title);
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message = {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/favicon.ico'
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        webpush: {
          headers: {
            'TTL': '86400' // 24 hours
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: data.type || 'general',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View',
                icon: '/icons/view.png'
              },
              {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss.png'
              }
            ]
          }
        }
      };

      const response = await this.messaging.send(message);
      console.log('Successfully sent message:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple devices
  async sendToMultipleDevices(tokens, notification, data = {}) {
    if (!this.isInitialized()) {
      console.log('Firebase not initialized, skipping notification:', notification.title);
      return { success: false, error: 'Firebase not initialized' };
    }

    try {
      const message = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/favicon.ico'
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        webpush: {
          headers: {
            'TTL': '86400'
          },
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/favicon.ico',
            badge: '/favicon.ico',
            tag: data.type || 'general',
            requireInteraction: true
          }
        }
      };

      const response = await this.messaging.sendMulticast(message);
      console.log('Successfully sent messages:', response);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error('Failed to send to token:', tokens[idx], resp.error);
          }
        });
        
        return {
          success: true,
          successCount: response.successCount,
          failureCount: response.failureCount,
          failedTokens: failedTokens
        };
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('Error sending multicast message:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to a topic
  async sendToTopic(topic, notification, data = {}) {
    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/favicon.ico'
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        }
      };

      const response = await this.messaging.send(message);
      console.log('Successfully sent topic message:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending topic message:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe tokens to a topic
  async subscribeToTopic(tokens, topic) {
    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      console.log('Successfully subscribed to topic:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return { success: false, error: error.message };
    }
  }

  // Unsubscribe tokens from a topic
  async unsubscribeFromTopic(tokens, topic) {
    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      console.log('Successfully unsubscribed from topic:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return { success: false, error: error.message };
    }
  }

  // Send order notification to admins
  async sendOrderNotificationToAdmins(orderData, adminTokens) {
    const notification = {
      title: '🛒 New Order Received!',
      body: `Order #${orderData.orderNumber} - ₹${orderData.totalAmount}`,
      icon: '/favicon.ico'
    };

    const data = {
      type: 'new_order',
      orderId: orderData._id.toString(),
      orderNumber: orderData.orderNumber,
      amount: orderData.totalAmount.toString(),
      customerName: orderData.shippingAddress?.name || 'Unknown',
      timestamp: new Date().toISOString()
    };

    if (adminTokens.length === 1) {
      return await this.sendToDevice(adminTokens[0], notification, data);
    } else if (adminTokens.length > 1) {
      return await this.sendToMultipleDevices(adminTokens, notification, data);
    }

    return { success: false, error: 'No admin tokens available' };
  }

  // Send low stock notification
  async sendLowStockNotification(productData, adminTokens) {
    const notification = {
      title: '⚠️ Low Stock Alert!',
      body: `${productData.name} - Only ${productData.stock} left`,
      icon: '/favicon.ico'
    };

    const data = {
      type: 'low_stock',
      productId: productData._id.toString(),
      productName: productData.name,
      currentStock: productData.stock.toString(),
      timestamp: new Date().toISOString()
    };

    if (adminTokens.length === 1) {
      return await this.sendToDevice(adminTokens[0], notification, data);
    } else if (adminTokens.length > 1) {
      return await this.sendToMultipleDevices(adminTokens, notification, data);
    }

    return { success: false, error: 'No admin tokens available' };
  }

  // Send order status update notification
  async sendOrderStatusNotification(orderData, userToken) {
    const statusMessages = {
      'confirmed': 'Your order has been confirmed!',
      'processing': 'Your order is being processed',
      'shipped': 'Your order has been shipped!',
      'delivered': 'Your order has been delivered',
      'cancelled': 'Your order has been cancelled'
    };

    const notification = {
      title: '📦 Order Update',
      body: statusMessages[orderData.status] || 'Your order status has been updated',
      icon: '/favicon.ico'
    };

    const data = {
      type: 'order_update',
      orderId: orderData._id.toString(),
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      timestamp: new Date().toISOString()
    };

    return await this.sendToDevice(userToken, notification, data);
  }
}

module.exports = new FirebaseService();
