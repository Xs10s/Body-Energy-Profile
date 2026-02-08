/**
 * Narrative cache: keyed by chartSignature + systemType + view + narrativeVersion.
 * In-memory fallback; DB integration optional via storage abstraction.
 */

import type { NarrativeJSON } from "./types";

const MEMORY_CACHE = new Map<string, { value: NarrativeJSON; ts: number }>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function buildCacheKey(
  chartSignature: string,
  systemType: string,
  view: string,
  narrativeVersion: string
): string {
  return `${chartSignature}::${systemType}::${view}::${narrativeVersion}`;
}

export function getCached(key: string): NarrativeJSON | null {
  const entry = MEMORY_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    MEMORY_CACHE.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key: string, value: NarrativeJSON): void {
  MEMORY_CACHE.set(key, { value, ts: Date.now() });
}

export interface NarrativeCacheStorage {
  get(key: string): Promise<NarrativeJSON | null>;
  set(key: string, value: NarrativeJSON): Promise<void>;
}

let externalStorage: NarrativeCacheStorage | null = null;

export function setNarrativeCacheStorage(storage: NarrativeCacheStorage): void {
  externalStorage = storage;
}

export async function getCachedNarrative(key: string): Promise<NarrativeJSON | null> {
  if (externalStorage) {
    try {
      const v = await externalStorage.get(key);
      if (v) return v;
    } catch {
      // fall through to memory
    }
  }
  return getCached(key);
}

export async function setCachedNarrative(key: string, value: NarrativeJSON): Promise<void> {
  if (externalStorage) {
    try {
      await externalStorage.set(key, value);
    } catch {
      // fall through
    }
  }
  setCached(key, value);
}
