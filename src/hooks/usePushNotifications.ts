// client/src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react';

// Paste your actual VAPID public key here after generating it (see Section 4).
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<PermissionState>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check browser support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
    }
    // Read current permission state
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((status) => {
        setPermission(status.state);
        status.onchange = () => setPermission(status.state);
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    setLoading(true);

    try {
      // 1. Ask the user for permission (no-op if already granted)
      const perm = await Notification.requestPermission();
      setPermission(perm === 'granted' ? 'granted' : 'denied');
      if (perm !== 'granted') {
        setLoading(false);
        return false;
      }

      // 2. Get the active service worker registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe to push via the browser
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Send the subscription object to the server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) throw new Error('Server rejected subscription');

      setSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      setLoading(false);
      return false;
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Tell the server to drop it
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        // Unsubscribe locally
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
    setLoading(false);
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
