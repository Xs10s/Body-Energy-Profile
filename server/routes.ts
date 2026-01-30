import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorageInfo, storage } from "./storage";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { saveProfileRequestSchema, DOMAIN_LABELS, geocodeResultSchema } from "@shared/schema";
import type { BodyProfile, GeocodeResult } from "@shared/schema";

async function svgToPng(svgString: string, width: number = 300): Promise<Buffer | null> {
  try {
    const buffer = Buffer.from(svgString);
    return await sharp(buffer)
      .resize(width)
      .png()
      .toBuffer();
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    return null;
  }
}

const geocodeCache = new Map<string, GeocodeResult>();

async function geocodePlace(place: string, country: string): Promise<GeocodeResult | null> {
  const cacheKey = `${place.toLowerCase()}-${country.toLowerCase()}`;
  
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }
  
  try {
    const query = encodeURIComponent(`${place}, ${country}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'BodyEnergyProfile/2.0 (https://replit.com)'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Geocode API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    const result: GeocodeResult = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
      placeId: data[0].place_id?.toString()
    };
    
    geocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      storage: getStorageInfo().kind
    });
  });

  app.get("/api/geocode", async (req, res) => {
    try {
      const place = req.query.place as string;
      const country = req.query.country as string;
      
      if (!place || !country) {
        return res.status(400).json({ error: "Missing place or country parameter" });
      }
      
      const result = await geocodePlace(place, country);
      
      if (!result) {
        return res.status(404).json({ error: "Location not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error geocoding:", error);
      res.status(500).json({ error: "Failed to geocode location" });
    }
  });

  app.get("/api/profiles", async (_req, res) => {
    try {
      const profiles = await storage.getProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: "Failed to fetch profiles" });
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    try {
      const profile = await storage.getProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const parseResult = saveProfileRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: parseResult.error.issues 
        });
      }
      const { profile } = parseResult.data;
      const savedProfile = await storage.saveProfile(profile as BodyProfile);
      res.status(201).json(savedProfile);
    } catch (error) {
      console.error("Error saving profile:", error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProfile(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Profile not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });

  app.post("/api/profiles/pdf", async (req, res) => {
    try {
      const parseResult = saveProfileRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid profile data", 
          details: parseResult.error.issues 
        });
      }
      const { profile } = parseResult.data as { profile: BodyProfile };
      const chartSVG = req.body.chartSVG as string | undefined;

      let chartPng: Buffer | null = null;
      if (chartSVG) {
        chartPng = await svgToPng(chartSVG, 250);
      }

      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="body-energy-profile.pdf"`);
      doc.pipe(res);

      doc.fontSize(24).text("Body Energy Profile", { align: "center" });
      doc.moveDown();

      if (profile.input.name) {
        doc.fontSize(16).text(profile.input.name, { align: "center" });
        doc.moveDown();
      }

      if (chartPng) {
        const pageWidth = 595.28 - 100;
        const chartWidth = 200;
        const chartX = (pageWidth - chartWidth) / 2 + 50;
        doc.image(chartPng, chartX, doc.y, { width: chartWidth });
        doc.moveDown(10);
      }

      doc.fontSize(12);
      doc.text(`Geboortedatum: ${new Date(profile.input.birthDate).toLocaleDateString("nl-NL")}`);
      doc.text(`Geboorteplaats: ${profile.input.birthPlace}, ${profile.input.country}`);
      
      doc.text(`Maan teken: ${profile.derived.moonSign}`);
      doc.text(`Nakshatra: ${profile.derived.moonNakshatra} (pada ${profile.derived.moonPada})`);
      doc.text(`Zon teken: ${profile.derived.sunSign}`);
      if (profile.derived.lagnaSign) {
        doc.text(`Ascendant (Lagna): ${profile.derived.lagnaSign}`);
      }
      if (profile.derived.ayanamsa != null) {
        doc.text(`Ayanamsa: Lahiri (${profile.derived.ayanamsa.toFixed(2)}°)`);
      }
      
      if (profile.input.birthTime && !profile.input.timeUnknown) {
        doc.text(`Geboortetijd: ${profile.input.birthTime}`);
      }
      doc.text(`Betrouwbaarheid: ${profile.confidence.level === "high" ? "Hoog" : "Gemiddeld"}`);
      doc.moveDown(2);

      if (profile.chakraProfiles && profile.chakraProfiles.length > 0) {
        doc.fontSize(18).text("Chakra-profiel op basis van horoscoop", { underline: true });
        doc.moveDown();
        
        const CHAKRA_LABELS: Record<string, string> = {
          root: 'Wortel (Muladhara)',
          sacral: 'Sacraal (Svadhisthana)',
          solar: 'Zonnevlecht (Manipura)',
          heart: 'Hart (Anahata)',
          throat: 'Keel (Vishuddha)',
          thirdEye: 'Derde Oog (Ajna)',
          crown: 'Kruin (Sahasrara)'
        };
        
        for (const chakra of profile.chakraProfiles) {
          doc.fontSize(12).text(CHAKRA_LABELS[chakra.domain] || chakra.labelNL, { underline: true });
          doc.fontSize(10);
          doc.text(`Score: ${chakra.score}${chakra.timeSensitive ? ' (tijdgevoelig)' : ''}`);
          doc.moveDown(0.3);
          
          doc.text('Horoscoop-signalen:', { continued: false });
          for (const signal of chakra.signals.slice(0, 4)) {
            doc.text(`  • ${signal.factor}`, { indent: 10 });
          }
          doc.moveDown(0.3);
          
          doc.text(`Natuurlijke trend: ${chakra.naturalTrend}`);
          doc.moveDown(0.3);
          
          doc.text('In balans:');
          for (const item of chakra.balanced.slice(0, 3)) {
            doc.text(`  ✓ ${item}`, { indent: 10 });
          }
          doc.moveDown(0.3);
          
          doc.text('In disbalans:');
          for (const item of chakra.imbalanced.slice(0, 3)) {
            doc.text(`  ! ${item}`, { indent: 10 });
          }
          doc.moveDown(0.3);
          
          doc.text('Praktische reset:');
          for (const item of chakra.practicalResets.slice(0, 2)) {
            doc.text(`  → ${item}`, { indent: 10 });
          }
          doc.moveDown(1);
        }
        
        doc.addPage();
      }

      doc.fontSize(16).text("Domeinscores", { underline: true });
      doc.moveDown();
      doc.fontSize(10);
      
      for (const [domain, score] of Object.entries(profile.domainScores)) {
        const label = DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS];
        const scoreInfo = score.spread > 0 
          ? `${score.value} (bereik: ${score.min}-${score.max})` 
          : `${score.value}`;
        doc.text(`${label}: ${scoreInfo}${score.timeSensitive ? " (tijdgevoelig)" : ""}`);
      }
      doc.moveDown(2);

      const sections = [
        { key: "strengths", title: "Sterktes" },
        { key: "weaknesses", title: "Aandachtspunten" },
        { key: "base", title: "Basis" },
        { key: "nutrition", title: "Voeding" },
        { key: "movement", title: "Beweging" },
        { key: "strengthBuilding", title: "Krachtopbouw" },
        { key: "flexibility", title: "Flexibiliteit" },
        { key: "functionality", title: "Functionaliteit" }
      ];

      for (const { key, title } of sections) {
        const section = profile.sections[key as keyof typeof profile.sections];
        
        doc.fontSize(14).text(title, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        for (const bullet of section.bullets) {
          doc.text(`• ${bullet}`, { indent: 10 });
        }
        doc.moveDown(0.5);
        doc.text(section.paragraph, { indent: 0 });
        doc.moveDown(0.5);
        doc.text(`Volgende stap: ${section.nextStep}`, { indent: 0 });
        doc.moveDown();
      }

      doc.moveDown();
      doc.fontSize(12).text("Disclaimer", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9);
      doc.text(profile.disclaimer.text);
      doc.moveDown(0.5);
      doc.text("Wanneer een professional raadplegen:");
      for (const item of profile.disclaimer.whenToConsult) {
        doc.text(`• ${item}`, { indent: 10 });
      }

      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  return httpServer;
}
