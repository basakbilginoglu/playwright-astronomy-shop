# AI Decision Log

## Amaç

Bu dosya, Astronomy Shop QA Engineering Challenge sırasında AI desteği alınan önemli noktaları, AI önerilerinin nasıl değerlendirildiğini ve nihai teknik kararların nasıl doğrulandığını kaydeder.

AI, teknik kararların yerine geçmek için değil; problem analizi, alternatifleri değerlendirme, hata ayıklama ve dokümantasyon çalışmalarını desteklemek için kullanılmıştır.

## 1. TypeScript ve Playwright yapılandırması

**Problem**

Playwright projesinde TypeScript yapılandırmasının tamamlanması ve test kodlarının typecheck aşamasından geçmesi gerekiyordu.

**Önce kendim ne yaptım?**

Proje bağımlılıklarını ve mevcut `package.json` yapılandırmasını inceledim. TypeScript kurulumu ve derleyici yapılandırması üzerinde çalıştım.

**AI neden kullanıldı?**

TypeScript yapılandırma seçeneklerinin ve modül çözümleme ayarlarının etkisini anlamak, karşılaşılan yapılandırma sorunlarını çözmek için teknik destek alındı.

**AI ne önerdi?**

TypeScript kurulumu, `tsconfig.json` ayarları, `moduleResolution` ve type-only import kullanımı konusunda öneriler sundu.

**Ben ne yaptım?**

Önerileri projeye uyguladım. Import yapısını mevcut proje tercihime uygun tuttum; `.js` uzantılı import kullanımını tercih etmedim.

**Nasıl doğruladım?**

`npm run typecheck` komutunu çalıştırdım ve başarılı sonuç aldım.

## 2. UI-01 — Successful checkout hata araştırması

**Problem**

Başarılı checkout testi, sipariş onay ekranının görünmesini beklerken başarısız oldu.

**Önce kendim ne yaptım?**

Test çıktısını ve uygulamanın ekranda kaldığı durumu inceledim. Siparişin tamamlanmadığını gözlemledim.

**AI neden kullanıldı?**

Başarısızlığın locator kaynaklı mı, uygulama davranışından mı, yoksa servis bağımlılığından mı kaynaklandığını ayırt etmek için debugging desteği alındı.

**AI ne önerdi?**

Checkout endpoint'ine giden response'un status kodunu ve response body içeriğini incelemek için geçici bir response listener önerdi.

**Ben ne yaptım?**

Debug kodunu teste ekledim ve `page` fixture'ını test fonksiyonuna dahil ettim.

**Nasıl doğruladım?**

Response çıktısında şu sonuç görüldü:

- Endpoint: `/api/checkout`
- HTTP status: `500`
- Response body: `{"error":"Failed to place order."}`

İlk aşamada sorun locator kaynaklı görünmüyordu. Daha sonra payment servisinin erişilebilirlik ayarının kapalı olduğunu kendim tespit ettim.

**Nihai değerlendirme**

Bu olay, UI assertion hatasının her zaman UI locator problemi anlamına gelmediğini gösterdi. Checkout akışının bağımlı olduğu payment servisinin durumu da araştırılmalıdır.

Payment servisi yeniden erişilebilir hâle getirildikten sonra UI-01'in tekrar çalıştırılması gerekir. Bu son doğrulama yapılmadan testin güncel ortamda başarılı olduğu iddia edilmemelidir.

## 3. UI-02 — Browser validation ve request kontrolü

**Problem**

ZIP Code alanı boş bırakıldığında checkout işleminin engellendiğini güvenilir biçimde doğrulamak gerekiyordu.

**AI neden kullanıldı?**

Tarayıcının yerleşik form doğrulaması ile checkout request kontrolünün birbirinden neyi kanıtladığını anlamak için açıklama ve kod inceleme desteği alındı.

**AI ne önerdi?**

`HTMLInputElement.validity` özelliklerinin incelenmesini ve `valueMissing` ile `valid` arasındaki farkın değerlendirilmesini önerdi.

**Ben ne yaptım?**

Mevcut `CartPage` metodunu inceledim:

```ts
async isZipMissingByBrowserValidation(): Promise<boolean> {
  return this.zipInput.evaluate(
    (el) => (el as HTMLInputElement).validity.valueMissing
  );
}