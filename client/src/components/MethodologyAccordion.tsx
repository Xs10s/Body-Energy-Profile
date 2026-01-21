import { Book, ChevronDown, TrendingUp, TrendingDown, Star, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { Methodology } from "@shared/schema";

interface MethodologyAccordionProps {
  methodology: Methodology;
  showChartData?: boolean;
}

export function MethodologyAccordion({ methodology, showChartData = false }: MethodologyAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const highlights = methodology.chartHighlights;

  return (
    <Card data-testid="card-methodology">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full" data-testid="button-methodology-toggle">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <Book className="h-5 w-5" />
              </div>
              <span className="font-semibold">Bekijk methodologie</span>
            </div>
            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </CardContent>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            <div className="border-t pt-4 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-methodology-short">
                {methodology.short}
              </p>

              {highlights && (
                <div className="space-y-4" data-testid="section-chart-highlights">
                  <h4 className="font-medium text-sm">Horoscoop hoogtepunten:</h4>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Sterkste planeten:</span>
                      </div>
                      <div className="space-y-1 pl-6" data-testid="list-strong-planets">
                        {highlights.strongestPlanets.map((p, i) => (
                          <div key={i} className="text-sm text-muted-foreground" data-testid={`text-strong-planet-${i}`}>
                            {p.planet}: {p.reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Verzwakte planeten:</span>
                      </div>
                      <div className="space-y-1 pl-6" data-testid="list-stressed-planets">
                        {highlights.stressedPlanets.map((p, i) => (
                          <div key={i} className="text-sm text-muted-foreground" data-testid={`text-stressed-planet-${i}`}>
                            {p.planet}: {p.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Waarom sterke domeinen:</span>
                      </div>
                      <div className="space-y-1 pl-6" data-testid="list-top-domains">
                        {highlights.topDomains.map((d, i) => (
                          <div key={i} className="text-sm text-muted-foreground" data-testid={`text-top-domain-${i}`}>
                            <Badge variant="secondary" className="mr-2">{d.domain}</Badge>
                            {d.reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Waarom aandachtspunten:</span>
                      </div>
                      <div className="space-y-1 pl-6" data-testid="list-low-domains">
                        {highlights.lowDomains.map((d, i) => (
                          <div key={i} className="text-sm text-muted-foreground" data-testid={`text-low-domain-${i}`}>
                            <Badge variant="outline" className="mr-2">{d.domain}</Badge>
                            {d.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Technische details:</h4>
                <ul className="space-y-1" data-testid="list-methodology-details">
                  {methodology.details.map((detail, index) => (
                    <li key={index} className="flex gap-2 text-sm text-muted-foreground" data-testid={`text-methodology-detail-${index}`}>
                      <span className="text-muted-foreground">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
