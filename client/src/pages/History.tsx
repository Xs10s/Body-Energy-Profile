import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Eye, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getViewLabelNL, normalizeAstroView } from "@shared/profileBuilder";
import { VIEW_TO_VARIANT } from "@shared/variant";
import type { SavedProfile } from "@shared/schema";

export default function History() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: profiles = [], isLoading } = useQuery<SavedProfile[]>({
    queryKey: ["/api/profiles"]
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Verwijderd",
        description: "Profiel is verwijderd."
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Kon profiel niet verwijderen.",
        variant: "destructive"
      });
    }
  });

  const handleView = (profile: SavedProfile) => {
    const view = profile.profile.view ?? normalizeAstroView(profile.profile.input);
    const variantId = VIEW_TO_VARIANT[view];
    const inputWithView = { ...profile.profile.input, zodiacMode: view === "tropical" ? "tropical" : "sidereal" };
    localStorage.setItem("profileInput", JSON.stringify(inputWithView));
    localStorage.setItem("variantId", variantId);
    if (view === "bazi") localStorage.setItem("chineseMethod", "bazi");
    setLocation("/result");
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" data-testid="heading-history">Opgeslagen Profielen</h1>
          <p className="text-muted-foreground mt-2" data-testid="text-history-description">
            Bekijk je eerder opgeslagen body energy profielen
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-profiles" />
          </div>
        ) : profiles.length === 0 ? (
          <Card data-testid="card-empty-state">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg" data-testid="text-empty-title">Nog geen profielen opgeslagen</h3>
                  <p className="text-muted-foreground text-sm mt-1" data-testid="text-empty-description">
                    Genereer een profiel en sla het op om het hier terug te zien
                  </p>
                </div>
                <Button onClick={() => setLocation("/")} data-testid="button-create-profile">
                  Nieuw profiel maken
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4" data-testid="list-profiles">
            {profiles.map((saved) => (
              <Card key={saved.id} className="hover-elevate" data-testid={`card-profile-${saved.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg" data-testid={`text-profile-name-${saved.id}`}>
                      {saved.profile.input.name || "Naamloos profiel"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
                      <span data-testid={`text-profile-date-${saved.id}`}>{formatDate(saved.createdAt)}</span>
                      <Badge 
                        variant={saved.profile.confidence.level === "high" ? "default" : "secondary"}
                        data-testid={`badge-confidence-${saved.id}`}
                      >
                        {saved.profile.confidence.level === "high" ? "Hoge" : "Gemiddelde"} betrouwbaarheid
                      </Badge>
                      <Badge variant="outline" data-testid={`badge-view-${saved.id}`}>
                        {saved.profile.viewLabelNL || getViewLabelNL(saved.profile.view ?? normalizeAstroView(saved.profile.input))}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleView(saved)}
                      data-testid={`button-view-${saved.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(saved.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${saved.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground" data-testid={`text-profile-details-${saved.id}`}>
                    <span>Geboortedatum: {new Date(saved.profile.input.birthDate).toLocaleDateString("nl-NL")}</span>
                    <span className="mx-2">•</span>
                    <span>{saved.profile.input.birthPlace}, {saved.profile.input.country}</span>
                    <span className="mx-2">•</span>
                    <span>Maan teken: {saved.profile.derived.moonSign}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
