/**
 * Türkçe hece ayırıcı (Okuma Yazma planı Adım 62; `docs/mufredat-kisitlari-turkce.md` §6).
 * Beklenen hecelemeler TDK hece kuralıyla elle yazıldı. Öğretmen listesindeki 200 sözcükle doğrulama Adım 66'da.
 */
import { describe, expect, it } from 'vitest';
import { hecele, heceTuru } from '../../src/content/dersler/tur/heceleme';

const BEKLENEN = `
a a | an an | en en | at at | et et | alt alt | ana a-na | ata a-ta | nal nal | anne an-ne | nene ne-ne | alet a-let | atlet at-let
nane na-ne | tane ta-ne | ela e-la | elma el-ma | kalem ka-lem | okul o-kul | kitap ki-tap | masa ma-sa | araba a-ra-ba
elmas el-mas | Türkçe Türk-çe | kontrol kont-rol | santral sant-ral | program prog-ram | saat sa-at | şiir şi-ir | aile a-i-le
saatçi sa-at-çi | tren tren | spor spor | kral kral | gri gri | stres stres | strateji stra-te-ji | profesör pro-fe-sör
kırmızı kır-mı-zı | çocuk ço-cuk | öğretmen öğ-ret-men | ağaç a-ğaç | dağ dağ | yağmur yağ-mur | ırmak ır-mak | ılık ı-lık
ilkbahar ilk-ba-har | sonbahar son-ba-har | Ankara An-ka-ra | İstanbul İs-tan-bul | Iğdır Iğ-dır | ayran ay-ran
kayısı ka-yı-sı | bisiklet bi-sik-let | kelebek ke-le-bek | balık ba-lık | yıldız yıl-dız | çiçek çi-çek | kuş kuş | top top
balon ba-lon | kalemlik ka-lem-lik | arkadaş ar-ka-daş | bardak bar-dak | tabak ta-bak | kaşık ka-şık | çatal ça-tal
ekmek ek-mek | peynir pey-nir | zeytin zey-tin | domates do-ma-tes | patates pa-ta-tes | havuç ha-vuç | portakal por-ta-kal
limon li-mon | erik e-rik | muz muz | üzüm ü-züm | armut ar-mut | Mete Me-te | Nil Nil | Ali A-li | Rana Ra-na | Okan O-kan
Kemal Ke-mal | Ata A-ta | anneanne an-ne-an-ne | teyze tey-ze | amca am-ca | dede de-de | köpek kö-pek | kedi ke-di
inek i-nek | tavuk ta-vuk | koyun ko-yun | keçi ke-çi | ev ev | oda o-da | kapı ka-pı | pencere pen-ce-re | perde per-de
halı ha-lı | dolap do-lap | yatak ya-tak | yastık yas-tık | saksı sak-sı | harf harf | hece he-ce | cümle cüm-le
sözcük söz-cük | metin me-tin | Türk Türk | kent kent | renk renk | sarı sa-rı | mavi ma-vi | yeşil ye-şil | turuncu tu-run-cu
mor mor | pembe pem-be | beyaz be-yaz | siyah si-yah | ilkokul il-ko-kul | okuma o-ku-ma | yazma yaz-ma | dinleme din-le-me
konuşma ko-nuş-ma | eylül ey-lül | ekim e-kim | kasım ka-sım | aralık a-ra-lık | ocak o-cak | şubat şu-bat | mart mart
nisan ni-san | mayıs ma-yıs | haziran ha-zi-ran | temmuz tem-muz | ağustos a-ğus-tos | matematik ma-te-ma-tik | ünlü ün-lü
ünsüz ün-süz | bilgisayar bil-gi-sa-yar | televizyon te-le-viz-yon | radyo rad-yo | kütüphane kü-tüp-ha-ne
hastane has-ta-ne | kâğıt kâ-ğıt | rüzgâr rüz-gâr | ödev ö-dev | dört dört | üç üç | beş beş | altı al-tı | yedi ye-di
sekiz se-kiz | dokuz do-kuz | on on | yirmi yir-mi | otuz o-tuz | kırk kırk | elli el-li | yüz yüz | bin bin | korkmak kork-mak
anlat an-lat | nine ni-ne | tel tel | ilaç i-laç | lale la-le | lamba lam-ba | tepe te-pe | etek e-tek
leylek ley-lek | limonata li-mo-na-ta | oyun o-yun | oyuncak o-yun-cak | kurt kurt | kova ko-va | kum kum | kumru kum-ru
mum mum | ördek ör-dek | sincap sin-cap | soba so-ba | su su | sabun sa-bun | yumurta yu-mur-ta | düdük dü-dük | zil zil
zürafa zü-ra-fa | çanta çan-ta | baba ba-ba | bebek be-bek | gemi ge-mi | göz göz | ceket ce-ket | şapka şap-ka | şemsiye şem-si-ye
papatya pa-pat-ya | horoz ho-roz | vazo va-zo | fil fil | fincan fin-can | jeton je-ton | jale ja-le | ağabey a-ğa-bey | öğle öğ-le
`
  .split(/[|\n]/)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => s.split(' ') as [string, string]);

describe('hece ayırıcı', () => {
  it(`${BEKLENEN.length} sözcükte TDK kuralıyla aynı`, () => {
    expect(BEKLENEN.length).toBeGreaterThanOrEqual(190);
    const yanlis = BEKLENEN.filter(([s, b]) => hecele(s).join('-') !== b).map(
      ([s, b]) => `${s}: ${hecele(s).join('-')} ≠ ${b}`,
    );
    expect(yanlis).toEqual([]);
  });

  it('hece sayısı = ünlü sayısı; birleşince özgün sözcük (büyük/küçük korunur)', () => {
    for (const [s] of BEKLENEN) {
      const h = hecele(s);
      expect(h.join(''), s).toBe(s);
      expect(h.length, s).toBe([...s].filter((c) => /[aeıioöuüâîûAEIİOÖUÜÂÎÛ]/u.test(c)).length);
      for (const x of h)
        expect(
          [...x].filter((c) => /[aeıioöuüâîûAEIİOÖUÜÂÎÛ]/u.test(c)),
          `${s}/${x}`,
        ).toHaveLength(1);
    }
  });

  it('harf dışı karakter, boş girdi ve ünlüsüz sözcük hata verir', () => {
    for (const k of ['', 'ana ne', "Ali'ye", 'an-ne', 'elma.', 'hmm', 'x1']) expect(() => hecele(k), k).toThrow();
  });

  it('hece türleri: açık, kapalı, üç ve dört harfli', () => {
    expect(['a', 'na', 'ne', 'kı'].map(heceTuru)).toEqual(['acik', 'acik', 'acik', 'acik']);
    expect(['an', 'at', 'el', 'ın'].map(heceTuru)).toEqual(['kapali', 'kapali', 'kapali', 'kapali']);
    expect(['nal', 'alt', 'tre'].map(heceTuru)).toEqual(['uc', 'uc', 'uc']);
    expect(['kent', 'Türk', 'kont'].map(heceTuru)).toEqual(['dort', 'dort', 'dort']);
  });
});
