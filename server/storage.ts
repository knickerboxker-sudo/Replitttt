import { 
  pantryItems, recalls, alerts, systemSettings,
  vehicles, products, vehicleRecalls, productRecalls,
  vehicleAlerts, productAlerts,
  type PantryItem, type InsertPantryItem,
  type Vehicle, type InsertVehicle,
  type Product, type InsertProduct,
  type Recall, type InsertRecall,
  type VehicleRecall, type InsertVehicleRecall,
  type ProductRecall, type InsertProductRecall,
  type Alert, type InsertAlert,
  type VehicleAlert, type InsertVehicleAlert,
  type ProductAlert, type InsertProductAlert,
  type AlertWithDetails,
  type VehicleAlertWithDetails,
  type ProductAlertWithDetails,
  type UnifiedAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

export interface IStorage {
  getPantryItems(): Promise<PantryItem[]>;
  getPantryItem(id: number): Promise<PantryItem | undefined>;
  createPantryItem(item: InsertPantryItem): Promise<PantryItem>;
  createPantryItems(items: InsertPantryItem[]): Promise<PantryItem[]>;
  updatePantryItem(id: number, updates: Partial<InsertPantryItem>): Promise<PantryItem | undefined>;
  togglePantryItemActive(id: number): Promise<PantryItem | undefined>;
  deletePantryItem(id: number): Promise<void>;
  
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<void>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  
  getRecalls(): Promise<Recall[]>;
  getRecall(recallId: string): Promise<Recall | undefined>;
  createRecall(recall: InsertRecall): Promise<Recall>;
  createRecalls(recallList: InsertRecall[]): Promise<number>;
  getRecallCount(): Promise<number>;
  
  getVehicleRecalls(): Promise<VehicleRecall[]>;
  getVehicleRecall(id: number): Promise<VehicleRecall | undefined>;
  getVehicleRecallByCampaign(campaignNumber: string): Promise<VehicleRecall | undefined>;
  createVehicleRecalls(recallList: InsertVehicleRecall[]): Promise<number>;
  getVehicleRecallCount(): Promise<number>;
  
  getProductRecalls(): Promise<ProductRecall[]>;
  getProductRecall(id: number): Promise<ProductRecall | undefined>;
  getProductRecallByNumber(recallNumber: string): Promise<ProductRecall | undefined>;
  createProductRecalls(recallList: InsertProductRecall[]): Promise<number>;
  getProductRecallCount(): Promise<number>;
  
  getAlerts(): Promise<Alert[]>;
  getAlertsWithDetails(): Promise<AlertWithDetails[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  dismissAlert(id: number): Promise<void>;
  alertExists(pantryItemId: number, recallId: string): Promise<boolean>;
  
  getVehicleAlerts(): Promise<VehicleAlert[]>;
  getVehicleAlertsWithDetails(): Promise<VehicleAlertWithDetails[]>;
  getVehicleAlertsForVehicle(vehicleId: number): Promise<VehicleAlertWithDetails[]>;
  createVehicleAlert(alert: InsertVehicleAlert): Promise<VehicleAlert>;
  markVehicleAlertFixed(id: number, isFixed: boolean): Promise<void>;
  dismissVehicleAlert(id: number): Promise<void>;
  vehicleAlertExists(vehicleId: number, vehicleRecallId: number): Promise<boolean>;
  
  getProductAlerts(): Promise<ProductAlert[]>;
  getProductAlertsWithDetails(): Promise<ProductAlertWithDetails[]>;
  getProductAlertsForProduct(productId: number): Promise<ProductAlertWithDetails[]>;
  createProductAlert(alert: InsertProductAlert): Promise<ProductAlert>;
  markProductDiscarded(id: number, isDiscarded: boolean): Promise<void>;
  dismissProductAlert(id: number): Promise<void>;
  productAlertExists(productId: number, productRecallId: number): Promise<boolean>;
  
  getUnifiedAlerts(): Promise<UnifiedAlert[]>;
  
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPantryItems(): Promise<PantryItem[]> {
    return db.select().from(pantryItems).orderBy(desc(pantryItems.dateAdded));
  }

  async getPantryItem(id: number): Promise<PantryItem | undefined> {
    const [item] = await db.select().from(pantryItems).where(eq(pantryItems.id, id));
    return item;
  }

  async createPantryItem(item: InsertPantryItem): Promise<PantryItem> {
    const [created] = await db.insert(pantryItems).values(item).returning();
    return created;
  }

  async createPantryItems(items: InsertPantryItem[]): Promise<PantryItem[]> {
    if (items.length === 0) return [];
    return db.insert(pantryItems).values(items).returning();
  }

  async updatePantryItem(id: number, updates: Partial<InsertPantryItem>): Promise<PantryItem | undefined> {
    const [updated] = await db.update(pantryItems)
      .set(updates)
      .where(eq(pantryItems.id, id))
      .returning();
    return updated;
  }

  async togglePantryItemActive(id: number): Promise<PantryItem | undefined> {
    const item = await this.getPantryItem(id);
    if (!item) return undefined;
    return this.updatePantryItem(id, { isActive: !item.isActive });
  }

  async deletePantryItem(id: number): Promise<void> {
    await db.delete(alerts).where(eq(alerts.pantryItemId, id));
    await db.delete(pantryItems).where(eq(pantryItems.id, id));
  }

  async getVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles).orderBy(desc(vehicles.dateAdded));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [created] = await db.insert(vehicles).values(vehicle).returning();
    return created;
  }

  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return updated;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicleAlerts).where(eq(vehicleAlerts.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.dateAdded));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(productAlerts).where(eq(productAlerts.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async getRecalls(): Promise<Recall[]> {
    return db.select().from(recalls).orderBy(desc(recalls.dateFetched));
  }

  async getRecall(recallId: string): Promise<Recall | undefined> {
    const [recall] = await db.select().from(recalls).where(eq(recalls.recallId, recallId));
    return recall;
  }

  async createRecall(recall: InsertRecall): Promise<Recall> {
    const [created] = await db.insert(recalls).values(recall).returning();
    return created;
  }

  async createRecalls(recallList: InsertRecall[]): Promise<number> {
    if (recallList.length === 0) return 0;
    
    let created = 0;
    for (const recall of recallList) {
      try {
        const existing = await this.getRecall(recall.recallId);
        if (!existing) {
          await db.insert(recalls).values(recall);
          created++;
        }
      } catch (e) {
      }
    }
    return created;
  }

  async getRecallCount(): Promise<number> {
    const [{ count: n }] = await db.select({ count: count() }).from(recalls);
    return n;
  }

  async getVehicleRecalls(): Promise<VehicleRecall[]> {
    return db.select().from(vehicleRecalls).orderBy(desc(vehicleRecalls.dateFetched));
  }

  async getVehicleRecall(id: number): Promise<VehicleRecall | undefined> {
    const [recall] = await db.select().from(vehicleRecalls).where(eq(vehicleRecalls.id, id));
    return recall;
  }

  async getVehicleRecallByCampaign(campaignNumber: string): Promise<VehicleRecall | undefined> {
    const [recall] = await db.select().from(vehicleRecalls).where(eq(vehicleRecalls.campaignNumber, campaignNumber));
    return recall;
  }

  async createVehicleRecalls(recallList: InsertVehicleRecall[]): Promise<number> {
    if (recallList.length === 0) return 0;
    
    let created = 0;
    for (const recall of recallList) {
      try {
        const existing = await this.getVehicleRecallByCampaign(recall.campaignNumber);
        if (!existing) {
          await db.insert(vehicleRecalls).values(recall);
          created++;
        }
      } catch (e) {
      }
    }
    return created;
  }

  async getVehicleRecallCount(): Promise<number> {
    const [{ count: n }] = await db.select({ count: count() }).from(vehicleRecalls);
    return n;
  }

  async getProductRecalls(): Promise<ProductRecall[]> {
    return db.select().from(productRecalls).orderBy(desc(productRecalls.dateFetched));
  }

  async getProductRecall(id: number): Promise<ProductRecall | undefined> {
    const [recall] = await db.select().from(productRecalls).where(eq(productRecalls.id, id));
    return recall;
  }

  async getProductRecallByNumber(recallNumber: string): Promise<ProductRecall | undefined> {
    const [recall] = await db.select().from(productRecalls).where(eq(productRecalls.recallNumber, recallNumber));
    return recall;
  }

  async createProductRecalls(recallList: InsertProductRecall[]): Promise<number> {
    if (recallList.length === 0) return 0;
    
    let created = 0;
    for (const recall of recallList) {
      try {
        const existing = await this.getProductRecallByNumber(recall.recallNumber);
        if (!existing) {
          await db.insert(productRecalls).values(recall);
          created++;
        }
      } catch (e) {
      }
    }
    return created;
  }

  async getProductRecallCount(): Promise<number> {
    const [{ count: n }] = await db.select({ count: count() }).from(productRecalls);
    return n;
  }

  async getAlerts(): Promise<Alert[]> {
    return db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getAlertsWithDetails(): Promise<AlertWithDetails[]> {
    const alertList = await this.getAlerts();
    const results: AlertWithDetails[] = [];

    for (const alert of alertList) {
      if (!alert.pantryItemId || !alert.recallId) continue;
      const pantryItem = await this.getPantryItem(alert.pantryItemId);
      const recall = await this.getRecall(alert.recallId);
      
      if (pantryItem && recall) {
        results.push({
          ...alert,
          pantryItem,
          recall,
        });
      }
    }

    return results;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [created] = await db.insert(alerts).values(alert).returning();
    return created;
  }

  async dismissAlert(id: number): Promise<void> {
    await db.update(alerts).set({ isDismissed: true }).where(eq(alerts.id, id));
  }

  async alertExists(pantryItemId: number, recallId: string): Promise<boolean> {
    const [existing] = await db.select().from(alerts)
      .where(and(
        eq(alerts.pantryItemId, pantryItemId),
        eq(alerts.recallId, recallId)
      ));
    return !!existing;
  }

  async getVehicleAlerts(): Promise<VehicleAlert[]> {
    return db.select().from(vehicleAlerts).orderBy(desc(vehicleAlerts.createdAt));
  }

  async getVehicleAlertsWithDetails(): Promise<VehicleAlertWithDetails[]> {
    const alertList = await this.getVehicleAlerts();
    const results: VehicleAlertWithDetails[] = [];

    for (const alert of alertList) {
      const vehicle = await this.getVehicle(alert.vehicleId);
      const vehicleRecall = await this.getVehicleRecall(alert.vehicleRecallId);
      
      if (vehicle && vehicleRecall) {
        results.push({
          ...alert,
          vehicle,
          vehicleRecall,
        });
      }
    }

    return results;
  }

  async getVehicleAlertsForVehicle(vehicleId: number): Promise<VehicleAlertWithDetails[]> {
    const alertList = await db.select().from(vehicleAlerts)
      .where(eq(vehicleAlerts.vehicleId, vehicleId))
      .orderBy(desc(vehicleAlerts.createdAt));
    
    const results: VehicleAlertWithDetails[] = [];
    
    for (const alert of alertList) {
      const vehicle = await this.getVehicle(alert.vehicleId);
      const vehicleRecall = await this.getVehicleRecall(alert.vehicleRecallId);
      
      if (vehicle && vehicleRecall) {
        results.push({
          ...alert,
          vehicle,
          vehicleRecall,
        });
      }
    }
    
    return results;
  }

  async createVehicleAlert(alert: InsertVehicleAlert): Promise<VehicleAlert> {
    const [created] = await db.insert(vehicleAlerts).values(alert).returning();
    return created;
  }

  async markVehicleAlertFixed(id: number, isFixed: boolean): Promise<void> {
    await db.update(vehicleAlerts).set({ isFixed }).where(eq(vehicleAlerts.id, id));
  }

  async dismissVehicleAlert(id: number): Promise<void> {
    await db.update(vehicleAlerts).set({ isDismissed: true }).where(eq(vehicleAlerts.id, id));
  }

  async vehicleAlertExists(vehicleId: number, vehicleRecallId: number): Promise<boolean> {
    const [existing] = await db.select().from(vehicleAlerts)
      .where(and(
        eq(vehicleAlerts.vehicleId, vehicleId),
        eq(vehicleAlerts.vehicleRecallId, vehicleRecallId)
      ));
    return !!existing;
  }

  async getProductAlerts(): Promise<ProductAlert[]> {
    return db.select().from(productAlerts).orderBy(desc(productAlerts.createdAt));
  }

  async getProductAlertsWithDetails(): Promise<ProductAlertWithDetails[]> {
    const alertList = await this.getProductAlerts();
    const results: ProductAlertWithDetails[] = [];

    for (const alert of alertList) {
      const product = await this.getProduct(alert.productId);
      const productRecall = await this.getProductRecall(alert.productRecallId);
      
      if (product && productRecall) {
        results.push({
          ...alert,
          product,
          productRecall,
        });
      }
    }

    return results;
  }

  async getProductAlertsForProduct(productId: number): Promise<ProductAlertWithDetails[]> {
    const alertList = await db.select().from(productAlerts)
      .where(eq(productAlerts.productId, productId))
      .orderBy(desc(productAlerts.createdAt));
    
    const results: ProductAlertWithDetails[] = [];
    
    for (const alert of alertList) {
      const product = await this.getProduct(alert.productId);
      const productRecall = await this.getProductRecall(alert.productRecallId);
      
      if (product && productRecall) {
        results.push({
          ...alert,
          product,
          productRecall,
        });
      }
    }
    
    return results;
  }

  async createProductAlert(alert: InsertProductAlert): Promise<ProductAlert> {
    const [created] = await db.insert(productAlerts).values(alert).returning();
    return created;
  }

  async markProductDiscarded(id: number, isDiscarded: boolean): Promise<void> {
    await db.update(productAlerts).set({ isDiscarded }).where(eq(productAlerts.id, id));
  }

  async dismissProductAlert(id: number): Promise<void> {
    await db.update(productAlerts).set({ isDismissed: true }).where(eq(productAlerts.id, id));
  }

  async productAlertExists(productId: number, productRecallId: number): Promise<boolean> {
    const [existing] = await db.select().from(productAlerts)
      .where(and(
        eq(productAlerts.productId, productId),
        eq(productAlerts.productRecallId, productRecallId)
      ));
    return !!existing;
  }

  async getUnifiedAlerts(): Promise<UnifiedAlert[]> {
    const unified: UnifiedAlert[] = [];

    const foodAlerts = await this.getAlertsWithDetails();
    for (const alert of foodAlerts) {
      unified.push({
        id: alert.id,
        category: "food",
        itemName: `${alert.pantryItem.brand || ""} ${alert.pantryItem.productName}`.trim(),
        recallTitle: alert.recall.productDescription,
        urgency: alert.urgency,
        message: alert.message,
        createdAt: alert.createdAt,
        isDismissed: alert.isDismissed,
        isResolved: false,
        score: alert.score,
        sourceId: alert.pantryItem.id,
        recallSourceId: alert.recall.recallId,
      });
    }

    const vAlerts = await this.getVehicleAlertsWithDetails();
    for (const alert of vAlerts) {
      unified.push({
        id: alert.id,
        category: "vehicle",
        itemName: alert.vehicle.nickname || `${alert.vehicle.year} ${alert.vehicle.make} ${alert.vehicle.model}`,
        recallTitle: alert.vehicleRecall.summary || alert.vehicleRecall.component || "Vehicle Recall",
        urgency: alert.urgency,
        message: alert.message,
        createdAt: alert.createdAt,
        isDismissed: alert.isDismissed,
        isResolved: alert.isFixed,
        score: alert.score,
        sourceId: alert.vehicle.id,
        recallSourceId: alert.vehicleRecall.id,
      });
    }

    const pAlerts = await this.getProductAlertsWithDetails();
    for (const alert of pAlerts) {
      unified.push({
        id: alert.id,
        category: "product",
        itemName: `${alert.product.brand || ""} ${alert.product.productName}`.trim(),
        recallTitle: alert.productRecall.productName || "Product Recall",
        urgency: alert.urgency,
        message: alert.message,
        createdAt: alert.createdAt,
        isDismissed: alert.isDismissed,
        isResolved: alert.isDiscarded,
        score: alert.score,
        sourceId: alert.product.id,
        recallSourceId: alert.productRecall.id,
      });
    }

    unified.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return unified;
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await this.getSetting(key);
    if (existing !== null) {
      await db.update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key));
    } else {
      await db.insert(systemSettings).values({ key, value });
    }
  }
}

export const storage = new DatabaseStorage();
