// server/push.ts
import crypto from 'crypto';
import webPush from 'web-push';

// ─── VAPID KEY PAIR ──────────────────────────────────────────────────────────
// In production, generate once and store in env vars.
// Generation (run once in Node, paste the output into your .env):
//
//   node -e "
//     const { generateVAPIDKeys } = require('./server/push');
//     console.log(JSON.stringify(generateVAPIDKeys(), null, 2));
//   "
//
// Then set:
//   VAPID_PUBLIC_KEY=<the public key>
//   VAPID_PRIVATE_KEY=<the private key>
//   VAPID_EMAIL=mailto:you@yourdomain.com

export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  // Uses the Web Crypto-compatible ECDH P-256 curve
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // For VAPID we need the raw uncompressed public key in URL-safe base64
  const pubKeyDer = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
  // The last 65 bytes of a P-256 SPKI DER are the uncompressed point
  const rawPub = pubKeyDer.slice(pubKeyDer.length - 65);
  const urlSafeBase64 = rawPub.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return { publicKey: urlSafeBase64, privateKey };
}

// ─── IN-MEMORY SUBSCRIPTION STORE ────────────────────────────────────────────
// Key = endpoint URL (unique per device/browser), Value = full subscription JSON
const subscriptions = new Map<string, PushSubscriptionJSON>();

export interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function saveSubscription(sub: PushSubscriptionJSON): void {
  if (sub.endpoint && sub.keys) {
    subscriptions.set(sub.endpoint, sub);
  }
}

export function removeSubscription(endpoint: string): void {
  subscriptions.delete(endpoint);
}

export function getAllSubscriptions(): PushSubscriptionJSON[] {
  return Array.from(subscriptions.values());
}

// ─── SEND A PUSH MESSAGE ─────────────────────────────────────────────────────
// payload shape that the service worker expects:
//
//   {
//     title: string,
//     body: string,
//     tag?: string,        // deduplication tag
//     url?: string,        // path to open on tap
//     urgency?: string     // 'HIGH' | 'MEDIUM' | 'LOW'
//   }

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  urgency?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Initialize web-push with VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@recallguard.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const subs = getAllSubscriptions();
  if (subs.length === 0) return;

  const results = await Promise.allSettled(
    subs.map((sub) => sendPushToOne(sub, payload))
  );

  // Clean up any subscriptions that are no longer valid
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number };
      // 410 Gone or 401 Unauthorized = subscription expired, remove it
      if (err.statusCode === 410 || err.statusCode === 401) {
        subscriptions.delete(subs[i].endpoint);
      }
    }
  });
}

async function sendPushToOne(sub: PushSubscriptionJSON, payload: PushPayload): Promise<void> {
  try {
    await webPush.sendNotification(
      sub as any,
      JSON.stringify(payload),
      { urgency: payload.urgency === 'HIGH' ? 'high' : 'normal' }
    );
  } catch (err: any) {
    // Re-throw with statusCode property for cleanup logic
    const error: any = new Error(`Push failed: ${err.message}`);
    error.statusCode = err.statusCode;
    throw error;
  }
}
