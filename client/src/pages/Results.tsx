import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Download, Save, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SummaryHeader } from "@/components/SummaryHeader";
import { DomainScoreCard } from "@/components/DomainScoreCard";
import { ProfileSectionCard } from "@/components/ProfileSection";
import { MethodologyAccordion } from "@/components/MethodologyAccordion";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { DebugPanel } from "@/components/DebugPanel";
import { HoroscopeSection, getChartSVGString, type ChartType } from "@/components/HoroscopeSection";
import { ChakraProfileSection } from "@/components/ChakraProfileSection";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BodyProfile, ProfileInput, Domain } from "@shared/schema";
import { DOMAINS } from "@shared/schema";
import { generateProfileByView, getViewLabelNL, normalizeAstroView } from "@shared/profileBuilder";
import type { AstroView } from "@shared/schema";

export default function Results() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('diamond');
  const [astroView, setAstroView] = useState<AstroView>("sidereal");
  const [profileInput, setProfileInput] = useState<ProfileInput | null>(null);
  const { toast } = useToast();

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: BodyProfile) => {
      return apiRequest("POST", "/api/profiles", { profile: profileData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Opgeslagen",
        description: "Je profiel is succesvol opgeslagen."
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon profiel niet opslaan. Probeer opnieuw.",
        variant: "destructive"
      });
    }
  });

  const downloadPDFMutation = useMutation({
    mutationFn: async (data: { profile: BodyProfile; chartSVG?: string }) => {
      const response = await fetch("/api/profiles/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: data.profile, chartSVG: data.chartSVG })
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const viewSuffix = profile?.view === "tropical" ? "westers" : "oosters";
      a.download = `body-energy-profile-${viewSuffix}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "PDF gedownload",
        description: "Je profiel is gedownload als PDF."
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon PDF niet genereren. Probeer opnieuw.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem("profileInput");
    if (!stored) {
      setLocation("/");
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      if (!stored) return;
      try {
        const input: ProfileInput = JSON.parse(stored);
        const view = normalizeAstroView(input);
        const normalizedInput = { ...input, zodiacMode: view };

        // Prefer server generation (enables Gemini personalization)
        try {
          const res = await fetch("/api/profiles/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ input: normalizedInput, view }),
            credentials: "include",
          });
          if (res.ok && !cancelled) {
            const generatedProfile = await res.json();
            localStorage.setItem("astroView", view);
            setProfileInput(normalizedInput);
            setAstroView(view);
            setChartType(view === "tropical" ? "wheel" : "diamond");
            setProfile(generatedProfile);
            return;
          }
        } catch {
          // Fall through to client-side generation
        }

        if (cancelled) return;
        const generatedProfile = generateProfileByView(normalizedInput, view);
        localStorage.setItem("astroView", view);
        setProfileInput(normalizedInput);
        setAstroView(view);
        setChartType(view === "tropical" ? "wheel" : "diamond");
        setProfile(generatedProfile);
      } catch (error) {
        console.error("Error generating profile:", error);
        toast({
          title: "Fout",
          description: "Kon profiel niet genereren. Probeer opnieuw.",
          variant: "destructive"
        });
        setLocation("/");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [setLocation, toast]);

  const handleSave = () => {
    if (profile) {
      saveProfileMutation.mutate(profile);
    }
  };

  const handleDownloadPDF = () => {
    if (profile) {
      const chartSVG = getChartSVGString(chartType);
      downloadPDFMutation.mutate({ profile, chartSVG });
    }
  };

  const handleViewChange = (nextView: AstroView) => {
    if (!profileInput) return;
    const updatedInput = { ...profileInput, zodiacMode: nextView };
    localStorage.setItem("profileInput", JSON.stringify(updatedInput));
    localStorage.setItem("astroView", nextView);
    setProfileInput(updatedInput);
    setAstroView(nextView);
    setChartType(nextView === "tropical" ? "wheel" : "diamond");
    setProfile(generateProfileByView(updatedInput, nextView));
  };

  const viewLabel = useMemo(() => getViewLabelNL(astroView), [astroView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" data-testid="loader-generating" />
          <p className="text-muted-foreground" data-testid="text-loading">Profiel wordt gegenereerd...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={downloadPDFMutation.isPending}
              data-testid="button-download-pdf"
            >
              {downloadPDFMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {saveProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              <span className="hidden sm:inline">Opslaan</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <section className="flex flex-col gap-3" data-testid="section-astro-view-toggle">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Astrologische kijkwijze</span>
            <span className="text-sm font-medium" data-testid="text-active-view">
              {viewLabel}
            </span>
          </div>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <Button
              type="button"
              variant={astroView === "sidereal" ? "default" : "ghost"}
              className="rounded-none"
              aria-pressed={astroView === "sidereal"}
              onClick={() => handleViewChange("sidereal")}
              data-testid="button-view-sidereal"
            >
              Oosters
            </Button>
            <Button
              type="button"
              variant={astroView === "tropical" ? "default" : "ghost"}
              className="rounded-none"
              aria-pressed={astroView === "tropical"}
              onClick={() => handleViewChange("tropical")}
              data-testid="button-view-tropical"
            >
              Westers
            </Button>
          </div>
        </section>

        <SummaryHeader profile={profile} />

        <ChakraProfileSection 
          chakraProfiles={profile.chakraProfiles}
          timeUnknown={profile.derived.timeUnknown}
        />

        <HoroscopeSection 
          profile={profile} 
          chartType={chartType}
          onChartTypeChange={setChartType}
          lockChartType
        />

        <section>
          <h2 className="text-2xl font-semibold mb-4" data-testid="heading-domain-scores">Domeinscores</h2>
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
          <h2 className="text-2xl font-semibold mb-4" data-testid="heading-profile">Jouw profiel</h2>
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

        <MethodologyAccordion methodology={profile.methodology} />

        <DebugPanel debugInfo={profile.debugInfo} />

        {import.meta.env.DEV && (
          <section className="border rounded-lg p-4 bg-muted/40" data-testid="dev-astro-view-debug">
            <h3 className="text-sm font-semibold mb-2">Dev-check: kijkwijze & tags</h3>
            <p className="text-xs text-muted-foreground">
              Actieve kijkwijze: <span className="font-medium">{viewLabel}</span>
            </p>
            <div className="mt-3 space-y-2 text-xs">
              {profile.chakraProfiles.map((chakra) => {
                const tags = Array.from(
                  new Set(chakra.signals.flatMap((signal) => signal.tags || []))
                );
                const topTags = tags.slice(0, 3);
                const hasNakshatra = tags.some((tag) => tag.startsWith("nakshatra:"));
                return (
                  <div key={chakra.domain} className="flex flex-wrap gap-2">
                    <span className="font-medium">{chakra.labelNL}:</span>
                    <span>Tags: {topTags.join(", ") || "geen"}</span>
                    <span className={hasNakshatra ? "text-amber-600" : "text-emerald-600"}>
                      Nakshatra: {hasNakshatra ? "ja" : "nee"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <DisclaimerBox disclaimer={profile.disclaimer} />
      </main>

      <footer className="border-t py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p data-testid="text-footer-disclaimer">
            Dit is geen medische diagnose. Raadpleeg een professional voor gezondheidsadvies.
          </p>
        </div>
      </footer>
    </div>
  );
}
