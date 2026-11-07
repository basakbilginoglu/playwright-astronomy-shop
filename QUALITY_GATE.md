# Bölüm E — Astronomy Shop Kalite Kapısı Tasarımı

## 1. Kapsam ve Tasarım Yaklaşımı

Bu kalite kapısı, Astronomy Shop projesinin Pull Request (PR) sonrasında ana dala birleştirilmeden önce hangi kontrollerden geçmesi gerektiğini tanımlar.

Kararlar, proje üzerinde gerçekleştirilen Playwright testleri, TypeScript yapılandırması ve test sırasında karşılaşılan servis bağımlılığı problemi dikkate alınarak verilmiştir.

Test sürecinde üç farklı doğrulama ihtiyacı ortaya çıktı:

- Kodun testler çalıştırılmadan önce teknik olarak geçerli olduğunun kontrol edilmesi.
- Kullanıcının satın alma gibi kritik bir işlemi tamamlayabildiğinin doğrulanması.
- Bir test başarısız olduğunda problemin uygulamadan mı, API yanıtından mı yoksa bağımlı bir servisten mi kaynaklandığının ayırt edilmesi.

Bu nedenle kalite kapısı yalnızca UI testlerinin başarılı olmasına dayandırılmadı. Statik kontrol, servis hazırlığı, gerçek kullanıcı akışı ve kontrollü API hata senaryoları birbirinden ayrı değerlendirildi.

## 2. Mevcut Test Kapsamı ve Bulgular

Projede şu anda checkout akışını kapsayan beş test bulunmaktadır.

| Test | Testin amacı | Doğrulanan davranış |
|---|---|---|
| UI-01 | Geçerli bilgilerle sipariş oluşturma | Sipariş onayı, teslimat adresi, ürün, miktar ve toplam tutar |
| UI-02 | ZIP Code girilmediğinde checkout işleminin engellenmesi | Tarayıcı doğrulaması ve checkout isteğinin gönderilmemesi |
| UI-03 (400) | Checkout API 400 döndürdüğünde siparişin tamamlanmaması | İstemcinin hatalı isteğe verdiği tepki |
| UI-03 (500) | Checkout API 500 döndürdüğünde siparişin tamamlanmaması | Sunucu hatasında siparişin tamamlanmaması |
| UI-03 (503) | Checkout API 503 döndürdüğünde siparişin tamamlanmaması | Servis kullanılamadığında hata davranışı |

### 2.1 UI-01: Başarılı Checkout

UI-01, kalite kapısındaki en önemli kullanıcı akışıdır.

Test yalnızca sipariş butonuna tıklanmasını kontrol etmez. Sipariş tamamlandıktan sonra aşağıdaki bilgileri de doğrular:

- Sipariş onay başlığının görünmesi
- Sipariş onay alanında UUID formatında bir sipariş kimliğinin bulunması
- Teslimat adresinin doğru gösterilmesi
- Sipariş edilen ürünün ve miktarın doğru olması
- Sipariş toplamının beklenen değerle eşleşmesi

Bu kontroller, siparişin yalnızca arayüzde ilerlemesini değil, kullanıcıya gösterilen sipariş bilgilerinin de tutarlı olmasını hedefler.

Test sırasında payment servisi erişilebilir değilken checkout işlemi gerçekleştirildi ve aşağıdaki yanıt alındı:

```text
CHECKOUT STATUS: 500
CHECKOUT URL: http://localhost:8080/api/checkout?currencyCode=USD
CHECKOUT BODY: {"error":"Failed to place order."}
```

İlk incelemede Playwright'ın sipariş onay başlığını bulamadığı görüldü. Ancak sorun locator'dan kaynaklanmıyordu. Payment servisinin erişilebilirlik ayarı kapalı olduğu için checkout işlemi tamamlanamıyordu.

Bu olay iki ayrı kontrol ihtiyacını ortaya çıkardı:

1. Checkout akışının gerçekten çalıştığının doğrulanması.
2. Checkout başlamadan önce gerekli bağımlı servislerin erişilebilir olduğunun kontrol edilmesi.

Bu nedenle UI-01, her PR'da çalıştırılacak kritik bir test olarak seçildi. Ancak testin merge engelleyici olabilmesi için gerekli servislerin hazır olması ön koşul olarak kabul edildi.

