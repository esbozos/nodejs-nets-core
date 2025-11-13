import admin from 'firebase-admin';
import { NetsCoreConfig, DeviceNotificationResult, FirebaseMessageData } from '../types';
import { UserDevice } from '../models';

export class FirebaseService {
  private app: admin.app.App | null = null;
  private initialized: boolean = false;

  constructor(config?: NetsCoreConfig['firebase']) {
    if (config) {
      this.initialize(config);
    }
  }

  private initialize(config: NetsCoreConfig['firebase']): void {
    try {
      let credential: admin.credential.Credential;

      if (config && config.credentialsPath) {
        credential = admin.credential.cert(config.credentialsPath);
      } else if (config && config.credentials) {
        credential = admin.credential.cert(config.credentials);
      } else {
        console.warn(
          'Firebase credentials not provided. Firebase messaging will not be available.'
        );
        return;
      }

      this.app = admin.initializeApp({
        credential,
      });

      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error: any) {
      console.error('Failed to initialize Firebase:', error.message);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async sendMessage(
    title: string,
    message: string,
    registrationToken: string,
    data?: FirebaseMessageData,
    channel: string = 'default'
  ): Promise<string> {
    if (!this.initialized || !this.app) {
      throw new Error('Firebase not initialized');
    }

    try {
      const androidConfig: admin.messaging.AndroidConfig = {
        priority: 'high',
        notification: {
          icon: 'ic_launcher',
          color: '#f45342',
          channelId: channel,
        },
      };

      const messagePayload: admin.messaging.Message = {
        token: registrationToken,
        notification: {
          title,
          body: message,
        },
        android: androidConfig,
        data: data || {},
      };

      const response = await admin.messaging().send(messagePayload);
      return response;
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered') {
        throw new Error('UnregisteredError');
      }
      throw new Error(`Firebase messaging error: ${error.message}`);
    }
  }

  async sendUserDeviceNotification(
    user: any,
    title: string,
    message: string,
    data?: FirebaseMessageData,
    channel: string = 'default'
  ): Promise<DeviceNotificationResult> {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    const devices = await UserDevice.findAll({
      where: {
        userId: user.id,
        firebaseToken: { $ne: null },
      } as any,
    });

    const results: DeviceNotificationResult = {};

    for (const device of devices) {
      if (!device.firebaseToken) continue;

      try {
        const messageId = await this.sendMessage(
          title,
          message,
          device.firebaseToken,
          data,
          channel
        );

        results[device.id] = {
          success: true,
          message_id: messageId,
        };

        // TODO: Save notification to database (UserFirebaseNotification model)
      } catch (error: any) {
        if (error.message.includes('UnregisteredError')) {
          // Delete device with invalid token
          await device.destroy();
          results[device.id] = {
            success: false,
            error: 'Device token unregistered',
          };
        } else {
          results[device.id] = {
            success: false,
            error: error.message,
          };

          // TODO: Save failed notification to database
        }
      }
    }

    return results;
  }

  async sendBulkNotifications(
    tokens: string[],
    title: string,
    message: string,
    data?: FirebaseMessageData
  ): Promise<admin.messaging.BatchResponse> {
    if (!this.initialized || !this.app) {
      throw new Error('Firebase not initialized');
    }

    const messages: admin.messaging.Message[] = tokens.map(token => ({
      token,
      notification: {
        title,
        body: message,
      },
      data: data || {},
    }));

    const response = await admin.messaging().sendAll(messages);
    return response;
  }
}

// Global Firebase service instance
let firebaseService: FirebaseService | null = null;

export const initializeFirebaseService = (config?: NetsCoreConfig['firebase']): FirebaseService => {
  firebaseService = new FirebaseService(config);
  return firebaseService;
};

export const getFirebaseService = (): FirebaseService => {
  if (!firebaseService) {
    throw new Error('Firebase service not initialized. Call initializeFirebaseService first.');
  }
  return firebaseService;
};

export const sendFirebaseMessage = async (
  title: string,
  message: string,
  registrationToken: string,
  data?: FirebaseMessageData,
  channel?: string
): Promise<string> => {
  const service = getFirebaseService();
  return service.sendMessage(title, message, registrationToken, data, channel);
};

export const sendUserDeviceNotification = async (
  user: any,
  title: string,
  message: string,
  data?: FirebaseMessageData,
  channel?: string
): Promise<DeviceNotificationResult> => {
  const service = getFirebaseService();
  return service.sendUserDeviceNotification(user, title, message, data, channel);
};
