# Kaynak Kullanımı Gözlemi

Staged load testi sırasında Docker container kaynak kullanımları gözlemlendi.

Test sırasında alınan kaynak kullanım görüntüsünde:

| Servis | CPU | Bellek kullanımı |
|---|---:|---:|
| checkout | %18,77 | %67,42 |
| cart | %0,09 | %79,38 |
| frontend-proxy | %0,36 | %79,57 |
| frontend | %0,23 | %73,51 |
| email | %0,03 | %85,22 |
| fraud-detection | %0,27 | %80,17 |
| flagd-ui | %0,02 | %93,78 |
| ad | %0,11 | %93,99 |
| product-catalog | %1,11 | %21,27 |

Bellek değerleri container limitlerine göre yüzdelerdir.

Özellikle `ad` ve `flagd-ui` servislerinin bellek kullanımı kendi limitlerine yakındı. `checkout` servisinde ise diğer bazı servislere göre daha yüksek CPU kullanımı gözlemlendi.

Bu değerler test sırasında alınan tek bir görüntüyü temsil eder. Test boyunca ölçülmüş kesin maksimum değerler değildir.

Test sonuçlarında 238 HTTP isteğinin tamamı başarılı oldu. Buna rağmen HTTP p95 süresi 5,58 saniyeye yükseldi. Bu nedenle yalnızca hata oranına bakmak yeterli değildir; yanıt süreleri ve container kaynak kullanımı birlikte değerlendirilmelidir.

## Sınırlamalar

- Kaynak kullanımı tek bir gözlem anında kaydedildi.
- Test boyunca sürekli kaynak ölçümü veya kesin maksimum değer kaydı alınmadı.
- Ölçümler yerel Docker ortamında gerçekleştirildi.
- Sonuçlar üretim ortamı kapasitesini veya performansını temsil etmez.