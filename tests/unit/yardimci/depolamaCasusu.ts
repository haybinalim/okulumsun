/**
 * Birim testlerinde tarayıcı depolama yazımlarını kaydeden casus (plan v2 Adım 26).
 * Bir modülün veya bileşenin çalışırken nereye yazdığını kanıtlamak için kullanılır;
 * `sok()` her şeyi özgün haline döndürür.
 */
export interface DepolamaCagrisi {
  readonly api: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cookie' | 'cacheStorage';
  readonly anahtar: string;
}

export function depolamaCasusuKur(): { readonly cagrilar: () => readonly DepolamaCagrisi[]; readonly sok: () => void } {
  const kayit: DepolamaCagrisi[] = [];
  const geriAl: (() => void)[] = [];

  // happy-dom, depo yöntemini ilk erişimde örneğe bağlar (ClassMethodBinder); sonrasında
  // prototip yaması o örneği yakalamaz. Bu yüzden önce örneklerin kendisi yamalanır
  // (Adım 27'de bulundu: daha önce yazılmış bir depoda casus sessiz kalıyordu).
  for (const [api, depo] of [
    ['localStorage', globalThis.localStorage],
    ['sessionStorage', globalThis.sessionStorage],
  ] as const) {
    if (!depo) continue;
    const onceki = depo.setItem;
    Object.defineProperty(depo, 'setItem', {
      configurable: true,
      writable: true,
      value: (anahtar: string, deger: string) => {
        onceki.call(depo, anahtar, deger);
        kayit.push({ api, anahtar });
      },
    });
    geriAl.push(() => {
      Object.defineProperty(depo, 'setItem', { configurable: true, writable: true, value: onceki });
    });
  }

  const setItemOzgun = Storage.prototype.setItem;
  Storage.prototype.setItem = function (this: Storage, anahtar: string, deger: string) {
    setItemOzgun.call(this, anahtar, deger);
    // Bazı ortamlar (happy-dom) depoyu vekil nesneyle sunar; `this ===` karşılaştırması
    // güvenilmez. Hangi deponun değiştiğine yazımdan sonra bakılır.
    const ls = globalThis.localStorage?.getItem(anahtar) === deger;
    const ss = globalThis.sessionStorage?.getItem(anahtar) === deger;
    const api =
      ss && !ls
        ? 'sessionStorage'
        : ls && !ss
          ? 'localStorage'
          : this === globalThis.sessionStorage
            ? 'sessionStorage'
            : 'localStorage';
    kayit.push({ api, anahtar });
  };
  geriAl.push(() => {
    Storage.prototype.setItem = setItemOzgun;
  });

  // `cookie` erişimcisi ortama göre farklı prototipte durur (tarayıcı, happy-dom).
  let cerezTanimi: PropertyDescriptor | undefined;
  for (let p: object | null = document; p && !cerezTanimi; p = Object.getPrototypeOf(p)) {
    cerezTanimi = Object.getOwnPropertyDescriptor(p, 'cookie');
  }
  if (cerezTanimi?.set) {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cerezTanimi.get!.call(document),
      set: (v: string) => {
        kayit.push({ api: 'cookie', anahtar: v.split('=')[0]!.trim() });
        cerezTanimi.set!.call(document, v);
      },
    });
    geriAl.push(() => {
      delete (document as { cookie?: string }).cookie;
    });
  }

  const idbOzgun = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  const idb = globalThis.indexedDB as IDBFactory | undefined;
  const sahteIdb = {
    open: (ad: string, ...geri: unknown[]) => {
      kayit.push({ api: 'indexedDB', anahtar: ad });
      return idb ? (idb.open as (...a: unknown[]) => IDBOpenDBRequest)(ad, ...geri) : ({} as IDBOpenDBRequest);
    },
  };
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: idb ? Object.assign(Object.create(idb), sahteIdb) : sahteIdb,
  });
  geriAl.push(() => {
    if (idbOzgun) Object.defineProperty(globalThis, 'indexedDB', idbOzgun);
    else delete (globalThis as { indexedDB?: unknown }).indexedDB;
  });

  const cachesOzgun = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  const caches = (globalThis as { caches?: CacheStorage }).caches;
  Object.defineProperty(globalThis, 'caches', {
    configurable: true,
    value: {
      open: (ad: string) => {
        kayit.push({ api: 'cacheStorage', anahtar: ad });
        return caches ? caches.open(ad) : Promise.resolve({} as Cache);
      },
    },
  });
  geriAl.push(() => {
    if (cachesOzgun) Object.defineProperty(globalThis, 'caches', cachesOzgun);
    else delete (globalThis as { caches?: unknown }).caches;
  });

  return {
    cagrilar: () => [...kayit],
    sok: () => {
      while (geriAl.length) geriAl.pop()!();
    },
  };
}
