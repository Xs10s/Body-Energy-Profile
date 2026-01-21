import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, Globe, User, ChevronDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { profileInputSchema, COUNTRIES, TIMEZONES, ZODIAC_MODES, ZODIAC_MODE_LABELS, type ProfileInput, type GeocodeResult, type ZodiacMode } from "@shared/schema";
import { Star } from "lucide-react";

interface InputFormProps {
  onSubmit: (data: ProfileInput) => void;
  isLoading?: boolean;
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: {
      name: "",
      birthDate: "",
      birthTime: "",
      timeUnknown: false,
      birthPlace: "",
      country: "Nederland",
      timezone: "Europe/Amsterdam",
      latitude: null,
      longitude: null,
      zodiacMode: "sidereal" as ZodiacMode
    }
  });

  const timeUnknown = form.watch("timeUnknown");

  const handleSubmit = async (data: ProfileInput) => {
    setIsGeocoding(true);
    setGeocodeError(null);
    
    try {
      const response = await fetch(
        `/api/geocode?place=${encodeURIComponent(data.birthPlace)}&country=${encodeURIComponent(data.country)}`
      );
      
      if (response.ok) {
        const result: GeocodeResult = await response.json();
        setGeocodeResult(result);
        data.latitude = result.lat;
        data.longitude = result.lon;
        data.placeId = result.placeId;
      } else if (response.status === 404) {
        if (!data.latitude || !data.longitude) {
          setGeocodeError("Locatie niet gevonden. Vul handmatig coördinaten in.");
          setShowAdvanced(true);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (error) {
      console.error("Geocode error:", error);
      if (!data.latitude || !data.longitude) {
        setGeocodeResult(null);
      }
    }
    
    setIsGeocoding(false);
    onSubmit(data);
  };

  const fillExample = () => {
    form.setValue("name", "Voorbeeld");
    form.setValue("birthDate", "1988-12-13");
    form.setValue("birthTime", "");
    form.setValue("timeUnknown", true);
    form.setValue("birthPlace", "IJmuiden");
    form.setValue("country", "Nederland");
    form.setValue("timezone", "Europe/Amsterdam");
    form.setValue("latitude", 52.4583);
    form.setValue("longitude", 4.6167);
    setGeocodeResult(null);
    setGeocodeError(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="card-input-form">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl md:text-4xl font-bold">
          Body Energy Profile
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Ontdek je persoonlijke lichaamsenergiepatroon gebaseerd op Jyotish (Vedische astrologie)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Naam (optioneel)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Je naam" 
                      {...field} 
                      data-testid="input-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Geboortedatum *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      min="1900-01-01"
                      max={new Date().toISOString().split('T')[0]}
                      {...field} 
                      data-testid="input-birthdate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="birthTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Geboortetijd (optioneel)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        disabled={timeUnknown}
                        className={timeUnknown ? "opacity-50" : ""}
                        {...field} 
                        data-testid="input-birthtime"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeUnknown"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            form.setValue("birthTime", "");
                          }
                        }}
                        data-testid="checkbox-time-unknown"
                      />
                    </FormControl>
                    <Label className="text-sm text-muted-foreground cursor-pointer">
                      Ik weet de tijd niet
                    </Label>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="birthPlace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Geboorteplaats *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="bijv. Amsterdam" 
                      {...field} 
                      data-testid="input-birthplace"
                    />
                  </FormControl>
                  <FormMessage />
                  {geocodeResult && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-1" data-testid="text-geocode-result">
                      <Check className="h-4 w-4" />
                      Gevonden: {geocodeResult.displayName.split(',').slice(0, 2).join(',')}
                    </div>
                  )}
                  {geocodeError && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 mt-1" data-testid="text-geocode-error">
                      {geocodeError}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Land *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Selecteer land" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Tijdzone
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-timezone">
                        <SelectValue placeholder="Selecteer tijdzone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zodiacMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    Astrologisch systeem
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-zodiac-mode">
                        <SelectValue placeholder="Selecteer systeem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ZODIAC_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {ZODIAC_MODE_LABELS[mode]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sidereaal: gebaseerd op sterrenbeelden • Tropisch: gebaseerd op seizoenen
                  </p>
                </FormItem>
              )}
            />

            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-2 py-1 rounded-md" data-testid="button-advanced-toggle">
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Geavanceerd: handmatige coördinaten
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breedtegraad</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.0001"
                            placeholder="bijv. 52.3676"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            data-testid="input-latitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lengtegraad</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.0001"
                            placeholder="bijv. 4.9041"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            data-testid="input-longitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 h-12"
                disabled={isLoading || isGeocoding}
                data-testid="button-generate"
              >
                {isLoading || isGeocoding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isGeocoding ? "Locatie zoeken..." : "Bezig met genereren..."}
                  </>
                ) : (
                  "Genereer Profiel"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={fillExample}
                data-testid="button-example"
              >
                Voorbeeldinvoer
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
