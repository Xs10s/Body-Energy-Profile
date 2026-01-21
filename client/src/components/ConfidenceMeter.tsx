import { CheckCircle, Info, AlertTriangle, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Confidence } from "@shared/schema";

interface ConfidenceMeterProps {
  confidence: Confidence;
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const config = {
    high: {
      value: 95,
      icon: CheckCircle,
      label: "Hoge betrouwbaarheid",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500",
      badgeVariant: "default" as const
    },
    medium: {
      value: 65,
      icon: Info,
      label: "Gemiddelde betrouwbaarheid",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500",
      badgeVariant: "secondary" as const
    },
    low: {
      value: 35,
      icon: AlertTriangle,
      label: "Lage betrouwbaarheid",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500",
      badgeVariant: "destructive" as const
    }
  };

  const current = config[confidence.level];
  const Icon = current.icon;

  return (
    <div className="space-y-3" data-testid="confidence-meter">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${current.color}`} data-testid="icon-confidence" />
        <span className="font-semibold" data-testid="text-confidence-label">{current.label}</span>
        <Badge variant={current.badgeVariant} data-testid="badge-confidence-level">
          {confidence.level === "high" ? "100%" : confidence.level === "medium" ? "65%" : "35%"}
        </Badge>
      </div>

      <Progress 
        value={current.value} 
        className="h-2" 
        data-testid="progress-confidence"
      />

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger 
          className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-2 py-1 rounded-md"
          data-testid="button-confidence-details"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          Wat betekent dit?
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <ul className="space-y-2 text-sm text-muted-foreground" data-testid="list-confidence-notes">
            {confidence.notes.map((note, index) => (
              <li key={index} className="flex gap-2" data-testid={`text-confidence-note-${index}`}>
                <span className="text-muted-foreground">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
