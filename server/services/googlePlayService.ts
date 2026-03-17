import { google } from 'googleapis';
import { authStorage } from '../replit_integrations/auth/storage';

const PACKAGE_NAME = 'com.goldpredict.app';

function getAndroidPublisher() {
  const serviceAccountKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_KEY environment variable not set');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  return google.androidpublisher({ version: 'v3', auth });
}

export async function verifyPlayStorePurchase(
  purchaseToken: string,
  subscriptionId: string,
  userId: string
): Promise<{ valid: boolean; expiresAt: Date | null; error?: string }> {
  try {
    const publisher = getAndroidPublisher();

    const response = await publisher.purchases.subscriptions.get({
      packageName: PACKAGE_NAME,
      subscriptionId,
      token: purchaseToken,
    });

    const subscription = response.data;
    const expiryTimeMs = parseInt(subscription.expiryTimeMillis || '0', 10);
    const expiresAt = expiryTimeMs ? new Date(expiryTimeMs) : null;
    const now = Date.now();
    const isValid = expiryTimeMs > now && 
      subscription.cancelReason === undefined &&
      subscription.paymentState === 1; // 1 = payment received

    if (isValid) {
      // Update user subscription in database
      await authStorage.updateUserSubscription(userId, {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: expiresAt,
        stripeSubscriptionId: purchaseToken, // reuse field for play token
      });
    }

    return { valid: isValid, expiresAt };
  } catch (error: any) {
    console.error('Google Play verification error:', error.message);
    return { valid: false, expiresAt: null, error: error.message };
  }
}

export async function handlePlayStoreWebhook(
  message: string
): Promise<void> {
  try {
    const data = JSON.parse(Buffer.from(message, 'base64').toString('utf-8'));
    const { packageName, subscriptionNotification } = data;

    if (!subscriptionNotification) return;

    const { notificationType, purchaseToken, subscriptionId } = subscriptionNotification;

    // Notification types:
    // 1 = SUBSCRIPTION_RECOVERED
    // 2 = SUBSCRIPTION_RENEWED
    // 3 = SUBSCRIPTION_CANCELED
    // 4 = SUBSCRIPTION_PURCHASED
    // 12 = SUBSCRIPTION_EXPIRED
    const ACTIVE_TYPES = [1, 2, 4];
    const INACTIVE_TYPES = [3, 12];

    if (ACTIVE_TYPES.includes(notificationType)) {
      await authStorage.updateUserByPlayToken(purchaseToken, {
        subscriptionStatus: 'active',
        subscriptionPlan: 'pro',
      });
    } else if (INACTIVE_TYPES.includes(notificationType)) {
      await authStorage.updateUserByPlayToken(purchaseToken, {
        subscriptionStatus: 'canceled',
      });
    }
  } catch (error) {
    console.error('Play Store webhook error:', error);
  }
}

export const PLAY_STORE_SUBSCRIPTION_ID = 'gold_predict_pro_monthly';
