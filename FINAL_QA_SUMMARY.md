# T05 – Final QA Summary

## 1. Kapsam

Bu çalışma kapsamında OpenTelemetry Astronomy Shop uygulamasının checkout akışı performans ve servis güvenilirliği açısından test edildi.

Çalışmada k6 ile baseline, staged load, spike ve smoke testleri gerçekleştirildi. Jaeger üzerinden servis trace'leri incelendi, kontrollü ödeme servisi erişim hatası oluşturuldu ve recovery davranışı gözlemlendi. Docker container kaynak kullanımları da test sırasında takip edildi.

Testler yerel Docker ortamında gerçekleştirildi. Amaç, checkout akışının farklı yük koşullarındaki davranışını değerlendirmek, hata durumlarını gözlemlemek ve CI sürecine performans kalite kontrolü eklemekti.

## 2. Performans Test Sonuçları

### Karşılaştırmalı Sonuçlar

| Test | HTTP hata oranı | HTTP p95 | Checkout p95 | Check başarı oranı |
|---|---:|---:|---:|---:|
| Baseline (3 çalıştırma) | %0 | Ayrı raporlanmadı | Ayrı raporlanmadı | %100 |
| Staged Load | %0 | 5,58 sn | 6,04 sn | %100 |
| Spike | %0,63 | 10,89 sn | 12,13 sn | %99,36 |
| Spike Recovery | %0 | 2,83 sn | 3,08 sn | %100 |
| Controlled Degradation | %50 | 1,29 sn | 1,44 sn | %50 |
| Degradation Recovery | %0 | 2,25 sn | 2,53 sn | %100 |

Not: Baseline testinde üç ayrı çalıştırma yapılmıştır. Her çalıştırmada 1 VU ve 3 iteration kullanılmış, toplam 9 checkout isteği ölçülmüştür. Baseline p95 değerleri ortak bir sonuç olarak raporlanmadığı için tabloda ayrıca belirtilmemiştir.

### Baseline

- 1 VU ve 3 iteration ile üç ayrı test çalıştırıldı.
- Toplam 9 checkout isteği ölçüldü.
- Üç çalıştırmada da HTTP hata oranı %0 oldu.
- Ortalama checkout süreleri 232,50 ms, 59,53 ms ve 79,47 ms olarak ölçüldü.

Üç çalıştırma da başarılı tamamlandı. Bununla birlikte ortalama süreler arasında farklılık gözlemlendi.

### Staged Load

- Yük 1 VU'dan 5 VU'ya kademeli olarak artırıldı.
- 238 HTTP isteği ve 119 iteration tamamlandı.
- Check başarı oranı %100, HTTP hata oranı %0 oldu.
- Ortalama HTTP yanıt süresi 1,16 saniye olarak ölçüldü.
- HTTP p95 5,58 saniye, checkout p95 6,04 saniye oldu.
- Ortalama checkout süresi 2,32 saniye olarak ölçüldü.

Bütün sepet ve sipariş kontrolleri başarılı olmasına rağmen yanıt süreleri yükseldi. Bu sonuç, hata oluşmadan da yük altında performans düşüşü yaşanabileceğini gösteriyor.

### Spike ve Recovery

- Spike testinde yük kısa süreliğine 10 VU seviyesine çıkarıldı.
- 158 HTTP isteği ve 79 iteration tamamlandı.
- HTTP hata oranı %0,63, HTTP p95 10,89 saniye oldu.
- Checkout p95 12,13 saniye olarak ölçüldü.
- Bir checkout işlemi başarısız oldu.

Spike sonrasındaki 1 VU recovery testinde bütün kontroller başarılı oldu ve HTTP hata oranı %0 ölçüldü. HTTP p95 2,83 saniye, checkout p95 3,08 saniye olarak ölçüldü.

Sonuçlar, yük azaltıldıktan sonra sistemin daha düşük yanıt süreleriyle çalışmaya devam ettiğini destekliyor. Ancak mevcut ölçümler kesin toparlanma süresini göstermiyor.

## 3. Controlled Degradation ve Recovery

`paymentUnreachable` feature flag'i etkinleştirilerek kontrollü ödeme servisi erişim hatası oluşturuldu. `paymentFailure` flag'i etkinleştirilmedi.

Degradation testinde:

- Check başarı oranı %50 oldu.
- HTTP hata oranı %50 olarak ölçüldü.
- Checkout p95 1,44 saniye, HTTP p95 1,29 saniye oldu.
- Jaeger trace'inde checkout akışındaki gRPC hatası incelendi.

Jaeger üzerinde checkout çağrısının hata durumu ve ödeme servisine erişim sırasında oluşan gRPC hatası gözlemlendi.

Feature flag kapatıldıktan sonraki recovery testinde:

- Bütün kontroller başarılı oldu.
- HTTP hata oranı %0'a döndü.
- Checkout p95 2,53 saniye, HTTP p95 2,25 saniye olarak ölçüldü.

