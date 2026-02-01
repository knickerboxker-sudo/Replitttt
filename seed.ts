import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check current state
    const existingItems = await storage.getPantryItems();
    const existingRecalls = await storage.getRecalls();
    
    console.log(`Database state: ${existingItems.length} pantry items, ${existingRecalls.length} recalls`);
    
    // No sample data seeding - users add their own items
  } catch (error) {
    console.error("Error checking database:", error);
  }
}
