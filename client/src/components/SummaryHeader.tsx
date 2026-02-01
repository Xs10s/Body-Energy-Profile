import { Calendar, Clock, MapPin, Moon, Sun, Star, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceMeter } from "./ConfidenceMeter";
import type { BodyProfile } from "@shared/schema";
import { ZODIAC_MODE_LABELS } from "@shared/schema";

interface SummaryHeaderProps {
  profile: BodyProfile;
}

export function SummaryHeader({ profile }: SummaryHeaderProps) {
  const { input, derived, confidence } = profile;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <Card data-testid="card-summary-header">
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {input.name && (
              <h2 className="text-2xl font-bold" data-testid="text-profile-name">{input.name}</h2>
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

              {derived.timeUnknown && (
                <div className="flex items-center gap-3 text-sm" data-testid="info-time-unknown">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground italic" data-testid="text-time-unknown">Tijd onbekend</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm" data-testid="info-birthplace">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-birthplace">{input.birthPlace}, {input.country}</span>
              </div>

              <div className="flex items-center gap-3 text-sm flex-wrap" data-testid="info-moon">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-moon-sign">Maan: {derived.moonSign}</span>
                <Badge variant="secondary" data-testid="badge-nakshatra">
                  {derived.moonNakshatra} (pada {derived.moonPada})
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-sm" data-testid="info-sun">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span data-testid="text-sun-sign">Zon: {derived.sunSign}</span>
              </div>

              {derived.lagnaSign && (
                <div className="flex items-center gap-3 text-sm" data-testid="info-lagna">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span data-testid="text-lagna">Lagna: {derived.lagnaSign}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm flex-wrap" data-testid="info-zodiac-mode">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                {profile.viewLabelNL && (
                  <Badge variant="secondary" data-testid="badge-astro-view">
                    {profile.viewLabelNL}
                  </Badge>
                )}
                <Badge variant={derived.zodiacMode === 'sidereal' ? 'default' : 'outline'} data-testid="badge-zodiac-mode">
                  {ZODIAC_MODE_LABELS[derived.zodiacMode]}
                </Badge>
              </div>

              {derived.lagnaOptions && derived.lagnaOptions.length > 0 && !derived.lagnaSign && (
                <div className="flex items-center gap-3 text-sm flex-wrap" data-testid="info-lagna-options">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Mogelijke Lagna:</span>
                  {derived.lagnaOptions.map((option, i) => (
                    <Badge key={i} variant="outline" data-testid={`badge-lagna-option-${i}`}>
                      {option.sign} ({option.probability}%)
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:border-l md:pl-8">
            <h3 className="font-semibold mb-4" data-testid="heading-confidence">Betrouwbaarheid</h3>
            <ConfidenceMeter confidence={confidence} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