Recovery sonrasında fonksiyonel başarı yeniden sağlandı; ancak p95 süreleri baseline seviyesine dönmedi. Bu nedenle fonksiyonel toparlanma ile performansın tamamen eski seviyesine dönmesi birbirinden ayrı değerlendirildi.

## 4. Observability ve Kaynak Kullanımı

Jaeger üzerinden checkout trace'leri ve servis çağrıları incelendi. k6 test verisindeki kullanıcı ID'si cart servis loglarında da bulundu. Cart loglarında ürünün sepete eklenmesi, sepet bilgisinin görüntülenmesi ve checkout sonrasında sepetin boşaltılması gibi işlemler gözlemlendi.

Ancak loglar trace ID ile doğrudan eşleştirilmedi ve zaman bilgisi kesin olarak doğrulanamadı. Checkout servis loglarında ilgili çalıştırmayla kesin olarak ilişkilendirilebilen bir kayıt bulunamadı.

Docker kaynak kullanımında bazı servislerin bellek kullanımlarının container limitlerine yaklaştığı gözlemlendi. Bu değerler staged load testi sırasında alınan tek bir gözlem anına aittir; test boyunca ölçülmüş kesin maksimum değerler değildir.

Kaynak kullanımı bulguları yerel Docker ortamıyla sınırlıdır ve tek başına servislerin darboğazını kanıtlamaz.

## 5. Threshold ve CI Quality Gate

Baseline testi için aşağıdaki threshold değerleri tanımlandı:

- HTTP hata oranı %1'in altında olmalı.
- HTTP p95 yanıt süresi 5 saniyenin altında olmalı.
- Check başarı oranı %99'un üzerinde olmalı.
- Checkout p95 süresi 5 saniyenin altında olmalı.

Normal baseline testinde threshold'lar geçildi. Threshold mekanizmasını doğrulamak amacıyla HTTP p95 sınırı geçici olarak 1 ms olarak ayarlandı. k6, `http_req_duration` threshold ihlalini bildirdi ve başarısız çıkış koduyla tamamlandı. Test sonrasında sınır tekrar 5000 ms olarak ayarlandı.

Bu değerler iş tarafından belirlenmiş üretim SLA/SLO hedefleri değildir. Yerel test ortamında performans kalite kapısını doğrulamak amacıyla belirlenmiştir.

GitHub Actions workflow'una kısa k6 smoke testi eklendi. Daha kapsamlı baseline, staged load ve spike testleri manuel çalıştırma seçenekleriyle ayrıldı.

Pull Request üzerindeki `Playwright and Performance Tests` workflow'u başarılı tamamlandı. Değişiklikler `main` branch'ine merge edildi.

## 6. Açık Riskler ve Sınırlamalar

- Testler yerel Docker ortamında yapıldı; üretim kapasitesini temsil etmez.
- Baseline testleri arasında yanıt süresi farklılıkları gözlemlendi.
- Yük üreten k6 süreci ve uygulama aynı makinenin kaynaklarını kullandığından ölçümler bu durumdan etkilenebilir.
- Kaynak kullanımı için sürekli ölçüm ve kesin maksimum değer kaydı alınmadı.
- Jaeger trace ve cart logları arasında doğrudan trace ID korelasyonu kurulamadı.
- Recovery testinde fonksiyonel başarı sağlandı ancak p95 süreleri baseline seviyesine dönmedi.
- Tanımlanan threshold değerleri üretim SLA/SLO hedefleri değil, yerel test kalite kapılarıdır.

## 7. Öneriler

1. Checkout ve payment servisleri için üretim gereksinimlerine dayalı p95/p99 ve hata oranı hedefleri belirlenmeli.
2. Trace ID ve kullanıcı/test kimliği korelasyonu loglar boyunca tutarlı biçimde sağlanmalı.
3. Yük testleri sırasında CPU ve bellek kullanımı sürekli kaydedilmeli; container limitleri gözden geçirilmeli.

## Genel Değerlendirme

Checkout akışı düşük yükte ve staged load testinde başarılı çalıştı. Ancak staged load sırasında yanıt süreleri yükseldi. Spike testinde kısa süreli ani yük artışı altında sınırlı sayıda hata gözlemlendi. Yük azaltıldıktan sonraki recovery testinde fonksiyonel başarı yeniden sağlandı.

Kontrollü ödeme servisi erişim hatası checkout akışını etkiledi. Feature flag kapatıldıktan sonra checkout işlemleri yeniden başarılı oldu; ancak yanıt süreleri baseline seviyesine tamamen dönmedi.

Bu çalışma, yerel test ortamında performans ve servis güvenilirliği davranışlarını incelemek için ölçülebilir bulgular ortaya koydu. Ayrıca gözlemlenebilirlik, kaynak kullanımı ve test korelasyonu açısından takip edilmesi gereken açık riskleri belirledi.