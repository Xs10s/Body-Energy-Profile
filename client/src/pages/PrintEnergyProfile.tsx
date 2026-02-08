import { useEffect, useMemo, useState } from "react";
import { SummaryHeader } from "@/components/SummaryHeader";
import { ChakraProfileSection } from "@/components/ChakraProfileSection";
import { DomainScoreCard } from "@/components/DomainScoreCard";
import { ProfileSectionCard } from "@/components/ProfileSection";
import { EnergyProfilePanel } from "@/components/EnergyProfilePanel";
import type { BodyProfile, Domain, ChineseMethod, EnergyScoringResult as UnifiedEnergyScoringResult } from "@shared/schema";
import { DOMAINS } from "@shared/schema";
import type { EnergyProfileResult } from "@shared/energyProfile";
import { normalizeVariantId, VARIANT_LABELS, VARIANT_TO_VIEW, VARIANT_TO_ZODIAC_MODE } from "@shared/variant";

export default function PrintEnergyProfile() {
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [energyProfile, setEnergyProfile] = useState<EnergyProfileResult | null>(null);
  const [energyScoring, setEnergyScoring] = useState<UnifiedEnergyScoringResult | null>(null);
  const [exportReady, setExportReady] = useState(false);
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const profileId = searchParams.get("profile_id") || "";
  const variantId = normalizeVariantId(searchParams.get("variant_id")) ?? "variant_01";
  const view = VARIANT_TO_VIEW[variantId];
  const chineseMethod = (searchParams.get("chinese_method") as ChineseMethod | null) ?? "bazi";

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!profileId) return;
      const profileRes = await fetch(`/api/profiles/${encodeURIComponent(profileId)}`, {
        credentials: "include",
      });
      if (!profileRes.ok) {
        return;
      }
      const saved = await profileRes.json();
      const input = saved?.profile?.input;
      if (!input) return;

      if (view === "bazi") {
        const res = await fetch("/api/energy-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: { ...input, zodiacMode: VARIANT_TO_ZODIAC_MODE[variantId] } }),
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setEnergyProfile(data);
        const scoringRes = await fetch("/api/energy-scoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: { ...input, zodiacMode: VARIANT_TO_ZODIAC_MODE[variantId] }, selection: { system: "chinese", method: chineseMethod } }), credentials: "include" });
        if (scoringRes.ok) setEnergyScoring(await scoringRes.json());
        setProfile(null);
      } else {
        const res = await fetch("/api/profiles/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: { ...input, zodiacMode: VARIANT_TO_ZODIAC_MODE[variantId] }, view }),
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setProfile(data);
        setEnergyProfile(null);
        setEnergyScoring(null);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [profileId, variantId, view, chineseMethod]);

  useEffect(() => {
    if (!profile && !energyProfile) return;
    let cancelled = false;
    async function markReady() {
      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      } finally {
        if (!cancelled) {
          setExportReady(true);
        }
      }
    }
    markReady();
    return () => {
      cancelled = true;
    };
  }, [profile, energyProfile]);

  return (
    <div className="min-h-screen bg-background text-foreground no-animations">
      <style>
        {`
          .print-root { width: 1080px; margin: 0 auto; }
          .no-animations * { animation: none !important; transition: none !important; }
          @media print {
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>
      <div
        className="print-root py-8 space-y-8"
        data-export-ready={exportReady ? "true" : undefined}
      >
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold">{VARIANT_LABELS[variantId]}</h1>
          <p className="text-sm text-muted-foreground">energy-profile print</p>
        </section>

        {view !== "bazi" && profile ? (
          <>
            <SummaryHeader profile={profile} />

            <ChakraProfileSection 
              chakraProfiles={profile.chakraProfiles}
              timeUnknown={profile.derived.timeUnknown}
            />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Domeinscores</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOMAINS.map((domain) => (
                  <DomainScoreCard 
                    key={domain} 
                    domain={domain as Domain} 
                    score={profile.domainScores[domain as Domain]} 
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Jouw profiel</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileSectionCard type="strengths" section={profile.sections.strengths} />
                <ProfileSectionCard type="weaknesses" section={profile.sections.weaknesses} />
                <ProfileSectionCard type="base" section={profile.sections.base} />
                <ProfileSectionCard type="nutrition" section={profile.sections.nutrition} />
                <ProfileSectionCard type="movement" section={profile.sections.movement} />
                <ProfileSectionCard type="strengthBuilding" section={profile.sections.strengthBuilding} />
                <ProfileSectionCard type="flexibility" section={profile.sections.flexibility} />
                <ProfileSectionCard type="functionality" section={profile.sections.functionality} />
              </div>
            </section>
          </>
        ) : null}

        {view === "bazi" && (energyProfile || energyScoring) ? (
          <>
            {energyScoring ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Domeinscores ({energyScoring.method === "shengxiao" ? "Shengxiao" : "BaZi"})</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {energyScoring.domains.map((domainResult) => (
                    <DomainScoreCard
                      key={domainResult.domainId}
                      domain={domainResult.domainId as Domain}
                      score={{ value: domainResult.score, min: domainResult.scoreMin, max: domainResult.scoreMax, spread: domainResult.spread, timeSensitive: energyScoring.time.timeSensitive }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {chineseMethod === "bazi" && energyProfile ? <EnergyProfilePanel result={energyProfile} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
