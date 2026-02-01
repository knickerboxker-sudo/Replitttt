# Implementation Verification Checklist

This document provides a checklist to verify that all components of the RecallGuard push notification system are working correctly.

## 1. Service Worker (`public/sw.js`)

**What Changed:**
- Added push event listener to receive push notifications from server
- Added notificationclick event listener to handle user interactions
- Updated cache version from v1 to v2
- Added maintainer comment for cache versioning

**How to Verify:**
1. Open the app in a browser
2. Open DevTools → Application → Service Workers
3. Verify the service worker is "activated and running"
4. Check Console for any service worker errors
5. The cache should be named "recallguard-v2"

## 2. Manifest (`public/manifest.webmanifest`)

**What Changed:**
- Name changed from "sortir" to "RecallGuard"
- Short name changed from "sortir" to "RecallGuard"
- Description updated to mention all recall types

**How to Verify:**
1. Open DevTools → Application → Manifest
2. Verify name shows as "RecallGuard"
3. Verify description mentions food, vehicle, and product recalls

## 3. Push Notification Hook (`src/hooks/usePushNotifications.ts`)

**What Changed:**
- Created new hook for managing push subscriptions
- Fetches VAPID public key from `/api/push/status` endpoint
- Manages browser support detection and permission states

**How to Verify:**
```typescript
// In a React component:
import { usePushNotifications } from '@/hooks/usePushNotifications';

function TestComponent() {
  const { supported, permission, subscribe } = usePushNotifications();
  
  return (
    <div>
      <p>Supported: {supported ? 'Yes' : 'No'}</p>
      <p>Permission: {permission}</p>
      <button onClick={subscribe}>Subscribe</button>
    </div>
  );
}
```

## 4. Server Push Infrastructure (`server/push.ts`)

**What Changed:**
- Created in-memory subscription store
- Implemented VAPID key generation utility
- Integrated web-push package
- Added automatic cleanup of expired subscriptions

**How to Verify:**
1. Check server logs on startup - should not show web-push errors
2. Test subscribe endpoint: `POST /api/push/subscribe`
3. Test unsubscribe endpoint: `POST /api/push/unsubscribe`
4. Test status endpoint: `GET /api/push/status`

**Test with curl:**
```bash
# Check push status
curl http://localhost:5000/api/push/status

# Should return:
# {"pushEnabled":true,"vapidConfigured":true,"vapidPublicKey":"YOUR_KEY_HERE"}
```

## 5. API Routes (`server/routes.ts`)

**What Changed:**
- Added POST `/api/push/subscribe` - validates and saves subscriptions
- Added POST `/api/push/unsubscribe` - removes subscriptions
- Added GET `/api/push/status` - returns push status and VAPID key

**How to Verify:**
```bash
# Test status endpoint
curl http://localhost:5000/api/push/status

# Test subscribe (will fail without valid subscription object)
curl -X POST http://localhost:5000/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"test","keys":{"p256dh":"test","auth":"test"}}'

# Should return: {"success":true}
```

## 6. Cohere Functions (`server/vector-store.ts`)

**What Changed:**
- Implemented `embedTexts()` - generates vector embeddings
- Implemented `rerankDocuments()` - reranks search results
- Implemented `generateAlertMessage()` - generates alert text for food
- Implemented `generateProductAlertMessage()` - generates alert text for products
- All functions have fallback behavior when COHERE_API_KEY is missing

**How to Verify:**
1. Check server logs on startup
   - If COHERE_API_KEY is set: "Vector store initialized: X pantry items, Y FDA recalls..."
   - If COHERE_API_KEY is missing: "[STARTUP] COHERE_API_KEY is not set — vector matching is disabled..."
2. Add a pantry item and check if it generates alerts
3. Check console logs for "Failed to embed" or "Failed to rerank" errors

## 7. Storage Optimizations (`server/storage.ts`)

**What Changed:**
- `getRecallCount()` now uses SQL COUNT() instead of fetching all rows
- `getVehicleRecallCount()` now uses SQL COUNT()
- `getProductRecallCount()` now uses SQL COUNT()

