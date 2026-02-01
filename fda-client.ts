import { createHash } from "crypto";
import type { InsertRecall } from "@shared/schema";

const FDA_BASE_URL = "https://api.fda.gov/food/enforcement.json";

interface FDARecall {
  recall_number?: string;
  product_description?: string;
  reason_for_recall?: string;
  classification?: string;
  recalling_firm?: string;
  report_date?: string;
  [key: string]: unknown;
}

interface FDAResponse {
  meta?: {
    results?: {
      total?: number;
    };
  };
  results?: FDARecall[];
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function generateRecallId(recall: FDARecall): string {
  if (recall.recall_number) {
    return recall.recall_number;
  }
  
  const hash = createHash("sha256")
    .update(`${recall.product_description || ""}${recall.recalling_firm || ""}${recall.report_date || ""}`)
    .digest("hex")
    .substring(0, 16);
  
  return `GEN-${hash}`;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const delays = [500, 1500, 3500];
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      
      if (response.status === 404) {
        // No results found - not an error
        return response;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
  
  throw new Error("Max retries exceeded");
}

export async function fetchRecalls(days: number = 365): Promise<InsertRecall[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const dateFrom = formatDate(startDate);
  const dateTo = formatDate(now);
  
  const recalls: InsertRecall[] = [];
  const limit = 100;
  const maxRecalls = 5000;
  let skip = 0;
  
  while (recalls.length < maxRecalls) {
    const url = `${FDA_BASE_URL}?search=report_date:[${dateFrom}+TO+${dateTo}]&limit=${limit}&skip=${skip}`;
    
    try {
      const response = await fetchWithRetry(url);
      
      if (response.status === 404) {
        break;
      }
      
      const data: FDAResponse = await response.json();
      const results = data.results || [];
      
      if (results.length === 0) {
        break;
      }
      
      for (const recall of results) {
        recalls.push({
          recallId: generateRecallId(recall),
          productDescription: recall.product_description || "Unknown product",
          reason: recall.reason_for_recall || null,
          classification: recall.classification || null,
          company: recall.recalling_firm || null,
          recallDate: recall.report_date || null,
          rawJson: JSON.stringify(recall),
        });
      }
      
      if (results.length < limit) {
        break;
      }
      
      skip += limit;
    } catch (error) {
      console.error("FDA API error:", error);
      break;
    }
  }
  
  return recalls;
}

export async function fetchRecallsLast90Days(): Promise<InsertRecall[]> {
  return fetchRecalls(90);
}
