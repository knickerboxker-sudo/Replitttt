import { AlertCircle, ChevronDown, ChevronUp, Building2, Calendar, Car, Package, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Recall, VehicleRecall, ProductRecall } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";

type AnyRecall = Recall | VehicleRecall | ProductRecall;

interface RecallCardProps {
  recall: AnyRecall;
}

function isVehicleRecall(recall: AnyRecall): recall is VehicleRecall {
  return "campaignNumber" in recall && "component" in recall;
}

function isProductRecall(recall: AnyRecall): recall is ProductRecall {
  return "recallNumber" in recall && "hazard" in recall;
}

function isFoodRecall(recall: AnyRecall): recall is Recall {
  return "recallId" in recall && "classification" in recall;
}

const categoryStyles = {
  food: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    badge: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Utensils,
  },
  vehicle: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Car,
  },
  product: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Package,
  },
};

const classificationStyles = {
  "Class I": "bg-red-500/20 text-red-400 border-red-500/30",
  "Class II": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Class III": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export function RecallCard({ recall }: RecallCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const category = isVehicleRecall(recall) ? "vehicle" : isProductRecall(recall) ? "product" : "food";
  const styles = categoryStyles[category];
  const Icon = styles.icon;
  
  const formatRecallDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "Unknown";
    try {
      if (dateStr.match(/^\d{8}$/)) {
        return format(new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')), "MMM d, yyyy");
      }
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const getTitle = (): string => {
    if (isVehicleRecall(recall)) {
      return `${recall.make || ""} ${recall.model || ""} ${recall.year || ""}`.trim() || "Unknown Vehicle";
    }
    if (isProductRecall(recall)) {
      return recall.productName || "Unknown Product";
    }
    return recall.productDescription || "Unknown Product";
  };

  const getDescription = (): string | null => {
    if (isVehicleRecall(recall)) {
      return recall.summary || recall.component;
    }
    if (isProductRecall(recall)) {
      return recall.hazard || recall.description;
    }
    return recall.reason;
  };

  const getCompany = (): string => {
    if (isVehicleRecall(recall)) {
      return recall.manufacturer || recall.make || "Unknown";
    }
    if (isProductRecall(recall)) {
      return recall.manufacturer || "Unknown";
    }
    return recall.company || "Unknown";
  };

  const getBadgeLabel = (): string => {
    if (isVehicleRecall(recall)) {
      return recall.severity || "Vehicle Recall";
    }
    if (isProductRecall(recall)) {
      return "Product Recall";
    }
    return recall.classification || "Food Recall";
  };

  const getBadgeStyle = (): string => {
    if (isFoodRecall(recall) && recall.classification) {
      return classificationStyles[recall.classification as keyof typeof classificationStyles] || styles.badge;
    }
    if (isVehicleRecall(recall) && recall.severity === "High") {
      return "bg-red-500/20 text-red-400 border-red-500/30";
    }
    return styles.badge;
  };

  const getRecallId = (): string => {
    if (isVehicleRecall(recall)) return recall.campaignNumber || String(recall.id);
    if (isProductRecall(recall)) return recall.recallNumber || String(recall.id);
    return recall.recallId;
  };

  return (
    <Card 
      className={cn(
        "relative overflow-visible border transition-all duration-200 cursor-pointer hover-elevate",
        expanded ? styles.bg : "bg-card",
        expanded ? styles.border : "border-border"
      )}
      onClick={() => setExpanded(!expanded)}
      data-testid={`recall-card-${getRecallId()}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            expanded ? styles.bg : "bg-muted/50"
          )}>
            <Icon className={cn(
              "w-4 h-4",
              expanded ? "text-current" : "text-muted-foreground"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge 
                variant="outline" 
                className={cn("text-xs font-medium", getBadgeStyle())}
              >
                {getBadgeLabel()}
              </Badge>
            </div>
            
            <h4 className={cn(
              "font-medium text-sm mb-1",
              expanded ? "" : "line-clamp-2"
            )}>
              {getTitle()}
            </h4>
            
            {expanded && (
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{getCompany()}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reported: {formatRecallDate(recall.recallDate)}</span>
                </div>
                {getDescription() && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-muted-foreground leading-relaxed">
                      {getDescription()}
                    </p>
                  </div>
                )}
                {isVehicleRecall(recall) && recall.remedy && (
                  <div className="pt-2">
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">Remedy: </span>
                      {recall.remedy}
                    </p>
                  </div>
                )}
                {isProductRecall(recall) && recall.remedy && (
                  <div className="pt-2">
                    <p className="text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">Remedy: </span>
                      {recall.remedy}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="shrink-0">
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RecallCardSkeleton() {
  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="w-16 h-5 rounded bg-muted animate-pulse" />
            <div className="w-full h-4 rounded bg-muted animate-pulse" />
            <div className="w-3/4 h-4 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
