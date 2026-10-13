/*
 * Yerel açılış uyarısı (plan v2 Adım 49, KG-71). Klasik betik: `file://` ile açılışta tarayıcı modül betiklerini
 * engeller ve uygulama hiç başlamaz. Bu dosya o durumda boş ekran yerine ne yapılacağını yazar. Ağa gitmez.
 */
(function () {
  if (location.protocol !== 'file:') return;
  var kok = document.getElementById('root');
  if (!kok) return;
  var main = document.createElement('main');
  main.setAttribute('aria-labelledby', 'yerel-baslik');
  main.style.cssText =
    'max-width:720px;margin:48px auto;padding:24px;font-family:system-ui,sans-serif;font-size:20px;line-height:1.5;color:#1F2937';
  var h1 = document.createElement('h1');
  h1.id = 'yerel-baslik';
  h1.textContent = 'Okulumsun dosyadan doğrudan açılamaz';
  var p1 = document.createElement('p');
  p1.textContent =
    'Tarayıcılar güvenlik nedeniyle bu tür uygulamaları dosyaya çift tıklayarak açmaya izin vermez. Şunlardan birini deneyin:';
  var ul = document.createElement('ul');
  [
    'İnternet varsa: okulumsun-tc.vercel.app adresini açın. Bir kez açıldıktan sonra internet olmadan da çalışır.',
    'Okul sunucusu: bu klasörü okulun web sunucusuna kopyalayın ve oradan açın (alt klasör de olur).',
    'Bilgisayarda: klasörde bir yerel sunucu başlatın (ayrıntılar OKUBENI.txt dosyasında).',
  ].forEach(function (metin) {
    var li = document.createElement('li');
    li.textContent = metin;
    ul.appendChild(li);
  });
  main.appendChild(h1);
  main.appendChild(p1);
  main.appendChild(ul);
  kok.appendChild(main);
})();
