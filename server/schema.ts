import { pgTable, text, serial, integer, real, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Category type for unified handling
export type ItemCategory = "food" | "vehicle" | "product";

// Pantry items table - stores grocery items from receipts (keeping for backward compatibility)
export const pantryItems = pgTable("pantry_items", {
  id: serial("id").primaryKey(),
  brand: text("brand"),
  productName: text("product_name").notNull(),
  size: text("size"),
  purchaseDate: text("purchase_date"),
  dateAdded: timestamp("date_added").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Vehicles table - stores user vehicles for NHTSA recall monitoring
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  vin: text("vin"),
  nickname: text("nickname"),
  dateAdded: timestamp("date_added").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// Consumer products table - stores products for CPSC recall monitoring
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  brand: text("brand"),
  productName: text("product_name").notNull(),
  modelNumber: text("model_number"),
  category: text("category"),
  purchaseDate: text("purchase_date"),
  purchaseLocation: text("purchase_location"),
  dateAdded: timestamp("date_added").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// FDA recalls table - stores fetched recall data (keeping for backward compatibility)
export const recalls = pgTable("recalls", {
  recallId: text("recall_id").primaryKey(),
  productDescription: text("product_description").notNull(),
  reason: text("reason"),
  classification: text("classification"),
  company: text("company"),
  recallDate: text("recall_date"),
  rawJson: text("raw_json"),
  dateFetched: timestamp("date_fetched").defaultNow().notNull(),
});

// Vehicle recalls table - NHTSA recall data
export const vehicleRecalls = pgTable("vehicle_recalls", {
  id: serial("id").primaryKey(),
  campaignNumber: text("campaign_number").unique().notNull(),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  component: text("component"),
  summary: text("summary"),
  consequence: text("consequence"),
  remedy: text("remedy"),
  manufacturer: text("manufacturer"),
  recallDate: text("recall_date"),
  severity: text("severity"),
  rawJson: text("raw_json"),
  dateFetched: timestamp("date_fetched").defaultNow().notNull(),
});

// Product recalls table - CPSC recall data
export const productRecalls = pgTable("product_recalls", {
  id: serial("id").primaryKey(),
  recallNumber: text("recall_number").unique().notNull(),
  productName: text("product_name"),
  description: text("description"),
  hazard: text("hazard"),
  remedy: text("remedy"),
  manufacturer: text("manufacturer"),
  recallDate: text("recall_date"),
  imageUrl: text("image_url"),
  cpscUrl: text("cpsc_url"),
  unitsAffected: text("units_affected"),
  rawJson: text("raw_json"),
  dateFetched: timestamp("date_fetched").defaultNow().notNull(),
});

// Alerts table - stores matching alerts between pantry items and recalls
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  pantryItemId: integer("pantry_item_id").references(() => pantryItems.id),
  recallId: text("recall_id").references(() => recalls.recallId),
  score: real("score").notNull(),
  urgency: text("urgency").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDismissed: boolean("is_dismissed").default(false).notNull(),
});

// Vehicle alerts table - links vehicles to their recalls
export const vehicleAlerts = pgTable("vehicle_alerts", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  vehicleRecallId: integer("vehicle_recall_id").notNull().references(() => vehicleRecalls.id),
  score: real("score").notNull(),
  urgency: text("urgency").notNull(),
  message: text("message"),
  isFixed: boolean("is_fixed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDismissed: boolean("is_dismissed").default(false).notNull(),
});

// Product alerts table - links products to their recalls
export const productAlerts = pgTable("product_alerts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  productRecallId: integer("product_recall_id").notNull().references(() => productRecalls.id),
  score: real("score").notNull(),
  urgency: text("urgency").notNull(),
  message: text("message"),
  isDiscarded: boolean("is_discarded").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDismissed: boolean("is_dismissed").default(false).notNull(),
});

// System settings for tracking last fetch time
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertPantryItemSchema = createInsertSchema(pantryItems).omit({
  id: true,
  dateAdded: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  dateAdded: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  dateAdded: true,
});

export const insertRecallSchema = createInsertSchema(recalls).omit({
  dateFetched: true,
});

export const insertVehicleRecallSchema = createInsertSchema(vehicleRecalls).omit({
  id: true,
  dateFetched: true,
});

export const insertProductRecallSchema = createInsertSchema(productRecalls).omit({
  id: true,
  dateFetched: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleAlertSchema = createInsertSchema(vehicleAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertProductAlertSchema = createInsertSchema(productAlerts).omit({
  id: true,
  createdAt: true,
});

// Types
export type PantryItem = typeof pantryItems.$inferSelect;
export type InsertPantryItem = z.infer<typeof insertPantryItemSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Recall = typeof recalls.$inferSelect;
export type InsertRecall = z.infer<typeof insertRecallSchema>;

export type VehicleRecall = typeof vehicleRecalls.$inferSelect;
export type InsertVehicleRecall = z.infer<typeof insertVehicleRecallSchema>;

export type ProductRecall = typeof productRecalls.$inferSelect;
export type InsertProductRecall = z.infer<typeof insertProductRecallSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type VehicleAlert = typeof vehicleAlerts.$inferSelect;
export type InsertVehicleAlert = z.infer<typeof insertVehicleAlertSchema>;

export type ProductAlert = typeof productAlerts.$inferSelect;
export type InsertProductAlert = z.infer<typeof insertProductAlertSchema>;

export type SystemSetting = typeof systemSettings.$inferSelect;

// Receipt extraction result type
export const extractedItemSchema = z.object({
  brand: z.string().optional().default(""),
  product_name: z.string(),
  size_or_quantity: z.string().optional().default(""),
  purchase_date: z.string().optional().default(""),
  category: z.enum(["food", "product"]).optional().default("food"),
});

export type ExtractedItem = z.infer<typeof extractedItemSchema>;

// VIN extraction result type
export const extractedVinSchema = z.object({
  vin: z.string(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
});

export type ExtractedVin = z.infer<typeof extractedVinSchema>;

// Product extraction result type
export const extractedProductSchema = z.object({
  brand: z.string().optional().default(""),
  product_name: z.string(),
  model_number: z.string().optional().default(""),
  category: z.string().optional().default("Other"),
});

export type ExtractedProduct = z.infer<typeof extractedProductSchema>;

// Alert with related data
export type AlertWithDetails = Alert & {
  pantryItem: PantryItem;
  recall: Recall;
};

// Vehicle alert with details
export type VehicleAlertWithDetails = VehicleAlert & {
  vehicle: Vehicle;
  vehicleRecall: VehicleRecall;
};

// Product alert with details
export type ProductAlertWithDetails = ProductAlert & {
  product: Product;
  productRecall: ProductRecall;
};

// Unified alert type for dashboard
export type UnifiedAlert = {
  id: number;
  category: ItemCategory;
  itemName: string;
  recallTitle: string;
  urgency: string;
  message: string | null;
  createdAt: Date;
  isDismissed: boolean;
  isResolved: boolean;
  score: number;
  sourceId: number;
  recallSourceId: number | string;
};

// Product categories
export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Toys",
  "Furniture",
  "Appliances",
  "Baby Products",
  "Sports Equipment",
  "Clothing",
  "Health & Beauty",
  "Other"
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

// Vehicle makes (common ones)
export const VEHICLE_MAKES = [
  "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
  "Dodge", "Ford", "GMC", "Honda", "Hyundai", "Infiniti", "Jaguar",
  "Jeep", "Kia", "Land Rover", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz",
  "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota",
  "Volkswagen", "Volvo"
] as const;

export type VehicleMake = typeof VEHICLE_MAKES[number];
