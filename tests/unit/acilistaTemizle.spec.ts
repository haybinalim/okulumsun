import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/persistence/db';
import { acilistaTemizle } from '../../src/persistence/acilistaTemizle';

describe('açılışta eski kayıt temizliği', () => {
  it('eski öğrenci kayıtları açılışta silinir', async () => {
    await db.learner_profile.clear();
    await db.learner_profile.put({ id: 'aktif', readingLevel: 1 } as never);
    expect(await db.learner_profile.count()).toBe(1);
    await acilistaTemizle();
    expect(await db.sessions.count()).toBe(0);
    expect(await db.learner_profile.count()).toBe(0);
    expect(await db.events.count()).toBe(0);
    expect(await db.learner_profile.count()).toBe(0);
  });
});
