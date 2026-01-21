import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Zap, 
  AlertCircle, 
  Compass, 
  Utensils, 
  Activity, 
  Dumbbell, 
  Expand, 
  Settings 
} from "lucide-react";
import type { ProfileSection as ProfileSectionType } from "@shared/schema";

interface ProfileSectionProps {
  type: 'strengths' | 'weaknesses' | 'base' | 'nutrition' | 'movement' | 'strengthBuilding' | 'flexibility' | 'functionality';
  section: ProfileSectionType;
}

const SECTION_CONFIG = {
  strengths: { icon: Zap, title: 'Sterktes', color: 'text-green-500 dark:text-green-400' },
  weaknesses: { icon: AlertCircle, title: 'Aandachtspunten', color: 'text-amber-500 dark:text-amber-400' },
  base: { icon: Compass, title: 'Basis', color: 'text-blue-500 dark:text-blue-400' },
  nutrition: { icon: Utensils, title: 'Voeding', color: 'text-orange-500 dark:text-orange-400' },
  movement: { icon: Activity, title: 'Beweging', color: 'text-cyan-500 dark:text-cyan-400' },
  strengthBuilding: { icon: Dumbbell, title: 'Krachtopbouw', color: 'text-red-500 dark:text-red-400' },
  flexibility: { icon: Expand, title: 'Flexibiliteit', color: 'text-purple-500 dark:text-purple-400' },
  functionality: { icon: Settings, title: 'Functionaliteit', color: 'text-indigo-500 dark:text-indigo-400' }
};

export function ProfileSectionCard({ type, section }: ProfileSectionProps) {
  const config = SECTION_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card data-testid={`card-section-${type}`}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
        <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2" data-testid={`list-bullets-${type}`}>
          {section.bullets.map((bullet, index) => (
            <li key={index} className="flex gap-3 text-sm" data-testid={`bullet-${type}-${index}`}>
              <span className="text-muted-foreground mt-1">•</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-paragraph-${type}`}>
          {section.paragraph}
        </p>

        <div className="pl-4 py-3 bg-muted rounded-md" data-testid={`callout-nextstep-${type}`}>
          <p className="text-sm font-medium">
            <span className="font-semibold">Volgende stap:</span>{" "}
            {section.nextStep}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
