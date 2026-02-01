import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { NorthIndianChart } from "./NorthIndianChart";
import { WheelChart } from "./WheelChart";
import { ChartLegend } from "./ChartLegend";
import type { ChartData, BodyProfile } from "@shared/schema";

export type ChartType = 'diamond' | 'wheel';

interface HoroscopeSectionProps {
  profile: BodyProfile;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  lockChartType?: boolean;
}

export function HoroscopeSection({ profile, chartType, onChartTypeChange, lockChartType = false }: HoroscopeSectionProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [showHouseNumbers, setShowHouseNumbers] = useState(false);

  const chartData = profile.chartData;
  const isTimeUnknown = profile.derived.timeUnknown;
  
  if (!chartData) {
    return null;
  }

  return (
    <Card data-testid="card-horoscope-section">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-xl" data-testid="heading-horoscope">
            Horoscoopkaart
          </CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            {isTimeUnknown && (
              <Badge variant="outline" className="text-amber-600 border-amber-500" data-testid="badge-time-unknown">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Tijd onbekend: indicatief
              </Badge>
            )}
            
            <Badge variant="secondary" data-testid="badge-zodiac-mode-chart">
              {chartData.zodiacMode === 'sidereal' ? 'Sidereaal' : 'Tropisch'}
            </Badge>
            
            {chartData.ayanamsa && (
              <Badge variant="outline" data-testid="badge-ayanamsa-chart">
                Lahiri {chartData.ayanamsa.valueDegrees.toFixed(1)}°
              </Badge>
            )}
            
            <Badge variant="outline" data-testid="badge-house-system">
              {chartData.housesSystem}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!lockChartType && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Kaarttype:</span>
              <Select value={chartType} onValueChange={(v) => onChartTypeChange(v as ChartType)}>
                <SelectTrigger className="w-40" data-testid="select-chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diamond">Jyotish (diamant)</SelectItem>
                  <SelectItem value="wheel">Wiel (cirkel)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {chartType === 'diamond' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHouseNumbers(!showHouseNumbers)}
                data-testid="button-toggle-house-numbers"
              >
                {showHouseNumbers ? 'Huisnummers verbergen' : 'Huisnummers tonen'}
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-center py-4" data-testid="chart-container">
          {chartType === 'diamond' ? (
            <NorthIndianChart 
              chartData={chartData} 
              width={320}
              showHouseNumbers={showHouseNumbers}
            />
          ) : (
            <WheelChart 
              chartData={chartData} 
              width={320}
            />
          )}
        </div>

        <Collapsible open={showLegend} onOpenChange={setShowLegend}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-2 py-1 rounded-md" data-testid="button-toggle-legend">
            <ChevronDown className={`h-4 w-4 transition-transform ${showLegend ? 'rotate-180' : ''}`} />
            Legenda {showLegend ? 'verbergen' : 'tonen'}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <ChartLegend showSymbols={chartType === 'wheel'} />
          </CollapsibleContent>
        </Collapsible>

        {profile.derived.lagnaOptions && profile.derived.lagnaOptions.length > 1 && isTimeUnknown && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md" data-testid="info-lagna-options">
            <p className="font-medium mb-1">Meest waarschijnlijke Ascendanten:</p>
            <div className="flex gap-2 flex-wrap">
              {profile.derived.lagnaOptions.map((opt, i) => (
                <Badge key={i} variant="outline">
                  {opt.sign} ({opt.probability}%)
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-xs">
              Deze kaart toont de meest waarschijnlijke configuratie. De exacte posities kunnen afwijken zonder geboortetijd.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function getChartSVGString(chartType: 'diamond' | 'wheel'): string {
  const selector = chartType === 'diamond' 
    ? '[data-testid="svg-north-indian-chart"]' 
    : '[data-testid="svg-wheel-chart"]';
  const svgElement = document.querySelector(selector);
  if (svgElement) {
    return new XMLSerializer().serializeToString(svgElement);
  }
  return '';
}
