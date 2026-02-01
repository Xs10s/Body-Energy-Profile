import type { BodyProfile, SavedProfile } from "@shared/schema";

export interface IStorage {
  getProfiles(): Promise<SavedProfile[]>;
  getProfile(id: string): Promise<SavedProfile | undefined>;
  saveProfile(profile: BodyProfile): Promise<SavedProfile>;
  deleteProfile(id: string): Promise<boolean>;
}
