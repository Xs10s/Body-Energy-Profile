import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import type { BodyProfile, SavedProfile } from "@shared/schema";
import type { IStorage } from "./storageTypes";
import { createDbClient, type DbClient } from "./db";
import { profiles } from "./db/schema";

interface DbStorageOptions {
  db: DbClient;
}

export class DbStorage implements IStorage {
  private db: DbClient;

  constructor({ db }: DbStorageOptions) {
    this.db = db;
  }

  static async create(): Promise<DbStorage> {
    const { db } = await createDbClient();
    return new DbStorage({ db });
  }

  private logError(action: string, error: unknown) {
    console.error("DB storage error", { action, error });
  }

  async getProfiles(): Promise<SavedProfile[]> {
    try {
      const rows = await this.db
        .select({
          id: profiles.id,
          profile: profiles.profile,
          createdAt: profiles.createdAt
        })
        .from(profiles)
        .orderBy(desc(profiles.createdAt));

      return rows.map((row) => ({
        id: row.id,
        profile: row.profile,
        createdAt: row.createdAt.toISOString()
      }));
    } catch (error) {
      this.logError("getProfiles", error);
      throw error;
    }
  }

  async getProfile(id: string): Promise<SavedProfile | undefined> {
    try {
      const rows = await this.db
        .select({
          id: profiles.id,
          profile: profiles.profile,
          createdAt: profiles.createdAt
        })
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);

      if (rows.length === 0) {
        return undefined;
      }

      return {
        id: rows[0].id,
        profile: rows[0].profile,
        createdAt: rows[0].createdAt.toISOString()
      };
    } catch (error) {
      this.logError("getProfile", error);
      throw error;
    }
  }

  async saveProfile(profile: BodyProfile): Promise<SavedProfile> {
    try {
      const id = randomUUID();
      const now = new Date();
      const row = {
        id,
        createdAt: now,
        updatedAt: now,
        name: profile.input.name ?? null,
        birthDate: profile.input.birthDate,
        birthTime: profile.input.birthTime ?? null,
        birthPlace: profile.input.birthPlace,
        country: profile.input.country,
        timezone: profile.input.timezone,
        latitude: profile.input.latitude ?? null,
        longitude: profile.input.longitude ?? null,
        placeId: profile.input.placeId ?? null,
        timeUnknown: profile.input.timeUnknown,
        zodiacMode: profile.input.zodiacMode,
        moonSign: profile.derived.moonSign,
        moonNakshatra: profile.derived.moonNakshatra,
        sunSign: profile.derived.sunSign,
        lagnaSign: profile.derived.lagnaSign ?? null,
        ayanamsa: profile.derived.ayanamsa,
        profile
      };

      await this.db.insert(profiles).values(row);

      return {
        id,
        profile,
        createdAt: now.toISOString()
      };
    } catch (error) {
      this.logError("saveProfile", error);
      throw error;
    }
  }

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(profiles).where(eq(profiles.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      this.logError("deleteProfile", error);
      throw error;
    }
  }
}
