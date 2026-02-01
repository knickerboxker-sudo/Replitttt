# Push Notification Setup Guide

This guide explains how to set up push notifications for RecallGuard.

## Prerequisites

- Node.js installed
- PostgreSQL database running
- Cohere API key (for AI-powered matching)

## Step 1: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications. Generate them using this command:

```bash
node -e "const crypto=require('crypto');const k=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1',publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});const d=crypto.createPublicKey(k.publicKey).export({type:'spki',format:'der'});const r=d.slice(d.length-65);console.log('VAPID_PUBLIC_KEY='+r.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,''));console.log('VAPID_PRIVATE_KEY=\"'+k.privateKey.replace(/\n/g,'\\\\n')+'\"');console.log('VAPID_EMAIL=mailto:your@email.com');"
```

This will output something like:

```
VAPID_PUBLIC_KEY=BFpYXcw_LHgGtIL38fNoM1OQVWDkDiDmxHGSjLxlIUzVyFs7nZ3bZAZNwN6G1SHWOiI26JwIctkDP6cZmvYdEEU
VAPID_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgKViRsRUI1/lVzhXS\ncAdeVJJvDuluhrt3H2/HubLEIlihRANCAARaWF3MPyx4BrSC9/HzaDNTkFVg5A4g\n5sRxkoy8ZSFM1chbO52d22QGTcDehtUh1joiNuicCHLZAz+nGZr2HRBF\n-----END PRIVATE KEY-----\n"
VAPID_EMAIL=mailto:your@email.com
```

## Step 2: Add Environment Variables

Add the generated keys to your `.env` file:

```bash
# Required for push notifications
VAPID_PUBLIC_KEY=<your_generated_public_key>
VAPID_PRIVATE_KEY="<your_generated_private_key>"
VAPID_EMAIL=mailto:your@yourdomain.com

# Required for AI matching
COHERE_API_KEY=<your_cohere_api_key>

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recallguard
```

**Important:** 
- The VAPID_PRIVATE_KEY must be wrapped in quotes because it contains newlines
- Use your actual email address or domain for VAPID_EMAIL
- Generate VAPID keys only once and reuse them. If you change keys, existing subscriptions will break.

## Step 3: Deploy to Railway

When deploying to Railway:

1. Set environment variables in the Railway dashboard:
   - `VAPID_PUBLIC_KEY` - paste the public key
   - `VAPID_PRIVATE_KEY` - paste the private key (with quotes)
   - `VAPID_EMAIL` - your contact email
   - `COHERE_API_KEY` - your Cohere API key
   - `DATABASE_URL` - automatically set by Railway Postgres add-on

2. The app will automatically initialize push notifications on startup

## Step 4: Test Push Notifications

1. Open your deployed app in a browser
2. Use the `usePushNotifications` hook in a React component:

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function NotificationButton() {
  const { supported, permission, subscribe } = usePushNotifications();
  
  if (!supported) {
    return <p>Push notifications not supported</p>;
  }
  
  return (
    <button onClick={subscribe}>
      Enable Notifications
    </button>
  );
}
```

3. Click "Enable Notifications" and grant permission
4. Add a food item or product - you should receive a push notification when a matching recall is found

## Troubleshooting

### "Push notifications not supported"
- Make sure you're using HTTPS (required for service workers)
- Check browser compatibility (Chrome, Firefox, Edge, Safari 16.4+)

### "Server rejected subscription"
- Verify VAPID keys are correctly set in environment variables
- Check server logs for errors
- Ensure the app has been rebuilt after adding environment variables

### No notifications received
- Check browser notification permissions
- Open browser DevTools → Application → Service Workers to verify the SW is active
- Check the Network tab for `/api/push/subscribe` requests
- Verify COHERE_API_KEY is set (needed for matching recalls to items)

### "COHERE_API_KEY is not set" warning
- Push notifications will still work, but alert matching will be disabled
- Get a free API key from [dashboard.cohere.com](https://dashboard.cohere.com)

## API Endpoints

The push notification system exposes these endpoints:

- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications  
- `GET /api/push/status` - Check push notification status and get VAPID public key

## How It Works

1. Client subscribes to push notifications via the browser's Push API
2. Subscription is sent to the server and stored in memory
3. When a recall matches a user's item, the server sends a push notification
4. Service worker receives the push and displays a notification
5. User can click the notification to view details in the app
