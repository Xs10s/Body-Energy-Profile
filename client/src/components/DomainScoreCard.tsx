import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Footprints, 
  Droplets, 
  Sun, 
  Heart, 
  MessageCircle, 
  Eye, 
  Sparkles 
} from "lucide-react";
import type { Domain, DomainScore } from "@shared/schema";
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from "@shared/schema";

interface DomainScoreCardProps {
  domain: Domain;
  score: DomainScore;
}

const DOMAIN_ICONS: Record<Domain, typeof Footprints> = {
  root: Footprints,
  sacral: Droplets,
  solar: Sun,
  heart: Heart,
  throat: MessageCircle,
  thirdEye: Eye,
  crown: Sparkles
};

const DOMAIN_COLORS: Record<Domain, string> = {
  root: "text-red-500 dark:text-red-400",
  sacral: "text-orange-500 dark:text-orange-400",
  solar: "text-yellow-500 dark:text-yellow-400",
  heart: "text-green-500 dark:text-green-400",
  throat: "text-blue-500 dark:text-blue-400",
  thirdEye: "text-indigo-500 dark:text-indigo-400",
  crown: "text-purple-500 dark:text-purple-400"
};

function getScoreLabel(value: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (value >= 65) return { label: "Sterk", variant: "default" };
  if (value >= 45) return { label: "Neutraal", variant: "secondary" };
  if (value >= 30) return { label: "Aandacht", variant: "destructive" };
  return { label: "Kwetsbaar", variant: "destructive" };
}

export function DomainScoreCard({ domain, score }: DomainScoreCardProps) {
  const Icon = DOMAIN_ICONS[domain];
  const color = DOMAIN_COLORS[domain];
  const label = DOMAIN_LABELS[domain];
  const description = DOMAIN_DESCRIPTIONS[domain];
  const scoreLabel = getScoreLabel(score.value);

  return (
    <Card className="hover-elevate" data-testid={`card-domain-${domain}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-muted ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold">{label}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold">{score.value}</span>
            <div className="flex items-center gap-2">
              <Badge variant={scoreLabel.variant}>{scoreLabel.label}</Badge>
              {score.timeSensitive && (
                <Badge variant="outline" className="text-xs">
                  Tijdgevoelig
                </Badge>
              )}
            </div>
          </div>

          <Progress value={score.value} className="h-2" />

          {score.spread > 0 && (
            <p className="text-xs text-muted-foreground">
              Bereik: {score.min} - {score.max}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
