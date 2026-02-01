import type { Express } from "express";
import type { Server as HTTPServer } from "http";
import { saveSubscription, removeSubscription } from "./push";

export async function registerRoutes(httpServer: HTTPServer, app: Express) {
  // TODO: Add API routes here
  // This is a placeholder for the routes that would be defined in the application
  
  // Example route structure:
  // app.get("/api/health", (req, res) => {
  //   res.json({ status: "ok" });
  // });
  
  // ─── PUSH NOTIFICATION ROUTES ────────────────────────────────────────────────
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription object" });
      }
      saveSubscription(req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        removeSubscription(endpoint);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  // Health-check: lets the client know push is wired up
  app.get("/api/push/status", async (_req, res) => {
    res.json({
      pushEnabled: true,
      vapidConfigured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null,
    });
  });
  
  return app;
}
