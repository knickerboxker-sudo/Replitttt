import { storage } from "./storage";
import { CohereClient } from "cohere-ai";
import { sendPushToAll } from "./push";

// Initialize Cohere client if API key is available
const cohereClient = process.env.COHERE_API_KEY 
  ? new CohereClient({ token: process.env.COHERE_API_KEY })
  : null;

async function embedTexts(texts: string[], type: string): Promise<number[][]> {
  if (!cohereClient || !process.env.COHERE_API_KEY) {
    return [];
  }
  
  try {
    const response = await cohereClient.embed({
      texts,
      model: "embed-english-v3.0",
      inputType: type as "search_document" | "search_query",
    });
    
    return response.embeddings.map(embedding => Array.from(embedding));
  } catch (error) {
    console.error("Failed to embed texts:", error);
    return [];
  }
}

async function rerankDocuments(query: string, docs: string[], topN: number): Promise<{ index: number; score: number }[]> {
  if (!cohereClient || !process.env.COHERE_API_KEY) {
    return [];
  }
  
  try {
    const response = await cohereClient.rerank({
      model: "rerank-english-v3.0",
      query,
      documents: docs.map(text => ({ text })),
      topN,
    });
    
    return response.results.map(result => ({
      index: result.index,
      score: result.relevanceScore,
    }));
  } catch (error) {
    console.error("Failed to rerank documents:", error);
    return [];
  }
}

async function generateAlertMessage(recall: any, item: any): Promise<string> {
  if (!cohereClient || !process.env.COHERE_API_KEY) {
    return "Potential recall match detected. Review the details.";
  }
  
  try {
    const prompt = `Generate a brief one-sentence alert message (under 40 words) for a user about a food recall. 
The user has: ${item.brand || ''} ${item.productName}
The recall is: ${recall.productDescription || recall.reason || 'Unknown product'}
Focus on the key safety concern. Be clear and direct.`;
    
    const response = await cohereClient.chat({
      model: "command-r-plus-08-2024",
      message: prompt,
    });
    
    return response.text || "Potential recall match detected. Review the details.";
  } catch (error) {
    console.error("Failed to generate alert message:", error);
    return "Potential recall match detected. Review the details.";
  }
}

async function generateProductAlertMessage(recall: any, product: any): Promise<string> {
  if (!cohereClient || !process.env.COHERE_API_KEY) {
    return "Potential product recall match detected. Review the details.";
  }
  
  try {
    const prompt = `Generate a brief one-sentence alert message (under 40 words) for a user about a product recall.
The user has: ${product.brand || ''} ${product.productName} ${product.modelNumber || ''}
The recall is: ${recall.productName || recall.description || 'Unknown product'} - ${recall.hazard || 'Safety concern'}
Focus on the key safety hazard. Be clear and direct.`;
    
    const response = await cohereClient.chat({
      model: "command-r-plus-08-2024",
      message: prompt,
    });
    
    return response.text || "Potential product recall match detected. Review the details.";
  } catch (error) {
    console.error("Failed to generate product alert message:", error);
    return "Potential product recall match detected. Review the details.";
  }
}
import type { PantryItem, Recall, InsertAlert, Product, ProductRecall, InsertProductAlert } from "@shared/schema";

interface VectorEntry {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

class VectorStore {
  private pantryVectors: Map<string, VectorEntry> = new Map();
  private recallVectors: Map<string, VectorEntry> = new Map();
  private productVectors: Map<string, VectorEntry> = new Map();
  private productRecallVectors: Map<string, VectorEntry> = new Map();

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async addPantryItems(items: PantryItem[]): Promise<void> {
    if (items.length === 0) return;

    const texts = items.map(item => 
      `${item.brand || ""} ${item.productName} ${item.size || ""}`.trim()
    );

    try {
      const embeddings = await embedTexts(texts, "search_document");
      if (!embeddings || embeddings.length === 0) return;
      
      for (let i = 0; i < items.length; i++) {
        this.pantryVectors.set(String(items[i].id), {
          id: String(items[i].id),
          text: texts[i],
          embedding: embeddings[i],
          metadata: {
            brand: items[i].brand,
            productName: items[i].productName,
            isActive: items[i].isActive,
          },
        });
      }
    } catch (error) {
      console.error("Failed to embed pantry items:", error);
    }
  }

