/**
 * HAFTALIK PLAN — öğretmen ekranı (plan v2 Adım 37 aşama 2, KG-50).
 *
 * "Bu hafta hangi kazanım, hangi etkinlik?" MEB çalışma takvimi + ders saatlerinden türetilen 2026–2027 planı.
 * Üst %30: seçili haftanın ayrıntısı (dokunulmaz bilgi). Orta: yılın tüm haftaları, salt okunur tablo
 * (satırlar düğme değildir; seçim alttaki ileri/geri düğmeleriyle). Alt: tüm eylemler, tahta hedef boyutunda.
 * Seçili haftadan set (tahtada) veya çalışma kâğıdı başlar; plan CSV veya yazdırılabilir HTML olarak YEREL
 * indirilir (Blob, ağ yok). Hiçbir şey saklanmaz. Bu ekran ve plan verisi tembel yüklenir.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { BigButton } from '../primitives/BigButton';
import { COLOR } from '../../design/tokens';
import { REGISTRY } from '../../exercises/registry';
import { hash32 } from '../../exercises/rng';
import { SET_EN_FAZLA_DUGUM, SET_SURUMU, setKodla, setlenebilirDugumler } from '../../ogretmen/gunlukSet';
import { buHafta, haftaSetDugumleri } from '../../ogretmen/haftalikPlan';
import { planCsv, planHtml } from '../../ogretmen/planDisaAktar';
import {
  PLAN_BASLIGI,
  PLAN_DOSYA_ADI,
  PLAN_ETIKETLERI,
  YILLIK_PLAN,
  varsayilanHaftaIndeksi,
} from '../../ogretmen/yillikPlan';
import { dosyaIndir, yerelGun } from '../../platform/dosyaIndir';

const KAYITLI = (t: string): boolean => REGISTRY.has(t);

function trTarih(iso: string): string {
  const [y, a, g] = iso.split('-');
  return `${g}.${a}.${y}`;
}

const metin = { fontSize: 'var(--text-adult)', color: COLOR.ink, margin: 0 } as const;

export default function HaftalikPlan() {
  const setBaslat = useAppStore((s) => s.setBaslat);
  const kagitIcinSet = useAppStore((s) => s.kagitIcinSet);
  const tahta = useAppStore((s) => s.mod) === 'tahta';

  // "Bugün" UI katmanında okunur; saf plan modülü saat okumaz.
  const bugun = useMemo(() => yerelGun(new Date()), []);
  const buHaftaNo = useMemo(() => buHafta(YILLIK_PLAN, bugun)?.hafta.no ?? null, [bugun]);
  const [indeks, setIndeks] = useState(() => Math.max(0, varsayilanHaftaIndeksi(YILLIK_PLAN, bugun)));
  const [bildirim, setBildirim] = useState('');
  const uygun = useMemo(() => setlenebilirDugumler(KAYITLI), []);

  const secili = YILLIK_PLAN[indeks];
  const { dugumler, kirpildi } = haftaSetDugumleri(secili, uygun, SET_EN_FAZLA_DUGUM);
  const bos = dugumler.length === 0;

  const tabloRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabloRef.current?.querySelector<HTMLElement>('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [indeks]);

  const taslak = () => ({ surum: SET_SURUMU, dugumler, tohum: 0 });
  const tohumla = () => {
    const t = taslak();
    // Tohum UI katmanında (Math.random yasak; SetHazirla ile aynı yol).
    return { ...t, tohum: hash32(String(performance.now()) + setKodla(t)) };
  };

  const csvIndir = () => {
    dosyaIndir(`${PLAN_DOSYA_ADI}.csv`, planCsv(YILLIK_PLAN, PLAN_ETIKETLERI), 'text/csv;charset=utf-8');
    setBildirim('CSV dosyası indirildi (bu cihazda oluşturuldu, hiçbir yere gönderilmedi).');
  };
  const htmlIndir = () => {
    dosyaIndir(
      `${PLAN_DOSYA_ADI}.html`,
      planHtml(YILLIK_PLAN, PLAN_ETIKETLERI, PLAN_BASLIGI),
      'text/html;charset=utf-8',
    );
    setBildirim('Yazdırılabilir plan indirildi; tarayıcıda açıp yazdırabilirsiniz.');
  };

  const temaAdi = secili.temaNo == null ? 'Okul temelli planlama / tekrar' : PLAN_ETIKETLERI.tema(secili.temaNo);

  return (
    <main
      aria-labelledby="haftalik-plan-baslik"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: COLOR.bg,
        padding: 'var(--size-edge)',
        paddingBottom: 'var(--size-edge-bottom)',
        gap: 'var(--size-gap-tight)',
        overflow: 'hidden',
      }}
    >
      {/* Üst bölge: yalnız bilgi, dokunulabilir öğe yok. */}
      <header
        style={{
          flex: '0 0 auto',
          maxHeight: '30%',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          overflow: 'hidden',
        }}
      >
        <h1 id="haftalik-plan-baslik" style={{ ...metin, fontWeight: 700 }}>
          Haftalık plan 2026–2027
        </h1>
        <section
          aria-label="Seçili hafta"
          aria-live="polite"
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <p style={{ ...metin, fontWeight: 700 }}>
            {secili.hafta.no}. hafta · {trTarih(secili.hafta.pazartesi)} haftası
            {secili.hafta.no === buHaftaNo ? ' (bu hafta)' : ''}
          </p>
          <p style={metin}>Tema: {temaAdi}</p>
          <p style={metin}>Kazanımlar: {secili.kazanimKodlari.length > 0 ? secili.kazanimKodlari.join(', ') : '—'}</p>
          <p style={metin}>
            Etkinlikler: {bos ? 'bu hafta için hazır etkinlik yok' : dugumler.map(PLAN_ETIKETLERI.dugum).join(', ')}
            {kirpildi ? ` (ilk ${SET_EN_FAZLA_DUGUM})` : ''}
          </p>
          {(secili.hafta.not || secili.duzeltme) && (
            <p style={{ ...metin, color: COLOR.inkSoft }}>
              {[secili.hafta.not, secili.duzeltme ? `Düzeltme: ${secili.duzeltme}` : undefined]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {buHaftaNo == null && (
            <p style={{ ...metin, color: COLOR.inkSoft }}>
              Bugün bir öğretim haftası değil (tatil veya ders yılı dışı).
            </p>
          )}
        </section>
      </header>

      {/* Yılın tüm haftaları — salt okunur (satırlar dokunulmaz). */}
      <div
        ref={tabloRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          border: `2px solid ${COLOR.border}`,
          borderRadius: 12,
          background: COLOR.surface,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-adult)', color: COLOR.ink }}>
          <caption style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Yıllık plan: {YILLIK_PLAN.length} öğretim haftası
          </caption>
          <thead>
            <tr>
              {['Hafta', 'Pazartesi', 'Tema', 'Kazanımlar'].map((b) => (
                <th
                  key={b}
                  scope="col"
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    position: 'sticky',
                    top: 0,
                    background: COLOR.surface,
                  }}
                >
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {YILLIK_PLAN.map((p, i) => (
              <tr
                key={p.hafta.no}
                aria-current={i === indeks ? 'true' : undefined}
                style={{
                  background: i === indeks ? 'var(--color-accent)' : undefined,
                  color: i === indeks ? '#fff' : undefined,
                  fontWeight: p.hafta.no === buHaftaNo ? 700 : 400,
                }}
              >
                <td style={{ padding: '4px 10px' }}>
                  {p.hafta.no}
                  {p.hafta.no === buHaftaNo ? ' ●' : ''}
                </td>
                <td style={{ padding: '4px 10px' }}>{trTarih(p.hafta.pazartesi)}</td>
                <td style={{ padding: '4px 10px' }}>{p.temaNo == null ? 'Tekrar' : PLAN_ETIKETLERI.tema(p.temaNo)}</td>
                <td style={{ padding: '4px 10px' }}>{p.kazanimKodlari.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p role="status" aria-live="polite" style={{ ...metin, minHeight: '1.2em' }}>
        {bildirim}
      </p>

      {/* Alt bölge: tüm eylemler. */}
      <nav
        aria-label="Hafta seçimi"
        style={{ flex: '0 0 auto', display: 'flex', flexWrap: 'wrap', gap: 'var(--size-gap-tight)' }}
      >
        <BigButton
          label="Önceki hafta"
          size="tapMin"
          variant="ghost"
          disabled={indeks === 0}
          onBlockedPress={() => undefined}
          onPress={() => setIndeks((i) => Math.max(0, i - 1))}
          style={{ padding: '0 20px' }}
        >
          ← Önceki hafta
        </BigButton>
        <BigButton
          label="Bu hafta"
          size="tapMin"
          variant="ghost"
          onPress={() => setIndeks(Math.max(0, varsayilanHaftaIndeksi(YILLIK_PLAN, bugun)))}
          style={{ padding: '0 20px' }}
        >
          Bu hafta
        </BigButton>
        <BigButton
          label="Sonraki hafta"
          size="tapMin"
          variant="ghost"
          disabled={indeks === YILLIK_PLAN.length - 1}
          onBlockedPress={() => undefined}
          onPress={() => setIndeks((i) => Math.min(YILLIK_PLAN.length - 1, i + 1))}
          style={{ padding: '0 20px' }}
        >
          Sonraki hafta →
        </BigButton>
        <BigButton
          label="Planı CSV indir"
          size="tapMin"
          variant="ghost"
          onPress={csvIndir}
          style={{ padding: '0 20px' }}
        >
          Planı CSV indir
        </BigButton>
        <BigButton
          label="Yazdırılabilir planı indir"
          size="tapMin"
          variant="ghost"
          onPress={htmlIndir}
          style={{ padding: '0 20px' }}
        >
          Yazdırılabilir plan
        </BigButton>
      </nav>

      <footer
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--size-gap-tight)',
          alignItems: 'center',
        }}
      >
        {/* Geri (veli paneline) / Ana menü: ortak gezinme rayı (KG-103). */}
        <BigButton
          label="Bu haftanın kâğıdı"
          size="tapMin"
          variant={tahta ? 'solid' : 'accent'}
          disabled={bos}
          onBlockedPress={() => setBildirim('Bu hafta için hazır etkinlik yok; başka bir hafta seçin.')}
          onPress={() => kagitIcinSet(tohumla())}
          style={{ padding: '0 24px', fontWeight: 700 }}
        >
          Bu haftanın kâğıdı
        </BigButton>
        {tahta && (
          <BigButton
            label="Bu haftanın setini tahtada başlat"
            size="tapMin"
            variant="accent"
            disabled={bos}
            onBlockedPress={() => setBildirim('Bu hafta için hazır etkinlik yok; başka bir hafta seçin.')}
            onPress={() => setBaslat(tohumla())}
            style={{ padding: '0 32px', fontWeight: 700 }}
          >
            Tahtada başlat
          </BigButton>
        )}
      </footer>
    </main>
  );
}
