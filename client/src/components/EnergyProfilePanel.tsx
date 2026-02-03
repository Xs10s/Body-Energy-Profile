import type { EnergyProfileResult } from "@shared/energyProfile";

interface EnergyProfilePanelProps {
  result: EnergyProfileResult;
}

function renderRatio(value: number) {
  return value.toFixed(3);
}

export function EnergyProfilePanel({ result }: EnergyProfilePanelProps) {
  const bazi = result.chinese_bazi;
  return (
    <section className="space-y-6" data-testid="bazi-panel">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-semibold">Variant 03 kernresultaat</h2>
        <div className="grid gap-2 text-sm text-muted-foreground mt-2">
          <div>UTC: {result.birth_utc_datetime}</div>
          <div>Lokaal: {result.birth_local_datetime_resolved}</div>
          <div>Offset (min): {result.tz_offset_minutes_at_birth}</div>
          <div>Lat/Lon: {result.latitude}, {result.longitude}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-base font-semibold">Pilaren</h3>
        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
          {Object.entries(bazi.pillars).map(([pillarId, pillar]) => (
            <div key={pillarId} className="rounded border p-3 bg-background">
              <div className="font-medium">{pillarId}</div>
              <div className="text-muted-foreground">{pillar.stem_id} · {pillar.branch_id}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-base font-semibold">Dagmeester</h3>
        <div className="text-sm text-muted-foreground mt-2">
          {bazi.day_master.stem_id} · {bazi.day_master.element_id} · {bazi.day_master.polarity_id}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-base font-semibold">Elementbalans (zichtbaar)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          {Object.entries(bazi.elements_visible).map(([elementId, balance]) => (
            <div key={elementId} className="flex items-center justify-between">
              <span>{elementId}</span>
              <span>{balance.count} · {renderRatio(balance.ratio)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-base font-semibold">Polarity (zichtbaar)</h3>
        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
          {Object.entries(bazi.polarity_visible).map(([polarityId, balance]) => (
            <div key={polarityId} className="flex items-center justify-between">
              <span>{polarityId}</span>
              <span>{balance.count} · {renderRatio(balance.ratio)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-base font-semibold">Raw JSON</h3>
        <pre className="mt-2 text-xs overflow-auto max-h-80 bg-background rounded p-3">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </section>
  );
}
