import type { InsertVehicleRecall } from "@shared/schema";

const NHTSA_BASE_URL = "https://api.nhtsa.gov";

interface NHTSARecall {
  NHTSACampaignNumber?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  Manufacturer?: string;
  ReportReceivedDate?: string;
  Make?: string;
  Model?: string;
  ModelYear?: string | number;
  [key: string]: unknown;
}

interface NHTSARecallResponse {
  Count?: number;
  Message?: string;
  Results?: NHTSARecall[];
  results?: NHTSARecall[];
}

interface VINDecodeResult {
  Variable?: string;
  Value?: string;
  ValueId?: string;
}

interface VINDecodeResponse {
  Count?: number;
  Message?: string;
  Results?: VINDecodeResult[];
}

export interface DecodedVehicle {
  make: string;
  model: string;
  year: number;
  vin: string;
}

function determineSeverity(consequence: string | undefined): "high" | "medium" | "low" {
  if (!consequence) return "low";
  const lower = consequence.toLowerCase();
  if (lower.includes("crash") || lower.includes("fire") || lower.includes("death") || 
      lower.includes("injury") || lower.includes("serious") || lower.includes("airbag")) {
    return "high";
  }
  if (lower.includes("malfunction") || lower.includes("failure") || lower.includes("stall")) {
    return "medium";
  }
  return "low";
}

export async function decodeVIN(vin: string): Promise<DecodedVehicle | null> {
  try {
    const url = `${NHTSA_BASE_URL}/products/vehicle/decodeVin/${vin}?format=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`NHTSA VIN decode failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json() as VINDecodeResponse;
    
    if (!data.Results || data.Results.length === 0) {
      return null;
    }
    
    let make = "";
    let model = "";
    let year = 0;
    
    for (const result of data.Results) {
      if (result.Variable === "Make" && result.Value) {
        make = result.Value;
      }
      if (result.Variable === "Model" && result.Value) {
        model = result.Value;
      }
      if (result.Variable === "Model Year" && result.Value) {
        year = parseInt(result.Value, 10);
      }
    }
    
    if (!make || !model || !year) {
      return null;
    }
    
    return { make, model, year, vin };
  } catch (error) {
    console.error("Error decoding VIN:", error);
    return null;
  }
}

export async function fetchVehicleRecalls(
  make: string, 
  model: string, 
  year: number
): Promise<InsertVehicleRecall[]> {
  try {
    let url = "";
    if (model && year) {
      url = `${NHTSA_BASE_URL}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    } else {
      // If model or year is missing, try fetching by make only
      url = `${NHTSA_BASE_URL}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=&modelYear=`;
    }
    
    console.log(`Fetching NHTSA recalls: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`NHTSA API error: ${response.status} for ${url}`);
      return [];
    }
    
    const data = await response.json() as NHTSARecallResponse;
    // NHTSA API returns "results" (lowercase), handle both cases
    const resultsList = data.results || data.Results || [];
    console.log(`NHTSA response for ${make}: Count=${data.Count || 0}, Results=${resultsList.length}`);
    
    if (resultsList.length === 0) {
      return [];
    }
    
    return processResults(resultsList, make, model, year);
  } catch (error) {
    console.error("Error fetching vehicle recalls:", error);
    return [];
  }
}

function processResults(results: NHTSARecall[], make: string, model: string, year: number): InsertVehicleRecall[] {
  const recalls: InsertVehicleRecall[] = [];
  for (const recall of results) {
    if (!recall.NHTSACampaignNumber) continue;
    
    recalls.push({
      campaignNumber: recall.NHTSACampaignNumber,
      make: (recall.Make as string) || make,
      model: (recall.Model as string) || model,
      year: recall.ModelYear ? parseInt(String(recall.ModelYear)) : year,
      component: recall.Component || null,
      summary: recall.Summary || null,
      consequence: recall.Consequence || null,
      remedy: recall.Remedy || null,
      manufacturer: recall.Manufacturer || null,
      recallDate: recall.ReportReceivedDate || null,
      severity: determineSeverity(recall.Consequence as string),
      rawJson: JSON.stringify(recall),
    });
  }
  return recalls;
}

export function validateVIN(vin: string): { valid: boolean; error?: string } {
  if (!vin) {
    return { valid: false, error: "VIN is required" };
  }
  
  const cleanVin = vin.toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  if (cleanVin.length !== 17) {
    return { valid: false, error: "VIN must be exactly 17 characters" };
  }
  
  if (/[IOQ]/.test(cleanVin)) {
    return { valid: false, error: "VIN cannot contain I, O, or Q" };
  }
  
  if (!/^[A-Z0-9]+$/.test(cleanVin)) {
    return { valid: false, error: "VIN must be alphanumeric" };
  }
  
  return { valid: true };
}
