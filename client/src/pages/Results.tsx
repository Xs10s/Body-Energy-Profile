import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SummaryHeader } from "@/components/SummaryHeader";
import { DomainScoreCard } from "@/components/DomainScoreCard";
import { ProfileSectionCard } from "@/components/ProfileSection";
import { MethodologyAccordion } from "@/components/MethodologyAccordion";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { DebugPanel } from "@/components/DebugPanel";
import { HoroscopeSection, type ChartType } from "@/components/HoroscopeSection";
import { ChakraProfileSection } from "@/components/ChakraProfileSection";
import { BaZiSummaryHeader } from "@/components/BaZiSummaryHeader";
import { EnergyProfilePanel } from "@/components/EnergyProfilePanel";
import { useToast } from "@/hooks/use-toast";
import { useNarrative } from "@/hooks/useNarrative";
import { apiRequest } from "@/lib/queryClient";
import { mergeNarrativeIntoProfile } from "@shared/llmNarratives";
import type { BodyProfile, ChineseMethod, Domain, EnergyScoringResult, ProfileInput } from "@shared/schema";
import { DOMAINS } from "@shared/schema";
import type { EnergyProfileResult } from "@shared/energyProfile";
import { generateProfileByView, normalizeAstroView } from "@shared/profileBuilder";
import type { AstroView } from "@shared/schema";
import {
  normalizeVariantId,
  VARIANT_LABELS,
  VARIANT_TO_VIEW,
  VARIANT_TO_ZODIAC_MODE,
  VIEW_TO_VARIANT,
  type VariantId,
} from "@shared/variant";

type WesternProfiles = {
  sidereal: BodyProfile | null;
  tropical: BodyProfile | null;
};

