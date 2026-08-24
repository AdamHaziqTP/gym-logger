import type { GymLogDB } from "./db";
import { SEED_FIXTURE, SEED_META_KEY, seedSessionFromFixture } from "./fixture";

/**
 * First-run seed (spec §24). The fixture is written once; the meta flag makes
 * seeding a one-time event so user deletions are never silently undone.
 */
export async function ensureSeeded(
  db: GymLogDB,
  now: () => Date = () => new Date(),
): Promise<boolean> {
  const flag = await db.meta.get(SEED_META_KEY);
  if (flag) return false;

  const count = await db.sessions.count();
  const iso = now().toISOString();

  if (count > 0) {
    // Existing data must never be overwritten by the fixture.
    await db.meta.put({ key: SEED_META_KEY, value: "skipped-existing-data", at: iso });
    return false;
  }

  let seeded = false;
  await db.transaction("rw", db.sessions, db.meta, async () => {
    const rechecked = await db.sessions.count();
    if (rechecked > 0) return;
    await db.sessions.put(seedSessionFromFixture(iso));
    await db.meta.put({
      key: SEED_META_KEY,
      value: `seed/latest-session.example.json@${SEED_FIXTURE.schemaVersion}`,
      at: iso,
    });
    seeded = true;
  });
  return seeded;
}
