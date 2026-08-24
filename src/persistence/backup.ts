/**
 * YEDEKLEME — plan §10.
 *
 * Veli kapısı arkasında tek düğmelik JSON dışa/içe aktarım.
 *
 * Dışa aktarım:
 *  · Dosya adı: okulumsun-yedek-YYYY-AA-GG.json
 *  · Format: { format: 'okulumsun-yedek', formatVersion: 1, ... }
 *  · active_session dahil edilmez (yarım oturum taşınmaz).
 *
 * İçe aktarım:
 *  · format eşleşmiyorsa REDDedilir.
 *  · dbSchemaVersion mevcuttan büyükse REDDedilir.
 *  · Küçükse migrasyondan geçirilir (şu an v1, migrasyon yok).
 *  · Mevcut veriyle birleştirilmez — "değiştir" onayı gerekir.
 */

import { db, MEVCUT_SEMA_SURUMU, type LearnerProfileRecord, type EventRecord, type SessionRecord } from './db';
import type { MasteryRecord } from '../progress/mastery';
import { OGRENCI_VERISI_SAKLANIR_MI, VERI_SAKLAMA_KAPALI_HATA } from './veriSaklamaPolitikasi';

// ---------------------------------------------------------------- tipler

/** Yedek dosyasının biçimi — plan §10. */
export interface YedekDosyasi {
  readonly format: 'okulumsun-yedek';
  readonly formatVersion: 1;
  readonly dbSchemaVersion: number;
  readonly olusturulmaTs: number;
  readonly uygulamaSurumu: string;
  readonly veri: {
    readonly learner_profile: LearnerProfileRecord | null;
    readonly learner_mastery: readonly MasteryRecord[];
    readonly sessions: readonly SessionRecord[];
    readonly events?: readonly EventRecord[];
  };
}

/** İçe aktarım sonucu. */
export type IceAktarimSonuc =
  | { ok: true; kayitSayisi: number }
  | { ok: false; sebep: IceAktarimHatasi };

export type IceAktarimHatasi =
  | 'gecersiz-format'
  | 'format-eslesmiyor'
  | 'db-surumu-buyuk'
  | 'veri-eksik'
  | 'saklama-kapali';

// ---------------------------------------------------------------- dışa aktarım

/** Tüm veriyi topla ve yedek objesi oluştur. */
export async function yedekOlustur(uygulamaSurumu: string): Promise<YedekDosyasi> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) throw new Error(VERI_SAKLAMA_KAPALI_HATA);
  const [learner_profile, learner_mastery, sessions, events] = await Promise.all([
    db.learner_profile.get('aktif'),
    db.learner_mastery.toArray(),
    db.sessions.toArray(),
    db.events.toArray(),
  ]);

  return {
    format: 'okulumsun-yedek',
    formatVersion: 1,
    dbSchemaVersion: MEVCUT_SEMA_SURUMU,
    olusturulmaTs: Date.now(),
    uygulamaSurumu,
    veri: {
      learner_profile: learner_profile ?? null,
      learner_mastery,
      sessions,
      // events isteğe bağlı — dosyayı küçük tutmak için dahil et
      events,
    },
  };
}

/** Yedeği JSON string'e çevir. */
export function yedekSerialize(yedek: YedekDosyasi): string {
  return JSON.stringify(yedek, null, 2);
}

/** Yedek dosya adı üret: okulumsun-yedek-YYYY-AA-GG.json */
export function yedekDosyaAdi(ts: number = Date.now()): string {
  const d = new Date(ts);
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return `okulumsun-yedek-${yil}-${ay}-${gun}.json`;
}

/** Yedeği tarayıcıda indir. */
export async function yedekIndir(uygulamaSurumu: string): Promise<void> {
  const yedek = await yedekOlustur(uygulamaSurumu);
  const json = yedekSerialize(yedek);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = yedekDosyaAdi();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------- içe aktarım

/** JSON string'i yedek objesine çözümle ve doğrula. */
export function yedekCozumle(json: string): YedekDosyasi | null {
  try {
    const obj = JSON.parse(json) as unknown;
    if (typeof obj !== 'object' || obj === null) return null;
    const o = obj as Record<string, unknown>;
    if (o['format'] !== 'okulumsun-yedek') return null;
    if (o['formatVersion'] !== 1) return null;
    if (typeof o['dbSchemaVersion'] !== 'number') return null;
    if (typeof o['olusturulmaTs'] !== 'number') return null;
    if (typeof o['uygulamaSurumu'] !== 'string') return null;
    if (typeof o['veri'] !== 'object' || o['veri'] === null) return null;
    const veri = o['veri'] as Record<string, unknown>;
    if (!Array.isArray(veri['learner_mastery'])) return null;
    if (!Array.isArray(veri['sessions'])) return null;
    return obj as YedekDosyasi;
  } catch {
    return null;
  }
}

/** Yedeği doğrula — içe aktarımdan önce. */
export function yedekDogrula(yedek: YedekDosyasi): IceAktarimSonuc {
  if (yedek.format !== 'okulumsun-yedek') {
    return { ok: false, sebep: 'format-eslesmiyor' };
  }
  if (yedek.dbSchemaVersion > MEVCUT_SEMA_SURUMU) {
    return { ok: false, sebep: 'db-surumu-buyuk' };
  }
  if (!yedek.veri.learner_mastery || !yedek.veri.sessions) {
    return { ok: false, sebep: 'veri-eksik' };
  }
  return { ok: true, kayitSayisi: 0 };
}

/** Yedeği içe aktar — mevcut veriyi DEĞİŞTİRİR. */
export async function yedeIceAktar(yedek: YedekDosyasi): Promise<IceAktarimSonuc> {
  if (!OGRENCI_VERISI_SAKLANIR_MI) return { ok: false, sebep: 'saklama-kapali' };
  const dogrulama = yedekDogrula(yedek);
  if (!dogrulama.ok) return dogrulama;

  // Mevcut veriyi sil
  await Promise.all([
    db.learner_mastery.clear(),
    db.learner_profile.clear(),
    db.sessions.clear(),
    db.events.clear(),
  ]);

  // Yeni veriyi yaz
  const islemler: Promise<unknown>[] = [
    db.learner_mastery.bulkPut(yedek.veri.learner_mastery as MasteryRecord[]),
    db.sessions.bulkPut(yedek.veri.sessions as SessionRecord[]),
  ];

  if (yedek.veri.learner_profile) {
    islemler.push(db.learner_profile.put(yedek.veri.learner_profile));
  }
  if (yedek.veri.events) {
    islemler.push(db.events.bulkPut(yedek.veri.events as EventRecord[]));
  }

  await Promise.all(islemler);

  let kayitSayisi = yedek.veri.learner_mastery.length + yedek.veri.sessions.length;
  if (yedek.veri.learner_profile) kayitSayisi++;
  if (yedek.veri.events) kayitSayisi += yedek.veri.events.length;

  return { ok: true, kayitSayisi };
}