export default function Results() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { generateNarrative: fetchNarrative, narrative } = useNarrative();

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [chartType, setChartType] = useState<ChartType>("diamond");
  const [selectedVariantId, setSelectedVariantId] = useState<VariantId>("variant_01");
  const [astroView, setAstroView] = useState<AstroView>("sidereal");
  const [profileInput, setProfileInput] = useState<ProfileInput | null>(null);
  const [westernProfiles, setWesternProfiles] = useState<WesternProfiles>({ sidereal: null, tropical: null });
  const [energyProfile, setEnergyProfile] = useState<EnergyProfileResult | null>(null);
  const [chineseMethod, setChineseMethod] = useState<ChineseMethod>("bazi");
  const [energyScoring, setEnergyScoring] = useState<EnergyScoringResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("profileInput");
    if (!stored) {
      setLocation("/");
      return;
    }

    let cancelled = false;

    async function generateWestern(input: ProfileInput, view: "sidereal" | "tropical") {
      const res = await fetch("/api/profiles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: { ...input, zodiacMode: view }, view }),
        credentials: "include",
      });
      if (res.ok) return (await res.json()) as BodyProfile;
      return generateProfileByView({ ...input, zodiacMode: view }, view);
    }

    async function loadAll() {
      try {
        const parsedInput = JSON.parse(stored) as ProfileInput;
        const variantId = normalizeVariantId(localStorage.getItem("variantId")) ?? VIEW_TO_VARIANT[normalizeAstroView(parsedInput)];
        const initialChineseMethod = (localStorage.getItem("chineseMethod") as ChineseMethod | null) ?? "bazi";

        setProfileInput(parsedInput);
        setChineseMethod(initialChineseMethod);
        setSelectedVariantId(variantId);
        setAstroView(VARIANT_TO_VIEW[variantId]);

        const [siderealProfile, tropicalProfile, chineseProfileRes, chineseScoringRes] = await Promise.all([
          generateWestern(parsedInput, "sidereal"),
          generateWestern(parsedInput, "tropical"),
          fetch("/api/energy-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: parsedInput }),
            credentials: "include",
          }),
          fetch("/api/energy-scoring", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: parsedInput, selection: { system: "chinese", method: initialChineseMethod } }),
            credentials: "include",
          }),
        ]);

        if (cancelled) return;

        setWesternProfiles({ sidereal: siderealProfile, tropical: tropicalProfile });
        setEnergyProfile(chineseProfileRes.ok ? await chineseProfileRes.json() : null);
        setEnergyScoring(chineseScoringRes.ok ? await chineseScoringRes.json() : null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Kon profielen niet laden.";
        toast({ title: "Fout", description: message, variant: "destructive" });
        setLocation("/");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [setLocation, toast]);

  const activeProfile = astroView === "sidereal" ? westernProfiles.sidereal : astroView === "tropical" ? westernProfiles.tropical : null;

  const displayProfile = useMemo(() => {
    if (!activeProfile || !narrative || astroView === "bazi") return activeProfile;
    return mergeNarrativeIntoProfile(activeProfile, narrative);
  }, [activeProfile, narrative, astroView]);

  useEffect(() => {
    if (!activeProfile || astroView === "bazi") return;
    fetchNarrative({ profile: activeProfile }).catch(() => undefined);
  }, [activeProfile, astroView, fetchNarrative]);

  const handleViewChange = (nextVariantId: VariantId) => {
    const nextView = VARIANT_TO_VIEW[nextVariantId];
    setSelectedVariantId(nextVariantId);
    setAstroView(nextView);
    setChartType(nextView === "tropical" ? "wheel" : "diamond");
    localStorage.setItem("variantId", nextVariantId);
  };

  const handleChineseMethodChange = async (method: ChineseMethod) => {
    if (!profileInput) return;
    setChineseMethod(method);
    localStorage.setItem("chineseMethod", method);
    const res = await fetch("/api/energy-scoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: profileInput, selection: { system: "chinese", method } }),
      credentials: "include",
    });
    setEnergyScoring(res.ok ? await res.json() : null);
  };

  const handleSaveAsPdf = async () => {
    if (!profileInput) return;
    const baseProfile = westernProfiles.sidereal ?? westernProfiles.tropical;
    if (!baseProfile) {
      toast({ title: "Fout", description: "Geen profiel beschikbaar om op te slaan.", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      const profileToSave: BodyProfile = {
        ...baseProfile,
        view: astroView,
        viewLabelNL: VARIANT_LABELS[selectedVariantId],
        input: { ...profileInput, zodiacMode: VARIANT_TO_ZODIAC_MODE[selectedVariantId] },
      };

      const saveRes = await apiRequest("POST", "/api/profiles", { profile: profileToSave });
      const saved = await saveRes.json();
      const profileId = saved?.id;
      if (!profileId) throw new Error("Opslaan mislukt");

      const methodQuery = astroView === "bazi" ? `&chinese_method=${encodeURIComponent(chineseMethod)}` : "";
      window.location.href = `/api/export/energy-profile.pdf?profile_id=${encodeURIComponent(profileId)}&variant_id=${encodeURIComponent(selectedVariantId)}${methodQuery}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Opslaan/PDF export mislukt.";
      toast({ title: "Fout", description: message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-generating" />
      </div>
    );
  }

  const viewLabel = VARIANT_LABELS[selectedVariantId];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>

          <div className="flex items-center gap-2">
            <Button onClick={handleSaveAsPdf} disabled={isExporting} data-testid="button-save-pdf">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">Opslaan als PDF</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="flex flex-col gap-3" data-testid="section-astro-view-toggle">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Astrologische variant</span>
            <span className="text-sm font-medium">{viewLabel}</span>
          </div>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <Button variant={selectedVariantId === "variant_01" ? "default" : "ghost"} className="rounded-none" onClick={() => handleViewChange("variant_01")}>
              {VARIANT_LABELS.variant_01}
            </Button>
            <Button variant={selectedVariantId === "variant_02" ? "default" : "ghost"} className="rounded-none" onClick={() => handleViewChange("variant_02")}>
              {VARIANT_LABELS.variant_02}
            </Button>
            <Button variant={selectedVariantId === "variant_03" ? "default" : "ghost"} className="rounded-none" onClick={() => handleViewChange("variant_03")}>
              {VARIANT_LABELS.variant_03}
            </Button>
          </div>
        </section>

        {astroView !== "bazi" && displayProfile ? (
          <>
            <SummaryHeader profile={displayProfile} />
            <HoroscopeSection profile={displayProfile} chartType={chartType} onChartTypeChange={setChartType} />
            <ChakraProfileSection chakraProfiles={displayProfile.chakraProfiles} timeUnknown={displayProfile.derived.timeUnknown} />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Domeinscores</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOMAINS.map((domain) => (
                  <DomainScoreCard key={domain} domain={domain as Domain} score={displayProfile.domainScores[domain as Domain]} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Jouw profiel</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ProfileSectionCard type="strengths" section={displayProfile.sections.strengths} />
                <ProfileSectionCard type="weaknesses" section={displayProfile.sections.weaknesses} />
                <ProfileSectionCard type="base" section={displayProfile.sections.base} />
                <ProfileSectionCard type="nutrition" section={displayProfile.sections.nutrition} />
                <ProfileSectionCard type="movement" section={displayProfile.sections.movement} />
                <ProfileSectionCard type="strengthBuilding" section={displayProfile.sections.strengthBuilding} />
                <ProfileSectionCard type="flexibility" section={displayProfile.sections.flexibility} />
                <ProfileSectionCard type="functionality" section={displayProfile.sections.functionality} />
              </div>
            </section>

            <MethodologyAccordion methodology={displayProfile.methodology} />
            <DebugPanel debugInfo={displayProfile.debugInfo} />
            <DisclaimerBox disclaimer={displayProfile.disclaimer} />
          </>
        ) : null}

        {astroView === "bazi" && energyProfile ? (
          <>
            {profileInput ? <BaZiSummaryHeader input={profileInput} localDatetimeResolved={energyProfile.birth_local_datetime_resolved} /> : null}

            <section className="flex items-center gap-2" data-testid="section-chinese-method-toggle">
              <span className="text-sm text-muted-foreground">Chinese methode</span>
              <Button size="sm" variant={chineseMethod === "bazi" ? "default" : "outline"} onClick={() => handleChineseMethodChange("bazi")}>BaZi</Button>
              <Button size="sm" variant={chineseMethod === "shengxiao" ? "default" : "outline"} onClick={() => handleChineseMethodChange("shengxiao")}>Shengxiao</Button>
            </section>

            {energyScoring ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Domeinscores ({energyScoring.method === "shengxiao" ? "Shengxiao" : "BaZi"})</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {energyScoring.domains.map((domainResult) => (
                    <DomainScoreCard
                      key={domainResult.domainId}
                      domain={domainResult.domainId as Domain}
                      score={{
                        value: domainResult.score,
                        min: domainResult.scoreMin,
                        max: domainResult.scoreMax,
                        spread: domainResult.spread,
                        timeSensitive: energyScoring.time.timeSensitive,
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <EnergyProfilePanel result={energyProfile} />
          </>
        ) : null}
      </main>
    </div>
  );
}
