import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MemStorage } from "../../server/storage";
import { DbStorage } from "../../server/storageDb";
import { createDbClient } from "../../server/db";
import { profiles } from "../../server/db/schema";
import { generateProfile } from "../../shared/scoring";

const sampleInput = {
  birthDate: "1990-06-15",
  birthTime: "12:00",
  timeUnknown: false,
  birthPlace: "Amsterdam",
  country: "Nederland",
  timezone: "Europe/Amsterdam",
  latitude: 52.3676,
  longitude: 4.9041,
  zodiacMode: "sidereal"
};

describe("MemStorage", () => {
  it("saves and retrieves profiles", async () => {
    const storage = new MemStorage();
    const profile = generateProfile(sampleInput);

    const saved = await storage.saveProfile(profile);
    const fetched = await storage.getProfile(saved.id);
    const list = await storage.getProfiles();

    expect(fetched?.id).toBe(saved.id);
    expect(list).toHaveLength(1);
  });
});

const hasDb = Boolean(process.env.DATABASE_URL);
const describeDb = hasDb ? describe : describe.skip;

describeDb("DbStorage", () => {
  let dbStorage: DbStorage;
  let pool: Awaited<ReturnType<typeof createDbClient>>["pool"];

  beforeAll(async () => {
    const { db, pool: dbPool } = await createDbClient();
    pool = dbPool;
    await db.delete(profiles);
    dbStorage = new DbStorage({ db });
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("saves and retrieves profiles", async () => {
    const profile = generateProfile(sampleInput);

    const saved = await dbStorage.saveProfile(profile);
    const fetched = await dbStorage.getProfile(saved.id);
    const list = await dbStorage.getProfiles();

    expect(fetched?.id).toBe(saved.id);
    expect(list.length).toBeGreaterThan(0);
  });
});
