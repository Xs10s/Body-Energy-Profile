import type { Planet } from "@shared/schema";

interface ChartLegendProps {
  showSymbols?: boolean;
}

const PLANETS: Array<{ key: Planet; nameNL: string; abbr: string; symbol: string }> = [
  { key: 'Sun', nameNL: 'Zon', abbr: 'Zo', symbol: '☉' },
  { key: 'Moon', nameNL: 'Maan', abbr: 'Ma', symbol: '☽' },
  { key: 'Mars', nameNL: 'Mars', abbr: 'Mr', symbol: '♂' },
  { key: 'Mercury', nameNL: 'Mercurius', abbr: 'Me', symbol: '☿' },
  { key: 'Jupiter', nameNL: 'Jupiter', abbr: 'Ju', symbol: '♃' },
  { key: 'Venus', nameNL: 'Venus', abbr: 'Ve', symbol: '♀' },
  { key: 'Saturn', nameNL: 'Saturnus', abbr: 'Sa', symbol: '♄' },
  { key: 'Rahu', nameNL: 'Rahu', abbr: 'Ra', symbol: '☊' },
  { key: 'Ketu', nameNL: 'Ketu', abbr: 'Ke', symbol: '☋' }
];

const SIGNS: Array<{ index: number; nameNL: string; symbol: string }> = [
  { index: 0, nameNL: 'Ram', symbol: '♈' },
  { index: 1, nameNL: 'Stier', symbol: '♉' },
  { index: 2, nameNL: 'Tweelingen', symbol: '♊' },
  { index: 3, nameNL: 'Kreeft', symbol: '♋' },
  { index: 4, nameNL: 'Leeuw', symbol: '♌' },
  { index: 5, nameNL: 'Maagd', symbol: '♍' },
  { index: 6, nameNL: 'Weegschaal', symbol: '♎' },
  { index: 7, nameNL: 'Schorpioen', symbol: '♏' },
  { index: 8, nameNL: 'Boogschutter', symbol: '♐' },
  { index: 9, nameNL: 'Steenbok', symbol: '♑' },
  { index: 10, nameNL: 'Waterman', symbol: '♒' },
  { index: 11, nameNL: 'Vissen', symbol: '♓' }
];

export function ChartLegend({ showSymbols = false }: ChartLegendProps) {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs" data-testid="chart-legend">
      <div>
        <h4 className="font-semibold mb-2 text-sm">Planeten</h4>
        <div className="grid grid-cols-3 gap-1">
          {PLANETS.map((planet) => (
            <div key={planet.key} className="flex items-center gap-1">
              <span className="text-muted-foreground w-5">
                {showSymbols ? planet.symbol : planet.abbr}
              </span>
              <span>{planet.nameNL}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-muted-foreground">
          <span className="text-amber-600 dark:text-amber-400">R</span> = retrograde
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2 text-sm">Tekens</h4>
        <div className="grid grid-cols-3 gap-1">
          {SIGNS.map((sign) => (
            <div key={sign.index} className="flex items-center gap-1">
              <span className="text-muted-foreground w-4">{sign.symbol}</span>
              <span>{sign.nameNL}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
