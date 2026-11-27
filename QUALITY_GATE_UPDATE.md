# Quality Gate Update

## Amaç

Performans testlerini CI sürecine ekleyerek önemli performans sorunlarını erken tespit etmek.

## Pull Request Smoke Testi

Pull Request açıldığında kısa süreli k6 smoke testi çalıştırılır.

- Script: `performance/checkout-smoke.js`
- Virtual User: 1
- Iteration: 1
- Kontroller: Sepet oluşturma ve checkout
- Threshold değerleri:
  - HTTP hata oranı %1'in altında olmalı.
  - HTTP p95 süresi 5 saniyenin altında olmalı.
  - Check başarı oranı %99'un üzerinde olmalı.
  - Checkout p95 süresi 5 saniyenin altında olmalı.

Herhangi bir threshold aşılırsa k6 testi başarısız olur ve CI adımı da başarısız sonuçlanır.

## Manuel Performans Testleri

Daha uzun süren performans testleri Pull Request sürecinden ayrı tutulur.

Manuel çalıştırmada kullanılacak testler:

- `performance/checkout-baseline.js`
- `performance/checkout-load.js`
- `performance/checkout-spike.js`

Bu testler GitHub Actions üzerinden manuel olarak başlatılacak. Sonuçlar artifact olarak saklanacak.

## Neden Ayrı Tutuldu?

Smoke testi kısa sürede temel checkout akışını ve belirlenen eşikleri kontrol eder. Staged load ve spike testleri ise daha fazla kaynak kullanır ve daha uzun sürer.

Bu nedenle her Pull Request'te ağır performans testlerini çalıştırmak yerine, kısa smoke testi CI sürecine; kapsamlı testleri ise manuel çalıştırmaya ayırdım.

## Kanıt

- `evidence/performance/checkout-smoke-results.txt`
