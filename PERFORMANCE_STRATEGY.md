# Checkout Performans ve Güvenilirlik Test Stratejisi

## 1. Amaç

Bu çalışmanın amacı, Astronomy Shop uygulamasındaki sipariş tamamlama (checkout) işleminin farklı yük seviyelerinde nasıl çalıştığını incelemektir.

Testlerde yanıt süreleri, hata oranları ve uygulamanın yoğun trafik altındaki davranışı değerlendirilecektir.

Performans testlerine başlamadan önce mevcut Playwright testleri çalıştırılarak uygulamanın düzgün çalıştığı kontrol edilmiştir.

## 2. Test Öncesi Kontrol

Mevcut Playwright testleri çalıştırıldı.

- Toplam test: 5
- Başarılı: 5
- Başarısız: 0

Başarılı sipariş senaryosunda geçerli adres bilgileriyle sipariş tamamlanabildiği doğrulandı.

Bu sonuç, performans testlerine başlamak için uygulamanın hazır olduğunu gösteriyor.

## 3. Olası Performans ve Güvenilirlik Riskleri

| Risk | Kullanıcıya etkisi | Kontrol edilecek durum |
|---|---|---|
| Checkout işleminin yavaşlaması | Kullanıcı siparişini tamamlamak için uzun süre bekleyebilir. | Yanıt süreleri ve özellikle p95 değeri |
| Checkout servisinin yoğunluğu kaldıramaması | Sipariş sırasında hata alınabilir veya işlem zaman aşımına uğrayabilir. | Hata oranı, 5xx cevapları ve zaman aşımı |
| Ödeme servisinde sorun yaşanması | Kullanıcı ödeme yapamayabilir ve sipariş tamamlanmayabilir. | Ödeme hataları ve Jaeger izleri |
| Sepet servisinin yavaşlaması | Sipariş bilgileri doğru şekilde alınamayabilir. | Sepet isteklerinin yanıt süreleri ve hata oranı |
| Ani trafik artışı | Çok sayıda kullanıcı aynı anda sipariş vermeye çalıştığında sistem yavaşlayabilir. | Yanıt süreleri ve hata sayısındaki artış |
| Kaynak kullanımının artması | Uygulamanın genel performansı düşebilir. | CPU, bellek kullanımı ve Docker container durumları |

Bu maddeler test sırasında kontrol edilecek olası risklerdir. Henüz tespit edilmiş sorunlar değildir.

## 4. Test Edilecek Servis ve Endpoint

Performans testinin ana hedefi checkout işlemidir.

**Checkout endpoint:**

`POST /api/checkout?currencyCode=USD`

Bu istek frontend üzerinden alınır ve Checkout Service'e gRPC aracılığıyla iletilir.

Sipariş öncesinde ürünün sepete eklenmesi gerekir.

**Sepet endpoint:**

`POST /api/cart?currencyCode=USD`

Testlerde checkout işlemi öncesinde sepet hazırlanacaktır.

## 5. Test Verilerinin Hazırlanması

Testlerde uygulamanın kabul ettiği örnek adres ve ödeme bilgileri kullanılacaktır.

- Her sanal kullanıcı için farklı bir kullanıcı ID'si oluşturulacaktır.
- Kullanıcıların sepetleri birbirinden ayrı tutulacaktır.
- Sepete geçerli bir ürün eklenecektir.
- Para birimi USD olacaktır.
- Geçerli adres, e-posta ve demo kart bilgileri kullanılacaktır.

Her başarılı sipariş sepeti tüketebileceğinden, yeni bir test işlemi öncesinde sepet yeniden hazırlanacaktır.

## 6. Uygulanacak Testler

Performans çalışması kapsamında şu testler yapılacaktır:

- **Baseline testi:** Düşük yükte ölçüm yapılacak ve test üç kez tekrarlanacaktır.
- **Load testi:** Kullanıcı sayısı en az üç farklı seviyede artırılacaktır.
- **Spike testi:** Kısa sürede ani kullanıcı artışının sisteme etkisi incelenecektir.
- **Smoke testi:** CI sürecinde checkout işleminin temel performans kontrolü yapılacaktır.

Test sonuçları karşılaştırılarak yanıt süreleri ve hata oranlarındaki değişimler incelenecektir.

## 7. Test Ortamının Sınırlamaları

Uygulama ve k6 aynı bilgisayarda çalışacaktır. Bu nedenle ikisi de bilgisayarın işlemci, bellek ve ağ kaynaklarını kullanacaktır.

k6'nın oluşturduğu yük uygulamanın performansını etkileyebilir. Bu durum ölçüm sonuçlarını değiştirebilir.

Bu nedenle elde edilen sonuçlar yalnızca yerel test ortamı için değerlendirilecektir. Production ortamının kapasitesi hakkında kesin bir sonuç çıkarılmayacaktır.

## 8. Kullanılacak İzleme Araçları

Test sırasında farklı araçlardan elde edilen bilgiler birlikte değerlendirilecektir.

- **k6:** Yanıt süreleri, istek sayısı ve hata oranları.
- **Jaeger:** İsteklerin servisler arasındaki izleri ve gecikmeler.
- **Uygulama logları:** Hata mesajları ve başarısız işlemler.
- **Docker:** Container durumları ve kaynak kullanımı.