### 2.2 UI-02: ZIP Code Validasyonu

UI-02 testinde ZIP Code alanı boş bırakılarak Place Order işlemi denendi.

Testte iki önemli doğrulama bulunuyor:

```ts
expect(await cartPage.isZipMissingByBrowserValidation()).toBe(true);
expect(checkoutRequested).toBe(false);
```

İlk kontrol, tarayıcının zorunlu alan doğrulamasını gerçekleştirdiğini; ikinci kontrol ise doğrulama başarısız olduğunda checkout API isteğinin gönderilmediğini kontrol ediyor.

Bu ayrım önemlidir. Yalnızca sipariş onay sayfasının görünmediğini kontrol etmek, form doğrulamasının gerçekten çalıştığını kanıtlamaz.

UI-02'nin hızlı ve kritik bir form davranışını doğrulaması nedeniyle her PR'da çalıştırılması önerildi.

### 2.3 UI-03: API Hata Senaryoları

UI-03 kapsamında checkout API için üç farklı hata yanıtı test edildi:

- HTTP 400 — Bad Request
- HTTP 500 — Internal Server Error
- HTTP 503 — Service Unavailable

Testlerde `page.route()` kullanılarak API yanıtı kontrol edildi ve hata yanıtları mock olarak üretildi.

Örneğin:

```ts
await page.route('**/api/checkout**', async (route) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Mocked checkout error' }),
  });
});
```

Bu yaklaşım, her hata senaryosunu gerçek backend'in o anda aynı hatayı üretmesine bağlı kalmadan tekrarlanabilir şekilde test etmeyi sağlıyor.

Testler ayrıca checkout isteğinin gerçekten gönderildiğini ve hata yanıtından sonra sipariş onay sayfasına geçilmediğini kontrol ediyor.

Burada önemli bir kapsam sınırı var: Bu testler gerçek backend'in 400, 500 veya 503 ürettiğini doğrulamıyor. API hatası alındığında frontend'in nasıl davrandığını doğruluyor.

Dolayısıyla UI-03 testleri, gerçek servis sağlık kontrolünün yerine geçemez. İki kontrol farklı riskleri kapsar.

## 3. Kalite Kapısı Karar Tablosu

Aşağıdaki kararlar, mevcut test kapsamı ve gözlemlenen riskler dikkate alınarak verilmiştir.

| Kontrol | PR için karar | Hedef süre | Merge engeli | Projeye özgü gerekçe |
|---|---|---:|---|---|
| Typecheck | Zorunlu | 30 sn altı | Evet | TypeScript yapılandırmasından sonra `npm run typecheck` hatasız çalıştı. Hızlı ve erken hata tespiti sağlıyor. |
| Smoke UI | Ayrı ve küçük bir kontrol olarak önerilir | 30–60 sn | Evet | Mevcut checkout testleri temel uygulama erişimini de kapsıyor ancak bağımsız bir smoke paketi bulunmuyor. Checkout testleriyle aynı kontrolleri tekrar etmemeli. |
| Critical Checkout | Zorunlu | 1–3 dk | Evet | UI-01 gerçek sipariş akışını ve sipariş bilgilerinin doğruluğunu kontrol ediyor. Payment servisi bağımlılığı test sırasında ortaya çıktı. |
| Service Health | Zorunlu | 30–60 sn | Evet | Payment servisi erişilebilir olmadığında checkout API 500 döndürdü. Test öncesi bağımlılık kontrolü gerekli. |
| API / Service Checks | Zorunlu | 30–60 sn | Evet | UI-03, 400/500/503 hata yanıtlarını doğruluyor. Gerçek servis erişilebilirliği ayrıca kontrol edilmeli. |
| Observability Sanity | İlk aşamada bilgilendirici | 30–60 sn | Hayır | Mevcut bulgularda bağımsız telemetri doğrulaması henüz gösterilmedi. Geçici telemetri sorunlarının PR'ı gereksiz yere engellemesi istenmiyor. |
| Lint | Mevcut durumda kapsam dışında | 30 sn altı | Hayır | Projede yapılandırılmış ve doğrulanmış bir lint komutu bulunmuyor. |

