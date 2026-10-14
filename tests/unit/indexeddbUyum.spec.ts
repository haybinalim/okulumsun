/**
 * IndexedDB sarmalayıcısı ↔ Dexie biçim uyumu ve kenar durumları (ADR-0015, Seçenek 3).
 *
 * Dexie yalnız devDependency: eski sürümlerin yazdığı veriyi sarmalayıcı okur/yazar, sonra Dexie
 * aynı veritabanını yeniden açabilir (geri dönüş mümkün). Her test taze bir IDBFactory kullanır.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory, IDBKeyRange as FakeKeyRange } from 'fake-indexeddb';
import Dexie from 'dexie';
import { DB_ADI, DbHatasi, IDB_SURUMU, SEMA, db, dbKapat } from '../../src/persistence/db';
import { acilistaTemizle } from '../../src/persistence/acilistaTemizle';
import type { SkillId } from '../../src/exercises/types';

const DEXIE_STORES = {
  learner_mastery: 'skillId, box, lastAnsweredAt',
  learner_profile: 'id',
  active_session: 'id',
  events: '++seq, ts, skillId',
  sessions: 'sessionId, bitisTs',
};

function dexieAc(): Dexie {
  const d = new Dexie(DB_ADI, { indexedDB, IDBKeyRange: FakeKeyRange });
  d.version(1).stores(DEXIE_STORES);
  return d;
}

const olay = (ts: number) => ({
  ts,
  skillId: 'mat.x' as SkillId,
  dogru: true,
  tani: null,
  latencyMs: 1,
  yardimKademesi: 0,
});
const ozet = (bitisTs: number) => ({
  sessionId: `s${bitisTs}`,
  bitisTs,
  baslangicMs: 0,
  bitisMs: bitisTs,
  soruSayisi: 1,
  dogruSayisi: 1,
  yeniDugumSayisi: 0,
  masteredOlanDugumler: [],
});

beforeEach(async () => {
  await dbKapat();
  globalThis.indexedDB = new IDBFactory();
  globalThis.IDBKeyRange = FakeKeyRange;
});
afterEach(dbKapat);

describe('Dexie ↔ sarmalayıcı biçim uyumu', () => {
  it('sürüm 10 ve depo/anahtar/indeks tanımları Dexie version(1) ile birebir', async () => {
    const dx = dexieAc();
    await dx.open();
    const ham = dx.backendDB();
    const dexieSema: Record<string, unknown> = {};
    const tx = ham.transaction([...ham.objectStoreNames], 'readonly');
    for (const ad of [...ham.objectStoreNames]) {
      const s = tx.objectStore(ad);
      dexieSema[ad] = { keyPath: s.keyPath, autoIncrement: s.autoIncrement, indeksler: [...s.indexNames].sort() };
    }
    expect(ham.version).toBe(IDB_SURUMU);
    dx.close();

    const bizim = Object.fromEntries(
      Object.entries(SEMA).map(([ad, t]) => [
        ad,
        { keyPath: t.keyPath, autoIncrement: t.autoIncrement, indeksler: [...t.indeksler].sort() },
      ]),
    );
    expect(bizim).toEqual(dexieSema);

    // Sarmalayıcının boş veritabanında kurduğu şema da aynı.
    await db.events.count();
    await dbKapat();
    const r = indexedDB.open(DB_ADI);
    const d = await new Promise<IDBDatabase>((ok) => (r.onsuccess = () => ok(r.result)));
    expect(d.version).toBe(IDB_SURUMU);
    const tx2 = d.transaction([...d.objectStoreNames], 'readonly');
    for (const [ad, beklenen] of Object.entries(dexieSema)) {
      const s = tx2.objectStore(ad);
      expect({ keyPath: s.keyPath, autoIncrement: s.autoIncrement, indeksler: [...s.indexNames].sort() }, ad).toEqual(
        beklenen,
      );
    }
    d.close();
  });

  it('Dexie yazar → sarmalayıcı okur/yazar → Dexie yeniden açar', async () => {
    const dx = dexieAc();
    await dx.table('learner_profile').put({ id: 'aktif', readingLevel: 2 });
    await dx.table('events').bulkAdd([olay(10), olay(20)]);
    await dx.table('sessions').bulkPut([ozet(100), ozet(200), ozet(300)]);
    dx.close();

    expect(await db.learner_profile.get('aktif')).toMatchObject({ readingLevel: 2 });
    expect((await db.events.toArray()).map((e) => e.seq)).toEqual([1, 2]);
    expect(await db.events.add(olay(30))).toBe(3); // otomatik artan sayaç Dexie'den devam eder
    expect((await db.sessions.ustu('bitisTs', 100)).map((s) => s.bitisTs)).toEqual([200, 300]);
    expect((await db.sessions.alti('bitisTs', 300)).map((s) => s.bitisTs)).toEqual([100, 200]);
    expect((await db.events.ilkN(2)).map((e) => e.ts)).toEqual([10, 20]);
    await db.sessions.bulkDelete(['s100']);
    await dbKapat();

    const dx2 = dexieAc();
    expect(await dx2.table('events').count()).toBe(3);
    expect(await dx2.table('sessions').where('bitisTs').above(0).count()).toBe(2);
    expect(await dx2.table('events').orderBy('seq').last()).toMatchObject({ seq: 3, ts: 30 });
    await dx2.table('events').add(olay(40));
    dx2.close();
    expect(await db.events.count()).toBe(4);
  });

  it('sorgu karşılıkları Dexie ile aynı sonucu verir', async () => {
    const zamanlar = [5, 1, 9, 3, 7];
    await db.sessions.bulkPut(zamanlar.map(ozet));
    await db.events.bulkPut(zamanlar.map(olay));
    await dbKapat();
    const dx = dexieAc();
    const dUstu = await dx.table('sessions').where('bitisTs').above(3).toArray();
    const dAlti = await dx.table('sessions').where('bitisTs').below(7).toArray();
    const dIlk = await dx.table('events').orderBy('seq').limit(3).toArray();
    dx.close();
    expect(await db.sessions.ustu('bitisTs', 3)).toEqual(dUstu);
    expect(await db.sessions.alti('bitisTs', 7)).toEqual(dAlti);
    expect(await db.events.ilkN(3)).toEqual(dIlk);
    expect(await db.events.ilkN(0)).toEqual([]);
  });
});

describe('sarmalayıcı kenar durumları', () => {
  it('bulkPut tek işlemdir: geçersiz kayıt hepsini geri alır ve reddedilir', async () => {
    const bozuk = { bitisTs: 1 } as never; // anahtar (sessionId) yok → DataError
    await expect(db.sessions.bulkPut([ozet(1), bozuk])).rejects.toBeInstanceOf(DbHatasi);
    expect(await db.sessions.count()).toBe(0);
  });

  it('istek hatası (aynı anahtarla add) işlemi iptal eder; sonraki işlemler çalışır', async () => {
    await db.learner_profile.add({ id: 'aktif' } as never);
    const h = await db.learner_profile.add({ id: 'aktif' } as never).catch((e: unknown) => e);
    expect(h).toBeInstanceOf(DbHatasi);
    expect((h as DbHatasi).tur).toBe('islem-iptal');
    expect(await db.learner_profile.count()).toBe(1);
  });

  it('versionchange: başka bağlantı veritabanını silerse bağlantı bırakılır, sonraki çağrı yeniden açar', async () => {
    await db.events.add(olay(1));
    const sil = indexedDB.deleteDatabase(DB_ADI);
    await new Promise<void>((ok, hata) => {
      sil.onsuccess = () => ok();
      sil.onerror = () => hata(sil.error);
      sil.onblocked = () => hata(new Error('silme engellendi — sarmalayıcı bağlantıyı bırakmadı'));
    });
    expect(await db.events.count()).toBe(0); // yeni boş veritabanı, aynı şema
    expect(await db.events.add(olay(2))).toBe(1);
  });

  it('daha yüksek sürüm varsa açılış DbHatasi(acilamadi) ile reddedilir ve önbelleğe alınmaz', async () => {
    const r = indexedDB.open(DB_ADI, IDB_SURUMU + 10);
    await new Promise<void>((ok) => (r.onsuccess = () => (r.result.close(), ok())));
    const h = await db.events.count().catch((e: unknown) => e);
    expect(h).toBeInstanceOf(DbHatasi);
    expect((h as DbHatasi).tur).toBe('acilamadi');
    // Veritabanı kaldırılınca bir sonraki çağrı yeniden dener ve başarır.
    await new Promise<void>((ok) => (indexedDB.deleteDatabase(DB_ADI).onsuccess = () => ok()));
    expect(await db.events.count()).toBe(0);
  });

  it('blocked: eski sürüm başka bağlantıda açıkken yükseltme beklemez, DbHatasi(engellendi) verir', async () => {
    const r = indexedDB.open(DB_ADI, 1); // eski sürüm, versionchange'i dinlemeyen bağlantı
    const eski = await new Promise<IDBDatabase>((ok) => (r.onsuccess = () => ok(r.result)));
    const h = await db.events.count().catch((e: unknown) => e);
    expect(h).toBeInstanceOf(DbHatasi);
    expect((h as DbHatasi).tur).toBe('engellendi');
    eski.close();
    // Engel kalkınca geç gelen bağlantı sızdırılmaz; yeni çağrı açar.
    await new Promise((ok) => setTimeout(ok, 20));
    expect(await db.events.count()).toBe(0);
  });

  it('indexedDB yoksa açılış reddedilir (açılış temizliği bunu yutar)', async () => {
    // @ts-expect-error test: ortamda IndexedDB yok
    globalThis.indexedDB = undefined;
    await expect(db.events.count()).rejects.toBeInstanceOf(DbHatasi);
    await expect(acilistaTemizle()).resolves.toBeUndefined();
  });
});

describe('Dexie üretim paketinde değil', () => {
  it("src/ altında 'dexie' içe aktarımı yok; package.json'da yalnız devDependencies", () => {
    const kok = resolve(__dirname, '../..');
    const dosyalar = (readdirSync(join(kok, 'src'), { recursive: true }) as string[]).filter((d) =>
      /\.(ts|tsx)$/.test(d),
    );
    for (const d of dosyalar)
      expect(readFileSync(join(kok, 'src', d), 'utf8'), d).not.toMatch(/from ['"]dexie['"]|import\(['"]dexie['"]\)/);
    const paket = JSON.parse(readFileSync(join(kok, 'package.json'), 'utf8')) as Record<string, Record<string, string>>;
    expect(paket.dependencies.dexie).toBeUndefined();
    expect(paket.devDependencies.dexie).toBeDefined();
  });
});
