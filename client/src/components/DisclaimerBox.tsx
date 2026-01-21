import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Disclaimer } from "@shared/schema";

interface DisclaimerBoxProps {
  disclaimer: Disclaimer;
}

export function DisclaimerBox({ disclaimer }: DisclaimerBoxProps) {
  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30" data-testid="card-disclaimer">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="shrink-0">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" data-testid="icon-warning" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2" data-testid="heading-disclaimer">
                Belangrijke disclaimer
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300" data-testid="text-disclaimer">
                {disclaimer.text}
              </p>
            </div>

            <div>
              <h5 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-2" data-testid="heading-when-to-consult">
                Wanneer een professional raadplegen:
              </h5>
              <ul className="space-y-1" data-testid="list-when-to-consult">
                {disclaimer.whenToConsult.map((item, index) => (
                  <li key={index} className="flex gap-2 text-sm text-amber-700 dark:text-amber-300" data-testid={`text-consult-item-${index}`}>
                    <span className="text-amber-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
