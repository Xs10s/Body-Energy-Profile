import type { BodyProfile, SavedProfile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getProfiles(): Promise<SavedProfile[]>;
  getProfile(id: string): Promise<SavedProfile | undefined>;
  saveProfile(profile: BodyProfile): Promise<SavedProfile>;
  deleteProfile(id: string): Promise<boolean>;
}

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

export const storage = new MemStorage();
