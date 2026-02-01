import type { InsertProductRecall } from "@shared/schema";

const CPSC_BASE_URL = "https://www.saferproducts.gov/RestWebServices";

interface CPSCRecall {
  RecallNumber?: string;
  RecallDate?: string;
  ProductName?: string;
  Description?: string;
  Hazards?: { Name?: string }[];
  Remedies?: { Name?: string }[];
  Manufacturers?: { Name?: string }[];
  Images?: { URL?: string }[];
  URL?: string;
  UnitsAffected?: string;
  [key: string]: unknown;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function fetchProductRecalls(daysBack: number = 90): Promise<InsertProductRecall[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    const url = `${CPSC_BASE_URL}/Recall?format=json&RecallDateStart=${formatDate(startDate)}&RecallDateEnd=${formatDate(endDate)}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`CPSC API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json() as CPSCRecall[];
    
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    const recalls: InsertProductRecall[] = [];
    
    for (const recall of data) {
      if (!recall.RecallNumber) continue;
      
      const hazards = recall.Hazards?.map(h => h.Name).filter(Boolean).join("; ") || null;
      const remedies = recall.Remedies?.map(r => r.Name).filter(Boolean).join("; ") || null;
      const manufacturer = recall.Manufacturers?.map(m => m.Name).filter(Boolean).join(", ") || null;
      const imageUrl = recall.Images?.[0]?.URL || null;
      
      recalls.push({
        recallNumber: recall.RecallNumber,
        productName: recall.ProductName || null,
        description: recall.Description || null,
        hazard: hazards,
        remedy: remedies,
        manufacturer: manufacturer,
        recallDate: recall.RecallDate || null,
        imageUrl: imageUrl,
        cpscUrl: recall.URL || null,
        unitsAffected: recall.UnitsAffected || null,
        rawJson: JSON.stringify(recall),
      });
    }
    
    return recalls;
  } catch (error) {
    console.error("Error fetching product recalls:", error);
    return [];
  }
}

export async function searchProductRecalls(query: string): Promise<InsertProductRecall[]> {
  try {
    const url = `${CPSC_BASE_URL}/Recall?format=json&RecallTitle=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json() as CPSCRecall[];
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data
      .filter(recall => recall.RecallNumber)
      .map(recall => ({
        recallNumber: recall.RecallNumber!,
        productName: recall.ProductName || null,
        description: recall.Description || null,
        hazard: recall.Hazards?.map(h => h.Name).filter(Boolean).join("; ") || null,
        remedy: recall.Remedies?.map(r => r.Name).filter(Boolean).join("; ") || null,
        manufacturer: recall.Manufacturers?.map(m => m.Name).filter(Boolean).join(", ") || null,
        recallDate: recall.RecallDate || null,
        imageUrl: recall.Images?.[0]?.URL || null,
        cpscUrl: recall.URL || null,
        unitsAffected: recall.UnitsAffected || null,
        rawJson: JSON.stringify(recall),
      }));
  } catch (error) {
    console.error("Error searching product recalls:", error);
    return [];
  }
}
