## Baseline Test Sonuçları

Baseline testleri 1 Virtual User (sanal kullanıcı) ve
3 iteration (tekrar) ile üç ayrı kez çalıştırıldı.

| Test | Ortalama Checkout Süresi | Maksimum Süre | HTTP Hata Oranı |
|---|---:|---:|---:|
| 1. çalıştırma | 232.50 ms | 523.92 ms | %0 |
| 2. çalıştırma | 59.53 ms | 80.87 ms | %0 |
| 3. çalıştırma | 79.47 ms | 104.56 ms | %0 |

Üç test de başarıyla tamamlandı.
Toplam 9 checkout isteği ölçüldü.

İlk çalıştırmada yanıt süreleri sonraki iki
çalıştırmaya göre daha yüksek çıktı. Bu farklılık,
ileride yapılacak yük testi sonuçları değerlendirilirken
dikkate alınmalıdır.

Bu sonuçlar yerel test ortamına aittir.
Üretim ortamı için performans hedefi olarak
kabul edilmemelidir.

## Spike Testi ve Toparlanma Kontrolü

Spike testinde yük kısa süreliğine 10 VU seviyesine çıkarıldı. 
Toplam 79 iteration tamamlandı. HTTP hata oranı %0.63, p95 
yanıt süresi 10.89 saniye olarak ölçüldü. Bir checkout işlemi 
başarısız oldu.

Spike sonrasında 1 VU ile baseline testi tekrar çalıştırıldı. 
6 kontrolün tamamı başarılı oldu ve HTTP hata oranı %0 olarak 
ölçüldü. p95 yanıt süresi 2.83 saniyeye düştü.

Sonuçlar, yük azaltıldıktan sonra sistemin daha düşük yanıt 
süreleriyle çalışmaya devam ettiğini gösteriyor. Ancak mevcut 
ölçümler toparlanma süresini kesin olarak belirlemek için yeterli değil.


## Threshold Kontrolü

Baseline testi için dört threshold tanımlandı:

- HTTP hata oranı %1'in altında olmalı.
- HTTP isteklerinin p95 süresi 5 saniyenin altında olmalı.
- Check başarı oranı %99'un üzerinde olmalı.
- Checkout işlemlerinin p95 süresi 5 saniyenin altında olmalı.

Normal baseline testinde bütün threshold'lar geçildi.

Threshold mekanizmasını doğrulamak için HTTP p95 sınırı geçici olarak 1 ms yapıldı. Test sonucunda k6, `http_req_duration` threshold ihlalini bildirdi ve başarısız çıkış koduyla tamamlandı.

Test sonrasında HTTP p95 sınırı tekrar 5000 ms olarak ayarlandı.

## k6 ve Jaeger Korelasyonu

k6 baseline testi sırasında oluşturulan checkout işlemi Jaeger üzerinden incelendi.

İncelenen trace bilgileri:
- Service: checkout
- Operation: oteldemo.CheckoutService/PlaceOrder
- Duration: 653 ms
- User ID: k6-user-1-1
- Order amount: 78.94 USD
- gRPC status: OK

Cart servisi loglarında aynı kullanıcı ID'si bulundu. Kullanıcının
ürünü sepete eklediği, sepet bilgilerini görüntülediği ve checkout
sonrasında sepetin boşaltıldığı görüldü.

Bu eşleşme, k6 test verisi ile Jaeger trace ve cart logları arasında
ilişki kurmayı destekliyor. Ancak loglar belirli bir trace ID ile
eşleştirilmedi ve zaman bilgisi kesin olarak doğrulanamadı.
Checkout servis loglarında da ilgili kayıt bulunamadı.

Kanıtlar:
- evidence/k6-checkout-trace.png
- evidence/k6-cart-logs.png

## Staged Load Testi

Staged load testi 2 dakika boyunca 1-5 VU arasında kademeli
yük oluşturacak şekilde çalıştırıldı.

Sonuçlar:
- Toplam HTTP isteği: 238
- Tamamlanan iteration: 119
- HTTP hata oranı: %0
- Check başarı oranı: %100
- Ortalama HTTP yanıt süresi: 1.16 saniye
- HTTP p95: 5.58 saniye
- Ortalama checkout süresi: 2.32 saniye
- Checkout p95: 6.04 saniye
- Checkout maksimum süresi: 7.02 saniye

Bütün sepet ve sipariş kontrolleri başarılı oldu. Ancak yük
altında yanıt süreleri yükseldi. Bu sonuç, hata oluşmadan da
performans düşüşü yaşanabileceğini gösteriyor.