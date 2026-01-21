import type { ChartData, Planet } from "@shared/schema";

interface NorthIndianChartProps {
  chartData: ChartData;
  width?: number;
  showHouseNumbers?: boolean;
  showRetrograde?: boolean;
}

const PLANET_ABBR: Record<Planet, string> = {
  Sun: 'Zo',
  Moon: 'Ma',
  Mars: 'Mr',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke'
};

const SIGNS_NL_SHORT = [
  'Ram', 'Sti', 'Twe', 'Kre', 'Lee', 'Maa',
  'Wee', 'Sch', 'Bog', 'Ste', 'Wat', 'Vis'
];

function getHouseForPlanet(lagnaSign: number, planetSign: number): number {
  return ((planetSign - lagnaSign + 12) % 12) + 1;
}

const HOUSE_PATHS: Record<number, { path: string; textX: number; textY: number }> = {
  1: { path: "M 150,0 L 225,75 L 150,150 L 75,75 Z", textX: 150, textY: 75 },
  2: { path: "M 75,75 L 150,0 L 75,0 L 0,75 Z", textX: 75, textY: 50 },
  3: { path: "M 0,75 L 75,0 L 0,0 L 0,75 Z", textX: 25, textY: 25 },
  4: { path: "M 0,75 L 0,150 L 75,225 L 75,75 Z", textX: 37, textY: 150 },
  5: { path: "M 0,150 L 0,225 L 75,225 Z", textX: 25, textY: 210 },
  6: { path: "M 0,225 L 75,225 L 150,300 L 0,300 Z", textX: 75, textY: 270 },
  7: { path: "M 75,225 L 150,150 L 225,225 L 150,300 Z", textX: 150, textY: 225 },
  8: { path: "M 150,300 L 225,225 L 300,300 L 225,300 Z", textX: 225, textY: 270 },
  9: { path: "M 225,225 L 300,225 L 300,300 Z", textX: 275, textY: 255 },
  10: { path: "M 225,75 L 225,225 L 300,150 L 300,75 Z", textX: 262, textY: 150 },
  11: { path: "M 300,0 L 225,0 L 300,75 Z", textX: 275, textY: 25 },
  12: { path: "M 150,0 L 225,75 L 225,0 L 300,0 L 300,75 Z", textX: 225, textY: 50 }
};

export function NorthIndianChart({ 
  chartData, 
  width = 300, 
  showHouseNumbers = false,
  showRetrograde = true 
}: NorthIndianChartProps) {
  const lagnaSign = chartData.zodiacMode === 'sidereal' 
    ? chartData.lagna?.signSidereal ?? 0
    : chartData.lagna?.signTropical ?? 0;

  const planetsByHouse: Record<number, Array<{ abbr: string; retrograde: boolean }>> = {};
  for (let h = 1; h <= 12; h++) {
    planetsByHouse[h] = [];
  }

  for (const [planetKey, planetData] of Object.entries(chartData.planets)) {
    const planetSign = chartData.zodiacMode === 'sidereal'
      ? planetData.signSidereal
      : planetData.signTropical;
    const house = getHouseForPlanet(lagnaSign, planetSign);
    const abbr = PLANET_ABBR[planetKey as Planet];
    planetsByHouse[house].push({ 
      abbr: abbr + (showRetrograde && planetData.retrograde ? 'R' : ''),
      retrograde: planetData.retrograde 
    });
  }

  const signsByHouse: Record<number, string> = {};
  for (let h = 1; h <= 12; h++) {
    const signIndex = (lagnaSign + h - 1) % 12;
    signsByHouse[h] = SIGNS_NL_SHORT[signIndex];
  }

  const scale = width / 300;

  return (
    <svg 
      width={width} 
      height={width} 
      viewBox="0 0 300 300" 
      className="font-sans"
      data-testid="svg-north-indian-chart"
    >
      <rect width="300" height="300" fill="hsl(var(--background))" rx="4" />
      
      <g stroke="hsl(var(--border))" strokeWidth="1.5" fill="none">
        <rect x="0" y="0" width="300" height="300" />
        <line x1="0" y1="0" x2="150" y2="150" />
        <line x1="300" y1="0" x2="150" y2="150" />
        <line x1="0" y1="300" x2="150" y2="150" />
        <line x1="300" y1="300" x2="150" y2="150" />
        <line x1="0" y1="150" x2="75" y2="75" />
        <line x1="0" y1="150" x2="75" y2="225" />
        <line x1="300" y1="150" x2="225" y2="75" />
        <line x1="300" y1="150" x2="225" y2="225" />
        <line x1="150" y1="0" x2="75" y2="75" />
        <line x1="150" y1="0" x2="225" y2="75" />
        <line x1="150" y1="300" x2="75" y2="225" />
        <line x1="150" y1="300" x2="225" y2="225" />
      </g>

      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((house) => {
        const { textX, textY } = HOUSE_PATHS[house];
        const planets = planetsByHouse[house];
        const signName = signsByHouse[house];
        const isLagna = house === 1;

        return (
          <g key={house}>
            <text
              x={textX}
              y={textY - 15}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="8"
              data-testid={`text-sign-house-${house}`}
            >
              {signName}
            </text>

            {showHouseNumbers && (
              <text
                x={textX}
                y={textY - 5}
                textAnchor="middle"
                className="fill-muted-foreground/50"
                fontSize="7"
              >
                H{house}
              </text>
            )}

            {isLagna && (
              <text
                x={textX}
                y={textY + 5}
                textAnchor="middle"
                className="fill-primary font-bold"
                fontSize="10"
                data-testid="text-lagna-marker"
              >
                Asc
              </text>
            )}

            {planets.map((planet, idx) => (
              <text
                key={planet.abbr}
                x={textX}
                y={textY + (isLagna ? 18 : 8) + (idx * 11)}
                textAnchor="middle"
                className={planet.retrograde ? "fill-amber-600 dark:fill-amber-400" : "fill-foreground"}
                fontSize="9"
                fontWeight="500"
                data-testid={`text-planet-${planet.abbr.replace('R', '')}-house-${house}`}
              >
                {planet.abbr}
              </text>
            ))}
          </g>
        );
      })}

      <text
        x="150"
        y="295"
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="7"
      >
        {chartData.zodiacMode === 'sidereal' ? 'Sidereaal' : 'Tropisch'} • Whole Sign
      </text>
    </svg>
  );
}
