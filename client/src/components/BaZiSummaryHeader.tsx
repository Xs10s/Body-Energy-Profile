import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfileInput } from "@shared/schema";

interface BaZiSummaryHeaderProps {
  input: ProfileInput;
  /** Optional resolved local datetime from API for display */
  localDatetimeResolved?: string | null;
}

export function BaZiSummaryHeader({ input, localDatetimeResolved }: BaZiSummaryHeaderProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card data-testid="card-summary-header-bazi">
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {input.name && (
              <h2 className="text-2xl font-bold" data-testid="text-profile-name">
                {input.name}
              </h2>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm" data-testid="info-birthdate">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-birthdate">{formatDate(input.birthDate)}</span>
              </div>

              {input.birthTime && !input.timeUnknown && (
                <div className="flex items-center gap-3 text-sm" data-testid="info-birthtime">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-birthtime">{input.birthTime}</span>
                </div>
              )}

              {input.timeUnknown && (
                <div className="flex items-center gap-3 text-sm" data-testid="info-time-unknown">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground italic" data-testid="text-time-unknown">
                    Tijd onbekend
                  </span>
                </div>
              )}

              {localDatetimeResolved && !input.timeUnknown && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground" data-testid="info-local-resolved">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span data-testid="text-local-resolved">
                    Lokaal: {new Date(localDatetimeResolved).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm" data-testid="info-birthplace">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-birthplace">
                  {input.birthPlace}, {input.country}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm flex-wrap" data-testid="info-bazi-view">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" data-testid="badge-astro-view">
                  Chinese (BaZi)
                </Badge>
                <Badge variant="outline" data-testid="badge-indicative">
                  Indicatieve scores
                </Badge>
              </div>
            </div>
          </div>

          <div className="md:border-l md:pl-8">
            <h3 className="font-semibold mb-2" data-testid="heading-bazi-info">
              Over dit profiel
            </h3>
            <p className="text-sm text-muted-foreground" data-testid="text-bazi-description">
              Dit energieprofiel is berekend met de Chinese BaZi-methode (Vier Pilaren). De domeinscores zijn afgeleid van de
              zichtbare element- en polariteitsbalans en zijn indicatief.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
