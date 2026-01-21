import { useState } from "react";
import { ChevronDown, Bug } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DebugInfo } from "@shared/schema";

interface DebugPanelProps {
  debugInfo: DebugInfo;
}

export function DebugPanel({ debugInfo }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!debugInfo) {
    return null;
  }

  return (
    <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20" data-testid="card-debug-panel">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full" data-testid="button-debug-toggle">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bug className="h-4 w-4 text-amber-600" />
              Debug Informatie
            </CardTitle>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4 text-xs font-mono">
            <section>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Invoer (lokaal)</h4>
              <div className="grid grid-cols-2 gap-2 bg-background/50 rounded p-2">
                <div>Datum:</div>
                <div data-testid="debug-input-date">{debugInfo.inputLocal.date}</div>
                <div>Tijd:</div>
                <div data-testid="debug-input-time">{debugInfo.inputLocal.time}</div>
                <div>Plaats:</div>
                <div data-testid="debug-input-place">{debugInfo.inputLocal.place}</div>
              </div>
            </section>

            <section>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Geïnterpreteerde waarden</h4>
              <div className="grid grid-cols-2 gap-2 bg-background/50 rounded p-2">
                <div>Tijdzone:</div>
                <div data-testid="debug-timezone">{debugInfo.interpreted.timezone}</div>
                <div>Zomertijd (DST):</div>
                <div data-testid="debug-dst">
                  <Badge variant={debugInfo.interpreted.isDST ? "default" : "secondary"}>
                    {debugInfo.interpreted.isDST ? "Ja" : "Nee"}
                  </Badge>
                </div>
                <div>Offset:</div>
                <div data-testid="debug-offset">{debugInfo.interpreted.offsetMinutes >= 0 ? '+' : ''}{debugInfo.interpreted.offsetMinutes / 60}u</div>
                <div>Lokaal (ISO):</div>
                <div className="break-all" data-testid="debug-local-iso">{debugInfo.interpreted.localDatetimeISO}</div>
                <div>UTC (ISO):</div>
                <div className="break-all" data-testid="debug-utc-iso">{debugInfo.interpreted.utcDatetimeISO}</div>
                <div>Lat/Lon:</div>
                <div data-testid="debug-latlon">{debugInfo.interpreted.latitude.toFixed(4)}° / {debugInfo.interpreted.longitude.toFixed(4)}°</div>
              </div>
            </section>

            <section>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Astrologische configuratie</h4>
              <div className="grid grid-cols-2 gap-2 bg-background/50 rounded p-2">
                <div>Dierenriem:</div>
                <div data-testid="debug-zodiac-mode">
                  <Badge variant={debugInfo.astroConfig.zodiacMode === 'sidereal' ? "default" : "outline"}>
                    {debugInfo.astroConfig.zodiacMode === 'sidereal' ? 'Sidereaal (Jyotish)' : 'Tropisch (Westers)'}
                  </Badge>
                </div>
                <div>Ayanamsa:</div>
                <div data-testid="debug-ayanamsa">
                  {debugInfo.astroConfig.ayanamsaDegrees !== null 
                    ? `${debugInfo.astroConfig.ayanamsaDegrees.toFixed(4)}°` 
                    : 'N.v.t.'}
                </div>
                <div>Huizensysteem:</div>
                <div data-testid="debug-house-system">{debugInfo.astroConfig.houseSystem}</div>
              </div>
            </section>

            <section>
              <h4 className="font-semibold text-sm mb-2 text-foreground">Resultaten (beide systemen)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1">Planeet</th>
                      <th className="py-1">Tropisch (°)</th>
                      <th className="py-1">Teken (T)</th>
                      <th className="py-1">Sidereaal (°)</th>
                      <th className="py-1">Teken (S)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">Zon</td>
                      <td data-testid="debug-sun-tropical-lon">{debugInfo.results.sunLonTropical.toFixed(2)}°</td>
                      <td data-testid="debug-sun-tropical-sign">{debugInfo.results.sunSignTropical}</td>
                      <td data-testid="debug-sun-sidereal-lon">{debugInfo.results.sunLonSidereal.toFixed(2)}°</td>
                      <td data-testid="debug-sun-sidereal-sign">{debugInfo.results.sunSignSidereal}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Maan</td>
                      <td data-testid="debug-moon-tropical-lon">{debugInfo.results.moonLonTropical.toFixed(2)}°</td>
                      <td data-testid="debug-moon-tropical-sign">{debugInfo.results.moonSignTropical}</td>
                      <td data-testid="debug-moon-sidereal-lon">{debugInfo.results.moonLonSidereal.toFixed(2)}°</td>
                      <td data-testid="debug-moon-sidereal-sign">{debugInfo.results.moonSignSidereal}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Ascendant</td>
                      <td data-testid="debug-asc-tropical-lon">{debugInfo.results.ascLonTropical?.toFixed(2) ?? '-'}°</td>
                      <td data-testid="debug-asc-tropical-sign">{debugInfo.results.ascSignTropical ?? '-'}</td>
                      <td data-testid="debug-asc-sidereal-lon">{debugInfo.results.ascLonSidereal?.toFixed(2) ?? '-'}°</td>
                      <td data-testid="debug-asc-sidereal-sign">{debugInfo.results.ascSignSidereal ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {debugInfo.warnings.length > 0 && (
              <section>
                <h4 className="font-semibold text-sm mb-2 text-amber-600">Waarschuwingen</h4>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400">
                  {debugInfo.warnings.map((warning, i) => (
                    <li key={i} data-testid={`debug-warning-${i}`}>{warning}</li>
                  ))}
                </ul>
              </section>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
