import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, XCircle, Sparkles, TrendingUp, RotateCcw, Activity } from "lucide-react";
import type { ChakraProfile, Domain } from "@shared/schema";

interface ChakraProfileSectionProps {
  chakraProfiles: ChakraProfile[];
  timeUnknown?: boolean;
}

const CHAKRA_COLORS: Record<Domain, string> = {
  root: 'bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-400',
  sacral: 'bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-400',
  solar: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-700 dark:text-yellow-400',
  heart: 'bg-green-500/20 border-green-500/40 text-green-700 dark:text-green-400',
  throat: 'bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-400',
  thirdEye: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-700 dark:text-indigo-400',
  crown: 'bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-400'
};

const CHAKRA_PROGRESS_COLORS: Record<Domain, string> = {
  root: 'bg-red-500',
  sacral: 'bg-orange-500',
  solar: 'bg-yellow-500',
  heart: 'bg-green-500',
  throat: 'bg-blue-500',
  thirdEye: 'bg-indigo-500',
  crown: 'bg-purple-500'
};

function ScoreDisplay({ score, min, max, spread, timeSensitive, domain }: {
  score: number;
  min: number;
  max: number;
  spread: number;
  timeSensitive: boolean;
  domain: Domain;
}) {
  const colorClass = CHAKRA_PROGRESS_COLORS[domain];
  
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{score}</span>
          {spread > 0 && (
            <span className="text-muted-foreground text-xs">
              bereik: {min}-{max}
            </span>
          )}
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full rounded-full transition-all ${colorClass}`}
            style={{ width: `${score}%` }}
          />
          {spread > 0 && (
            <>
              <div 
                className="absolute top-0 h-full bg-muted-foreground/20"
                style={{ left: `${min}%`, width: `${spread}%` }}
              />
            </>
          )}
        </div>
      </div>
      {timeSensitive && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-500">
          <AlertTriangle className="h-3 w-3 mr-1" />
          tijdgevoelig
        </Badge>
      )}
    </div>
  );
}

function ChakraCard({ profile, defaultOpen = false }: { profile: ChakraProfile; defaultOpen?: boolean }) {
  const colorClass = CHAKRA_COLORS[profile.domain];

  return (
    <AccordionItem value={profile.domain} className="border rounded-lg mb-3 overflow-hidden">
      <AccordionTrigger className="px-4 py-3 hover:no-underline" data-testid={`accordion-trigger-${profile.domain}`}>
        <div className="flex items-center gap-4 w-full">
          <div className={`w-3 h-3 rounded-full ${CHAKRA_PROGRESS_COLORS[profile.domain]}`} />
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{profile.labelNL}</span>
              <span className="text-muted-foreground text-sm">({profile.sanskritName})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{profile.score}</span>
            {profile.score >= 60 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Sterk
              </Badge>
            )}
            {profile.score <= 40 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Aandacht
              </Badge>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-6">
          <ScoreDisplay 
            score={profile.score}
            min={profile.scoreMin}
            max={profile.scoreMax}
            spread={profile.scoreMax - profile.scoreMin}
            timeSensitive={profile.timeSensitive}
            domain={profile.domain}
          />

          <div className={`p-4 rounded-lg border ${colorClass}`}>
            <h4 className="font-semibold flex items-center gap-2 mb-3" data-testid={`heading-signals-${profile.domain}`}>
              <Activity className="h-4 w-4" />
              Horoscoop-signalen
            </h4>
            <ul className="space-y-2">
              {profile.signals.map((signal, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    signal.influence === 'supportive' ? 'bg-green-500' : 
                    signal.influence === 'challenging' ? 'bg-amber-500' : 'bg-muted-foreground'
                  }`} />
                  <span>
                    <span className="font-medium">{signal.factor}</span>
                    {signal.reason && ` → ${signal.reason}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2 mb-2" data-testid={`heading-trend-${profile.domain}`}>
              <Sparkles className="h-4 w-4" />
              Natuurlijke trend
            </h4>
            <p className="text-sm text-muted-foreground">{profile.naturalTrend}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-green-800 dark:text-green-300" data-testid={`heading-balanced-${profile.domain}`}>
                <CheckCircle2 className="h-4 w-4" />
                In balans
              </h4>
              <ul className="space-y-2">
                {profile.balanced.map((item, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-300" data-testid={`heading-imbalanced-${profile.domain}`}>
                <XCircle className="h-4 w-4" />
                In disbalans
              </h4>
              <ul className="space-y-2">
                {profile.imbalanced.map((item, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 mt-0.5">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold flex items-center gap-2 mb-3" data-testid={`heading-resets-${profile.domain}`}>
              <RotateCcw className="h-4 w-4 text-primary" />
              Praktische reset
            </h4>
            <ul className="space-y-2">
              {profile.practicalResets.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary font-bold">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ChakraProfileSection({ chakraProfiles, timeUnknown }: ChakraProfileSectionProps) {
  const defaultOpen = ['root', 'solar', 'thirdEye'];

  return (
    <Card data-testid="card-chakra-profile">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl" data-testid="heading-chakra-profile">
              Chakra-profiel op basis van horoscoop
            </CardTitle>
            <CardDescription className="mt-2">
              Gepersonaliseerde inzichten voor elk energiecentrum, afgeleid van je horoscoopfactoren
            </CardDescription>
          </div>
          {timeUnknown && (
            <Badge variant="outline" className="text-amber-600 border-amber-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Geboortetijd onbekend: indicatieve scores
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
          {chakraProfiles.map((profile) => (
            <ChakraCard 
              key={profile.domain} 
              profile={profile}
              defaultOpen={defaultOpen.includes(profile.domain)}
            />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