  async addProducts(items: Product[]): Promise<void> {
    if (items.length === 0) return;

    const texts = items.map(item => 
      `${item.brand || ""} ${item.productName} ${item.modelNumber || ""}`.trim()
    );

    try {
      const embeddings = await embedTexts(texts, "search_document");
      if (!embeddings || embeddings.length === 0) return;
      
      for (let i = 0; i < items.length; i++) {
        this.productVectors.set(String(items[i].id), {
          id: String(items[i].id),
          text: texts[i],
          embedding: embeddings[i],
          metadata: {
            brand: items[i].brand,
            productName: items[i].productName,
            modelNumber: items[i].modelNumber,
            category: items[i].category,
            isActive: items[i].isActive,
          },
        });
      }
    } catch (error) {
      console.error("Failed to embed products:", error);
    }
  }

  async addRecalls(recallList: Recall[]): Promise<void> {
    if (recallList.length === 0) return;

    const texts = recallList.map(recall => 
      `${recall.productDescription} ${recall.company || ""} ${recall.reason || ""}`.trim()
    );

    const batchSize = 96;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      const batchRecalls = recallList.slice(i, i + batchSize);
      
      try {
        const embeddings = await embedTexts(batchTexts, "search_document");
        
        for (let j = 0; j < batchRecalls.length; j++) {
          this.recallVectors.set(batchRecalls[j].recallId, {
            id: batchRecalls[j].recallId,
            text: batchTexts[j],
            embedding: embeddings[j],
            metadata: {
              classification: batchRecalls[j].classification,
              company: batchRecalls[j].company,
              recallDate: batchRecalls[j].recallDate,
            },
          });
        }
      } catch (error) {
        console.error("Failed to embed recalls batch:", error);
      }
    }
  }

