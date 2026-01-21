import { useEffect, useState } from "react";
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
import { generateProfile } from "@shared/scoring";

export default function Results() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<BodyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('diamond');
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
      a.download = `body-energy-profile-${profile?.input.name || "profiel"}.pdf`;
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

    try {
      const input: ProfileInput = JSON.parse(stored);
      const generatedProfile = generateProfile(input);
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
      setIsLoading(false);
    }
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
        <SummaryHeader profile={profile} />

        <ChakraProfileSection 
          chakraProfiles={profile.chakraProfiles}
          timeUnknown={profile.derived.timeUnknown}
        />

        <HoroscopeSection 
          profile={profile} 
          chartType={chartType}
          onChartTypeChange={setChartType}
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
