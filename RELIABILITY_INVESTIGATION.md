# Reliability Investigation

## Testin Amacı

Ödeme servisinin erişilemez olması durumunda checkout işlemlerinin nasıl etkilendiğini ve bu durum ortadan kaldırıldığında sistemin tekrar çalışıp çalışmadığını kontrol etmek.

## Kullanılan Mekanizma

Feature flag panelinde yalnızca `paymentUnreachable` flag'i kullanıldı.

- Bozulma testi öncesinde: `paymentUnreachable = On`
- Toparlanma testi öncesinde: `paymentUnreachable = Off`
- `paymentFailure` flag'i her iki testte de kapalı tutuldu.

Her iki testte de aynı k6 baseline script'i kullanıldı. Testler 1 VU ve 3 iteration ile çalıştırıldı.

## Bozulma Testi

`paymentUnreachable` açıkken checkout işlemleri başarısız oldu.

| Metrik | Sonuç |
|---|---:|
| Checkout başarılı | 0/3 |
| Check başarı oranı | %50 |
| HTTP hata oranı | %50 |
| Checkout p95 | 1.44 sn |
| HTTP p95 | 1.29 sn |

Sepet oluşturma kontrolleri başarılı oldu ancak sipariş tamamlama kontrollerinin tamamı başarısız oldu. k6 threshold kontrolleri de hata oranı ve check başarı oranı nedeniyle geçilemedi.

## Jaeger İncelemesi

Bozulma testi sırasında incelenen trace'te:

- Servis: `frontend`
- İşlem: `oteldemo.CheckoutService/PlaceOrder`
- Süre: 1.5 saniye
- gRPC durum kodu: 13 (INTERNAL)
- Hata: `failed to charge card`
- Hata açıklamasında ödeme servisi için `name resolver error: produced zero addresses` mesajı yer aldı.

Trace ağacında checkout çağrısının hata ile sonuçlandığı görüldü. İlgili ödeme servisi için başarılı bir server span gözlemlenmedi.

Kanıt: `evidence/reliability-degradation-trace.png`

## Toparlanma Testi

Bozulma testi sonrasında `paymentUnreachable` kapatıldı. Aynı k6 script'i tekrar çalıştırıldı.

| Metrik | Sonuç |
|---|---:|
| Checkout başarılı | 3/3 |
| Check başarı oranı | %100 |
| HTTP hata oranı | %0 |
| Checkout p95 | 2.53 sn |
| HTTP p95 | 2.25 sn |

Tüm kontroller başarılı oldu ve HTTP hata oranı sıfıra düştü.

## Değerlendirme

`paymentUnreachable` açıkken checkout işlemleri başarısız oldu. Flag kapatıldıktan sonra checkout işlemleri yeniden başarılı şekilde tamamlandı.

Bu sonuç, uygulanan kontrollü bozulmanın checkout işlemlerini etkilediğini ve mekanizma devre dışı bırakıldığında sistemin fonksiyonel olarak toparlandığını gösteriyor.

Bununla birlikte toparlanma testindeki p95 süreleri bozulma testindekinden daha yüksek ölçüldü. Bu nedenle yalnızca hata oranına bakarak performansın tamamen eski seviyesine döndüğü söylenemez.

Testler düşük yükte ve sınırlı sayıda iteration ile gerçekleştirildi. Sonuçlar üretim ortamındaki davranışı veya toparlanma süresini kesin olarak temsil etmez.

## Kanıtlar

- `evidence/performance/reliability-degradation-results.txt`
- `evidence/performance/reliability-recovery-results.txt`
- `evidence/performance/reliability-degradation-trace.png`
