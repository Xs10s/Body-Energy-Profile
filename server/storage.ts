import type { BodyProfile, SavedProfile } from "@shared/schema";
import { randomUUID } from "crypto";
import { DbStorage } from "./storageDb";
import type { IStorage } from "./storageTypes";

export class MemStorage implements IStorage {
  private profiles: Map<string, SavedProfile>;

  constructor() {
    this.profiles = new Map();
  }

  async getProfiles(): Promise<SavedProfile[]> {
    return Array.from(this.profiles.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getProfile(id: string): Promise<SavedProfile | undefined> {
    return this.profiles.get(id);
  }

  async saveProfile(profile: BodyProfile): Promise<SavedProfile> {
    const id = randomUUID();
    const savedProfile: SavedProfile = {
      id,
      profile,
      createdAt: new Date().toISOString()
    };
    this.profiles.set(id, savedProfile);
    return savedProfile;
  }

  async deleteProfile(id: string): Promise<boolean> {
    return this.profiles.delete(id);
  }
}

export type StorageKind = "mem" | "db";

export let storage: IStorage = new MemStorage();
let storageKind: StorageKind = "mem";

export function getStorageInfo() {
  return {
    kind: storageKind
  };
}

export async function initStorage() {
  if (!process.env.DATABASE_URL) {
    storage = new MemStorage();
    storageKind = "mem";
    console.log("MemStorage fallback (no DATABASE_URL)");
    return;
  }

  try {
    const dbStorage = await DbStorage.create();
    storage = dbStorage;
    storageKind = "db";
    console.log("DB storage enabled");
  } catch (error) {
    console.error("DB storage init failed, falling back to MemStorage", { error });
    storage = new MemStorage();
    storageKind = "mem";
  }
}
