import type { ChartData, Planet } from "@shared/schema";

interface WheelChartProps {
  chartData: ChartData;
  width?: number;
  showRetrograde?: boolean;
}

const PLANET_SYMBOLS: Record<Planet, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋'
};

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

const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", cx, cy,
    "Z"
  ].join(" ");
}

export function WheelChart({ 
  chartData, 
  width = 300,
  showRetrograde = true 
}: WheelChartProps) {
  const cx = 150;
  const cy = 150;
  const outerRadius = 140;
  const innerRadius = 90;
  const planetRadius = 115;
  const signRadius = 125;

  const ascLon = chartData.zodiacMode === 'sidereal'
    ? chartData.lagna?.lonSiderealDeg ?? 0
    : chartData.lagna?.lonTropicalDeg ?? 0;

  const rotation = -ascLon;

  const planets = Object.entries(chartData.planets).map(([key, data]) => {
    const lon = chartData.zodiacMode === 'sidereal' 
      ? data.lonSiderealDeg 
      : data.lonTropicalDeg;
    return {
      key: key as Planet,
      lon,
      retrograde: data.retrograde,
      symbol: PLANET_SYMBOLS[key as Planet],
      abbr: PLANET_ABBR[key as Planet]
    };
  });

  const scale = width / 300;

  return (
    <svg 
      width={width} 
      height={width} 
      viewBox="0 0 300 300" 
      className="font-sans"
      data-testid="svg-wheel-chart"
    >
      <rect width="300" height="300" fill="hsl(var(--background))" rx="4" />
      
      <circle 
        cx={cx} 
        cy={cy} 
        r={outerRadius} 
        fill="none" 
        stroke="hsl(var(--border))" 
        strokeWidth="1.5" 
      />
      <circle 
        cx={cx} 
        cy={cy} 
        r={innerRadius} 
        fill="none" 
        stroke="hsl(var(--border))" 
        strokeWidth="1" 
      />

      <g transform={`rotate(${rotation} ${cx} ${cy})`}>
        {Array.from({ length: 12 }, (_, i) => {
          const startAngle = i * 30;
          const endAngle = (i + 1) * 30;
          const midAngle = startAngle + 15;
          const signPos = polarToCartesian(cx, cy, signRadius, midAngle);
          
          return (
            <g key={i}>
              <path
                d={describeArc(cx, cy, outerRadius, startAngle, endAngle)}
                fill={i % 2 === 0 ? "hsl(var(--muted)/0.3)" : "transparent"}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
              />
              <line
                x1={polarToCartesian(cx, cy, innerRadius, startAngle).x}
                y1={polarToCartesian(cx, cy, innerRadius, startAngle).y}
                x2={polarToCartesian(cx, cy, outerRadius, startAngle).x}
                y2={polarToCartesian(cx, cy, outerRadius, startAngle).y}
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
              />
              <text
                x={signPos.x}
                y={signPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize="12"
                transform={`rotate(${-rotation} ${signPos.x} ${signPos.y})`}
              >
                {SIGN_SYMBOLS[i]}
              </text>
            </g>
          );
        })}
      </g>

      <g>
        {planets.map((planet) => {
          const angle = planet.lon + rotation;
          const pos = polarToCartesian(cx, cy, planetRadius, angle);
          
          return (
            <g key={planet.key} data-testid={`planet-marker-${planet.key}`}>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className={planet.retrograde ? "fill-amber-600 dark:fill-amber-400" : "fill-foreground"}
                fontSize="11"
                fontWeight="500"
              >
                {planet.symbol}
              </text>
              {showRetrograde && planet.retrograde && (
                <text
                  x={pos.x + 8}
                  y={pos.y - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-amber-600 dark:fill-amber-400"
                  fontSize="6"
                >
                  R
                </text>
              )}
            </g>
          );
        })}
      </g>

      <g>
        <line
          x1={polarToCartesian(cx, cy, innerRadius - 5, rotation).x}
          y1={polarToCartesian(cx, cy, innerRadius - 5, rotation).y}
          x2={polarToCartesian(cx, cy, outerRadius + 5, rotation).x}
          y2={polarToCartesian(cx, cy, outerRadius + 5, rotation).y}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <text
          x={polarToCartesian(cx, cy, outerRadius + 12, rotation).x}
          y={polarToCartesian(cx, cy, outerRadius + 12, rotation).y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-primary font-bold"
          fontSize="8"
        >
          Asc
        </text>
      </g>

      <text
        x="150"
        y="150"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-muted-foreground"
        fontSize="7"
      >
        {chartData.zodiacMode === 'sidereal' ? 'Sidereaal' : 'Tropisch'}
      </text>
    </svg>
  );
}
