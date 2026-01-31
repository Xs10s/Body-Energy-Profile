import { pgTable, text, timestamp, jsonb, boolean, doublePrecision } from "drizzle-orm/pg-core";
import type { BodyProfile } from "@shared/schema";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  name: text("name"),
  birthDate: text("birth_date").notNull(),
  birthTime: text("birth_time"),
  birthPlace: text("birth_place").notNull(),
  country: text("country").notNull(),
  timezone: text("timezone").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  placeId: text("place_id"),
  timeUnknown: boolean("time_unknown").notNull().default(false),
  zodiacMode: text("zodiac_mode").notNull(),
  moonSign: text("moon_sign"),
  moonNakshatra: text("moon_nakshatra"),
  sunSign: text("sun_sign"),
  lagnaSign: text("lagna_sign"),
  ayanamsa: doublePrecision("ayanamsa"),
  profile: jsonb("profile").$type<BodyProfile>().notNull()
});