*Hedef süreler tasarım tahminleridir. Typecheck ve testlerin yerel çalıştırma süreleriyle karıştırılmamalıdır.*

## 4. Zorunlu Kontrollerin Ayrıntılı Değerlendirmesi

### 4.1 Typecheck — Merge Engelleyici

Typecheck, testlerin çalıştırılmasından önce yürütülecek ilk kontrol olarak seçildi.

Projede TypeScript kurulumu ve yapılandırması tamamlandıktan sonra `npm run typecheck` komutu başarıyla çalıştırıldı.

Bu kontrolün avantajı, tip hatalarının tarayıcı açılmadan tespit edilebilmesidir. UI testlerine göre daha düşük maliyetli olması da her PR'da çalıştırılmasını mantıklı kılıyor.

Typecheck başarısızsa UI testlerine geçilmeden PR başarısız kabul edilmelidir.

### 4.2 Smoke UI — Merge Engelleyici

Mevcut test setinde checkout senaryoları bulunuyor ancak bağımsız ve kısa bir smoke testi paketi bulunmuyor.

Smoke testinin amacı UI-01'i tekrar çalıştırmak değil; uygulamanın açılabildiğini ve temel sayfanın erişilebilir olduğunu hızlıca doğrulamaktır.

Bu ayrım yapılmazsa smoke testi ile critical checkout aynı riski iki kez test etmiş olur.

Bu nedenle smoke UI kalite kapısına alınmıştır ancak mevcut test setinde ayrı bir test olarak henüz uygulanmış kabul edilmemektedir.

### 4.3 Critical Checkout — Merge Engelleyici

UI-01, uygulamanın temel işlevlerinden biri olan sipariş oluşturma sürecini temsil ediyor.

Testin yalnızca siparişin tamamlandığını değil, sipariş sonrası bilgilerin doğruluğunu da kontrol etmesi onu basit bir UI testinden daha değerli hale getiriyor.

Test sırasında payment servisi erişilebilir değilken alınan 500 yanıtı, bu kontrolün bağımlılıklarını da görünür hale getirdi.

Bu nedenle UI-01'in her PR'da çalıştırılması önerildi. Test başarısız olduğunda hata otomatik olarak kod hatası kabul edilmemeli; önce servis hazırlığı ve API yanıtı incelenmelidir.

Bununla birlikte, servisler hazır olduğu doğrulandıktan sonra alınan tekrarlanabilir bir UI-01 başarısızlığı merge işlemini engellemelidir.

### 4.4 Service Health — Merge Engelleyici

UI-01 sırasında yaşanan sorun, servis sağlık kontrolünün neden ayrı bir aşama olması gerektiğini gösterdi.

Checkout işleminin başarılı olması payment servisinin erişilebilirliğine bağlıdır. Bu servis hazır değilken UI-01 çalıştırıldığında, uygulamanın gerçek davranışı yerine ortamın eksikliği test sonucunu belirleyebilir.

Bu nedenle servis sağlık kontrolü, checkout testinden önce çalıştırılmalıdır.

Kontrolün sonucu yalnızca genel bir başarısızlık mesajı vermemeli; hangi bağımlılığın erişilemediğini de belirtmelidir.

Servis sağlık kontrolü başarısız olduğunda checkout testi çalıştırılmamalı ve pipeline ortam/servis problemi olarak raporlanmalıdır.

### 4.5 API / Service Checks — Merge Engelleyici

UI-03 testleri, checkout API hata yanıtları karşısında siparişin tamamlanmadığını doğruluyor.

Bu senaryoların kalite kapısında tutulması önemlidir çünkü başarılı checkout kadar başarısız checkout davranışının da korunması gerekir.

Özellikle 500 ve 503 yanıtlarında kullanıcının siparişin tamamlandığını düşünmesine yol açacak bir davranış oluşmaması önemlidir.

Ancak mevcut UI-03 testlerinin mock kullandığı unutulmamalıdır. Bu nedenle UI-03, frontend hata yönetiminin regresyon kontrolüdür; gerçek backend sağlık kontrolü değildir.

Her iki kontrolün birlikte bulunması farklı hata türlerinin tespit edilmesini sağlar.