**How to Verify:**
1. Enable PostgreSQL query logging
2. Call each count method
3. Verify SQL queries use COUNT(*) instead of SELECT *
4. Performance: Should be significantly faster with large datasets

**Performance Test:**
```typescript
console.time('recalls');
const count = await storage.getRecallCount();
console.timeEnd('recalls');
console.log('Recall count:', count);
```

## 8. Build Configuration (`build.ts`)

**What Changed:**
- Added "cohere-ai" to allowlist (bundled into server)
- Added "web-push" to allowlist (bundled into server)

**How to Verify:**
1. Run `npm run build`
2. Check build output - should complete without errors
3. Check `dist/index.cjs` size - should be ~2.3MB
4. No import errors for cohere-ai or web-push at runtime

## 9. Startup Logging (`server/index.ts`)

**What Changed:**
- Added warning when COHERE_API_KEY is not set

**How to Verify:**
1. Start server WITHOUT COHERE_API_KEY
   - Should see: "[STARTUP] COHERE_API_KEY is not set — vector matching is disabled..."
2. Start server WITH COHERE_API_KEY
   - Should see: "Vector store initialized: X pantry items, Y FDA recalls..."

## 10. Environment Configuration

**What Changed:**
- Updated `.env.example` with VAPID configuration section
- Created `PUSH_SETUP.md` with comprehensive setup guide
- Created `shared/` directory with symlink for @shared/schema
- Updated `tsconfig.json` with @shared path mapping

**How to Verify:**
1. Check `.env.example` has VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
2. Verify PUSH_SETUP.md exists and is comprehensive
3. Verify `shared/schema.ts` symlink points to `../server/schema.ts`
4. Run `npm run build` - should resolve @shared/schema imports

## Integration Test

**End-to-End Push Notification Test:**

1. Generate VAPID keys (see PUSH_SETUP.md)
2. Add keys to .env file
3. Start the server: `npm run dev`
4. Open the app in Chrome/Firefox/Edge
5. Grant notification permission
6. Subscribe to push notifications using the hook
7. Add a pantry item that matches a recall
8. Verify you receive a push notification
9. Click the notification - should open the app

**Expected Notification Format:**
```
Title: 🥫 Food Recall Alert
Body: [Brand] [Product]: [Alert Message]
Actions: [View Alert] [Dismiss]
```

## Security Verification

Run security scan:
```bash
npm run build
# CodeQL scan should show 0 vulnerabilities
```

**Security Checklist:**
- ✅ No SQL injection (using Drizzle ORM with parameterized queries)
- ✅ Input validation on all API endpoints
- ✅ No 'as any' type assertions (except where necessary with documentation)
- ✅ VAPID private key stored securely (server-side only)
- ✅ VAPID public key safely exposed to client (by design)
- ✅ Error handling doesn't leak sensitive information

## Common Issues

### Push Notifications Not Received
1. Check browser notification permission
2. Verify VAPID keys are set correctly
3. Check service worker is active
4. Verify subscription was saved on server
5. Check server logs for push errors

### Build Fails
1. Verify node_modules exists: `npm install --legacy-peer-deps`
2. Check for TypeScript errors: `npx tsc --noEmit`
3. Verify @shared path resolves: check `tsconfig.json` and `shared/` directory

### Cohere Functions Not Working
1. Verify COHERE_API_KEY is set
2. Check server logs for API errors
3. Verify API key has sufficient credits/quota
4. Check network connectivity to Cohere API

## Deployment Checklist (Railway)

- [ ] Set VAPID_PUBLIC_KEY environment variable
- [ ] Set VAPID_PRIVATE_KEY environment variable
- [ ] Set VAPID_EMAIL environment variable
- [ ] Set COHERE_API_KEY environment variable
- [ ] Verify DATABASE_URL is set (auto-configured by Railway)
- [ ] Deploy and check logs for startup messages
- [ ] Test push notification subscription
- [ ] Verify notifications are received