  async addProductRecalls(recallList: ProductRecall[]): Promise<void> {
    if (recallList.length === 0) return;

    const texts = recallList.map(recall => 
      `${recall.manufacturer || ""} ${recall.productName || ""} ${recall.description || ""}`.trim()
    );

    const batchSize = 96;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      const batchRecalls = recallList.slice(i, i + batchSize);
      
      try {
        const embeddings = await embedTexts(batchTexts, "search_document");
        
        for (let j = 0; j < batchRecalls.length; j++) {
          this.productRecallVectors.set(String(batchRecalls[j].id), {
            id: String(batchRecalls[j].id),
            text: batchTexts[j],
            embedding: embeddings[j],
            metadata: {
              recallNumber: batchRecalls[j].recallNumber,
              manufacturer: batchRecalls[j].manufacturer,
              hazard: batchRecalls[j].hazard,
            },
          });
        }
      } catch (error) {
        console.error("Failed to embed product recalls batch:", error);
      }
    }
  }

  removePantryItem(id: number): void {
    this.pantryVectors.delete(String(id));
  }

  removeProduct(id: number): void {
    this.productVectors.delete(String(id));
  }

  async findSimilarRecalls(
    pantryItem: PantryItem, 
    topK: number = 20
  ): Promise<{ recall: VectorEntry; score: number }[]> {
    const text = `${pantryItem.brand || ""} ${pantryItem.productName} ${pantryItem.size || ""}`.trim();
    
    try {
      const [queryEmbedding] = await embedTexts([text], "search_query");
      
      const similarities: { entry: VectorEntry; score: number }[] = [];
      const recallEntries = Array.from(this.recallVectors.values());
      
      for (const entry of recallEntries) {
        const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
        similarities.push({ entry, score });
      }
      
      similarities.sort((a, b) => b.score - a.score);
      
      return similarities.slice(0, topK).map(s => ({
        recall: s.entry,
        score: s.score,
      }));
    } catch (error) {
      console.error("Failed to find similar recalls:", error);
      return [];
    }
  }

  async findSimilarProductRecalls(
    product: Product, 
    topK: number = 20
  ): Promise<{ recall: VectorEntry; score: number }[]> {
    const text = `${product.brand || ""} ${product.productName} ${product.modelNumber || ""}`.trim();
    
    try {
      const [queryEmbedding] = await embedTexts([text], "search_query");
      
      const similarities: { entry: VectorEntry; score: number }[] = [];
      const recallEntries = Array.from(this.productRecallVectors.values());
      
      for (const entry of recallEntries) {
        const score = this.cosineSimilarity(queryEmbedding, entry.embedding);
        similarities.push({ entry, score });
      }
      
      similarities.sort((a, b) => b.score - a.score);
      
      return similarities.slice(0, topK).map(s => ({
        recall: s.entry,
        score: s.score,
      }));
    } catch (error) {
      console.error("Failed to find similar product recalls:", error);
      return [];
    }
  }

  async matchPantryItem(pantryItem: PantryItem): Promise<void> {
    const candidates = await this.findSimilarRecalls(pantryItem, 50);
    
    console.log(`Matching ${pantryItem.productName} (${pantryItem.brand}): Found ${candidates.length} candidates`);
    
    if (candidates.length === 0) return;

    const queryText = `${pantryItem.brand || ""} ${pantryItem.productName}`.trim();
    const keywordMatches = [];
    const productKeywords = queryText.toLowerCase().split(' ').filter(k => k.length > 2);
    
    if (productKeywords.length > 0) {
      const recallEntriesForKeywords = Array.from(this.recallVectors.values());
      for (const entry of recallEntriesForKeywords) {
        const text = entry.text.toLowerCase();
        if (productKeywords.every(k => text.includes(k))) {
          keywordMatches.push({ entry, score: 0.9 });
        }
      }
    }
    
    const allCandidates = [...candidates.map(c => ({ entry: c.recall, score: c.score })), ...keywordMatches];
    const uniqueCandidates = Array.from(new Map(allCandidates.map(c => [c.entry.id, c])).values());
    
    const docsToRerank = uniqueCandidates.map(c => c.entry.text);
    
    try {
      const reranked = await rerankDocuments(queryText, docsToRerank, 10);
      
      for (const result of reranked) {
        console.log(`Rerank match for ${pantryItem.productName}: ${result.score} score`);
        if (result.score >= 0.40) { 
          const candidate = uniqueCandidates[result.index];
          const recallId = candidate.entry.id;
          
          const exists = await storage.alertExists(pantryItem.id, recallId);
          if (exists) continue;
          
          const recall = await storage.getRecall(recallId);
          if (!recall) continue;
          
          let urgency: "HIGH" | "MEDIUM" | "LOW" = "LOW";
          if (recall.classification === "Class I") {
            urgency = "HIGH";
          } else if (recall.classification === "Class II") {
            urgency = "MEDIUM";
          }
          
          const message = await generateAlertMessage(recall, pantryItem);
          
          const alert: InsertAlert = {
            pantryItemId: pantryItem.id,
            recallId: recallId,
            score: result.score,
            urgency,
            message,
            isDismissed: false,
          };
          
          await storage.createAlert(alert);
          
          // Send push notification
          sendPushToAll({
            title: '🥫 Food Recall Alert',
            body: `${pantryItem.brand || ''} ${pantryItem.productName}: ${message}`.trim(),
            tag: `food-alert-${pantryItem.id}-${recallId}`,
            url: '/',
            urgency,
          }).catch(console.error);
        }
      }
    } catch (error) {
      console.error("Failed to match pantry item:", error);
    }
  }

  async matchProduct(product: Product): Promise<void> {
    const candidates = await this.findSimilarProductRecalls(product, 50);
    
    console.log(`Matching product ${product.productName} (${product.brand}): Found ${candidates.length} candidates`);
    
    if (candidates.length === 0) return;

    const queryText = `${product.brand || ""} ${product.productName} ${product.modelNumber || ""}`.trim();
    
    const keywordMatches = [];
    const productKeywords = queryText.toLowerCase().split(' ').filter(k => k.length > 2);
    
    if (productKeywords.length > 0) {
      const recallEntriesForKeywords = Array.from(this.productRecallVectors.values());
      for (const entry of recallEntriesForKeywords) {
        const text = entry.text.toLowerCase();
        if (productKeywords.every(k => text.includes(k))) {
          keywordMatches.push({ entry, score: 0.9 });
        }
      }
    }

    if (product.modelNumber) {
      const modelLower = product.modelNumber.toLowerCase();
      const recallEntriesForModel = Array.from(this.productRecallVectors.values());
      for (const entry of recallEntriesForModel) {
        if (entry.text.toLowerCase().includes(modelLower)) {
          keywordMatches.push({ entry, score: 0.95 });
        }
      }
    }
    
    const allCandidates = [...candidates.map(c => ({ entry: c.recall, score: c.score })), ...keywordMatches];
    const uniqueCandidates = Array.from(new Map(allCandidates.map(c => [c.entry.id, c])).values());
    
    if (uniqueCandidates.length === 0) return;
    
    const docsToRerank = uniqueCandidates.map(c => c.entry.text);
    
    try {
      const reranked = await rerankDocuments(queryText, docsToRerank, 10);
      
      for (const result of reranked) {
        console.log(`Rerank match for product ${product.productName}: ${result.score} score`);
        if (result.score >= 0.65) {
          const candidate = uniqueCandidates[result.index];
          const recallId = parseInt(candidate.entry.id);
          
          const exists = await storage.productAlertExists(product.id, recallId);
          if (exists) continue;
          
          const recall = await storage.getProductRecall(recallId);
          if (!recall) continue;
          
          let urgency: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
          if (recall.hazard?.toLowerCase().includes("death") || 
              recall.hazard?.toLowerCase().includes("serious") ||
              recall.hazard?.toLowerCase().includes("fire")) {
            urgency = "HIGH";
          }
          
          const message = await generateProductAlertMessage(recall, product);
          
          const alert: InsertProductAlert = {
            productId: product.id,
            productRecallId: recallId,
            score: result.score,
            urgency,
            message,
            isDiscarded: false,
            isDismissed: false,
          };
          
          await storage.createProductAlert(alert);
          
          // Send push notification
          sendPushToAll({
            title: '📦 Product Recall Alert',
            body: `${product.brand || ''} ${product.productName}: ${message}`.trim(),
            tag: `product-alert-${product.id}-${recallId}`,
            url: '/products',
            urgency,
          }).catch(console.error);
        }
      }
    } catch (error) {
      console.error("Failed to match product:", error);
    }
  }

  async matchAllPantryItems(): Promise<void> {
    const pantryItems = await storage.getPantryItems();
    const activeItems = pantryItems.filter(item => item.isActive);
    
    for (const item of activeItems) {
      await this.matchPantryItem(item);
    }
  }

  async matchAllProducts(): Promise<void> {
    const products = await storage.getProducts();
    const activeProducts = products.filter(item => item.isActive);
    
    for (const product of activeProducts) {
      await this.matchProduct(product);
    }
  }

  getPantryCounts(): number {
    return this.pantryVectors.size;
  }

  getRecallCounts(): number {
    return this.recallVectors.size;
  }

  getProductCounts(): number {
    return this.productVectors.size;
  }

  getProductRecallCounts(): number {
    return this.productRecallVectors.size;
  }

  async initialize(): Promise<void> {
    const pantryItems = await storage.getPantryItems();
    const recalls = await storage.getRecalls();
    const products = await storage.getProducts();
    const productRecalls = await storage.getProductRecalls();
    
    if (pantryItems.length > 0) {
      await this.addPantryItems(pantryItems);
    }
    
    if (recalls.length > 0) {
      await this.addRecalls(recalls);
    }
    
    if (products.length > 0) {
      await this.addProducts(products);
    }
    
    if (productRecalls.length > 0) {
      await this.addProductRecalls(productRecalls);
    }
    
    console.log(`Vector store initialized: ${this.pantryVectors.size} pantry items, ${this.recallVectors.size} FDA recalls, ${this.productVectors.size} products, ${this.productRecallVectors.size} CPSC recalls`);
  }
}

export const vectorStore = new VectorStore();