## 5. Merge Engelleme ve Hata Sınıflandırması

Test sırasında yaşanan payment servisi problemi, bütün başarısızlıkların aynı şekilde değerlendirilmemesi gerektiğini gösterdi.

Önerilen hata değerlendirmesi:

| Durum | Değerlendirme | PR davranışı |
|---|---|---|
| Typecheck başarısız | Kod / tip hatası | Merge engellenir. |
| Smoke UI başarısız | Uygulamanın temel erişim sorunu | Merge engellenir. |
| Payment servisi erişilemiyor | Ortam / bağımlılık problemi | Checkout testi çalıştırılmaz; pipeline başarısız veya altyapı hatası olarak raporlanır. |
| Servisler hazırken UI-01 başarısız | Olası uygulama regresyonu | İncelenir; doğrulanmış başarısızlık merge'i engeller. |
| UI-03 hata davranışı başarısız | API hata yönetiminde regresyon | Merge engellenir. |
| Observability kontrolü başarısız | İlk aşamada telemetri sorunu | Bilgilendirme yapılır, merge engellenmez. |

Buradaki amaç, altyapı kaynaklı bir problemi uygulama hatası gibi raporlamamak ve gerçek bir regresyonun da servis problemi olarak gözden kaçmasını önlemektir.

## 6. Önerilen PR Çalıştırma Sırası

Kontrollerin bağımlılık ilişkileri dikkate alındığında önerilen sıra şöyledir:

1. **Typecheck:** Kodun tip kontrolü.
2. **Service Health:** Astronomy Shop ve checkout için gerekli servislerin erişilebilirliği.
3. **Smoke UI:** Uygulamanın temel arayüz kontrolü.
4. **Critical Checkout:** UI-01 başarılı sipariş senaryosu.
5. **API Error Handling:** UI-03 kapsamındaki 400, 500 ve 503 senaryoları.
6. **Observability Sanity:** Log ve trace verilerinin kontrolü.

UI-02 form doğrulaması da checkout test paketi içerisinde çalıştırılmalıdır.

Bu sıralama, servis bağımlılığı olan testlerin gerekli ortam kontrollerinden önce çalıştırılmasını önler. Typecheck gibi hızlı kontrollerin önce çalıştırılması da gereksiz test çalıştırma maliyetini azaltır.

## 7. Sonuç ve Karar

Astronomy Shop üzerinde gerçekleştirilen testler, başarılı checkout akışının tek başına yeterli bir kalite göstergesi olmadığını ortaya koydu.

UI-01 sırasında payment servisinin erişilememesi nedeniyle alınan HTTP 500 yanıtı, test ortamının ve bağımlı servislerin hazır olmasının da kalite kapısının bir parçası olması gerektiğini gösterdi.

UI-02, tarayıcı seviyesindeki form doğrulamasının checkout isteğinin gönderilmesini engellediğini doğruladı.

UI-03 ise API'nin 400, 500 ve 503 yanıtları karşısında siparişin tamamlanmadığını kontrol etti. Bu testlerin mock tabanlı olması, gerçek servis sağlık kontrolünden farklı bir amaca hizmet ettiklerini gösteriyor.

Bu bulgulara göre:

- Typecheck, hızlı ve güvenilir bir statik kontrol olarak zorunlu seçildi.
- UI-01, kritik iş akışını temsil ettiği için zorunlu seçildi.
- Service Health, gözlemlenen payment bağımlılığı nedeniyle zorunlu seçildi.
- UI-02 ve UI-03, mevcut checkout test paketi içerisinde regresyon kontrolleri olarak tutuldu.
- Smoke UI, checkout akışını tekrar etmeyen ayrı bir hızlı kontrol olarak önerildi.
- Observability başlangıçta bilgilendirici bırakıldı.
- Lint, mevcut projede doğrulanmış bir yapılandırma bulunmadığından kapsam dışında tutuldu.

Bu kalite kapısı tasarımı, mevcut test bulgularını temel alır. Henüz uygulanmamış kontrollerin çalışır durumda olduğu varsayılmaz. CI üzerinde gerçek çalışma süreleri ve kararlılık sonuçları elde edildikçe kararlar yeniden değerlendirilebilir.