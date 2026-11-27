# Astronomy Shop – QA Engineering

Bu proje, [OpenTelemetry Astronomy Shop](https://github.com/open-telemetry/opentelemetry-demo) demo uygulaması üzerinde gerçekleştirilen bir QA Engineering Challenge çalışmasıdır.

Projenin amacı, Playwright ve TypeScript kullanarak checkout (sipariş tamamlama) akışını test etmek, uygulama davranışlarını incelemek ve gözlemlenen sorunları teknik kanıtlarla değerlendirmektir.

Çalışma yalnızca UI otomasyonunu değil; test ortamının hazırlanmasını, servis bağımlılıklarının incelenmesini, k6 ile performans testlerini, kontrollü servis kesintisi ve recovery senaryolarını, observability verilerinin araştırılmasını ve CI kalite kapısı yaklaşımını da kapsar.

## Kullanılan Teknolojiler

- Playwright
- TypeScript
- Node.js
- Docker
- Docker Compose
- GitHub Actions
- k6
- OpenTelemetry
- Jaeger
- Prometheus
- Grafana

## Proje Yapısı

```text
playwright-astronomy-shop/
├── .github/
│   └── workflows/
├── data/
├── docker/
├── evidence/
│   └── performance/
├── pages/
├── performance/
│   ├── checkout-baseline.js
│   ├── checkout-load.js
│   ├── checkout-smoke.js
│   └── checkout-spike.js
├── tests/
├── AI_DECISION_LOG.md
├── ENVIRONMENT_CHECK.md
├── FAILURE_INVESTIGATION.md
├── FINAL_QA_SUMMARY.md
├── OBSERVABILITY_NOTES.md
├── PERFORMANCE_RESULTS.md
├── PERFORMANCE_STRATEGY.md
├── QA_STRATEGY.md
├── QUALITY_GATE.md
├── QUALITY_GATE_UPDATE.md
├── RELIABILITY_INVESTIGATION.md
├── RESOURCE_OBSERVATION.md
├── playwright.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Test Kapsamı

Checkout akışı için toplam beş UI test senaryosu bulunmaktadır.

| Test ID | Senaryo | Doğrulama |
|---|---|---|
| UI-01 | Successful Checkout | Sipariş onayı, teslimat adresi, ürün, miktar ve toplam tutar |
| UI-02 | Missing ZIP Code | Tarayıcı form doğrulaması ve checkout isteğinin engellenmesi |
| UI-03 (400) | Bad Request | API 400 yanıtında siparişin tamamlanmaması |
| UI-03 (500) | Internal Server Error | API 500 yanıtında siparişin tamamlanmaması |
| UI-03 (503) | Service Unavailable | API 503 yanıtında siparişin tamamlanmaması |

UI-03 senaryolarında Playwright `page.route()` kullanılarak API yanıtları mock edilmektedir. Bu testler gerçek backend servislerinin hata üretmesini değil, frontend'in HTTP hata yanıtlarına verdiği davranışı doğrular.

## Test Mimarisi

Test kodları Page Object Model (POM) yaklaşımıyla düzenlenmiştir.

- `pages/`: Sayfa nesneleri ve kullanıcı etkileşimleri.
- `tests/`: Checkout test senaryoları.
- `data/`: Test verileri.
- `docker/`: CI ortamında kullanılan Docker yapılandırmaları.
- `performance/`: k6 performans test senaryoları.
- `evidence/`: Ortam kontrolleri, performans testleri ve araştırmalar sırasında alınan kanıtlar.

## Ortam Gereksinimleri

- Node.js
- npm
- Docker Desktop
- Docker Compose v2
- OpenTelemetry Astronomy Shop demo ortamı

## Kurulum

Önce test projesini klonlayın:

```bash
git clone https://github.com/basakbilginoglu/playwright-astronomy-shop.git

cd playwright-astronomy-shop
```

Bağımlılıkları yükleyin:

```bash
npm ci
```

Playwright Chromium tarayıcısını yükleyin:

```bash
npx playwright install chromium
```

### OpenTelemetry Astronomy Shop Ortamı

Testlerin çalışabilmesi için OpenTelemetry Astronomy Shop uygulamasının erişilebilir olması gerekir.

Demo ortamını kendi OpenTelemetry Demo repository'nizde, ilgili Compose dosyaları ve `.env.override` yapılandırmasıyla başlatın:

```bash
docker compose \
  --env-file .env.override \
  -f compose.yaml \
  -f compose.full.yaml \
  -f compose.observability.yaml \
  -f compose.extras.yaml \
  up --force-recreate --remove-orphans --detach
```

Uygulamanın aşağıdaki adresten erişilebilir olduğunu kontrol edin:

```text
http://localhost:8080
```

Farklı bir adres kullanılıyorsa `BASE_URL` ortam değişkeni tanımlanabilir. Varsayılan adres `http://localhost:8080` olarak yapılandırılmıştır.

Ortamın kurulumu ve erişilebilirlik kontrollerinin ayrıntıları için `ENVIRONMENT_CHECK.md` dosyasına bakabilirsiniz.

## Testleri Çalıştırma

TypeScript tip kontrolü:

```bash
npm run typecheck
```

Tüm Playwright testleri:

```bash
npm test
```

Tarayıcıyı görünür şekilde çalıştırmak:

```bash
npm run test:headed
```

Playwright UI Mode:

```bash
npm run test:ui
```

Debug modu:

```bash
npm run test:debug
```

## Performance Testing

Performans testleri k6 kullanılarak gerçekleştirilir. Testleri çalıştırmadan önce Docker Desktop'ın çalıştığından ve Astronomy Shop uygulamasının erişilebilir olduğundan emin olun.

Komutları test projesinin ana klasöründe çalıştırın.

**Baseline testi:**

```bash
docker run --rm -i \
  -v "$PWD:/scripts" \
  -w /scripts \
  grafana/k6 run performance/checkout-baseline.js
```

**Staged load testi:**

```bash
docker run --rm -i \
  -v "$PWD:/scripts" \
  -w /scripts \
  grafana/k6 run performance/checkout-load.js
```

**Spike testi:**

```bash
docker run --rm -i \
  -v "$PWD:/scripts" \
  -w /scripts \
  grafana/k6 run performance/checkout-spike.js
```

**Smoke testi:**

```bash
docker run --rm -i \
  -v "$PWD:/scripts" \
  -w /scripts \
  grafana/k6 run performance/checkout-smoke.js
```

k6 testleri varsayılan olarak `http://host.docker.internal:8080` adresini kullanır. Farklı bir hedef adres gerektiğinde ilgili script'in `BASE_URL` yapılandırması kullanılmalıdır.

Test sonuçları `PERFORMANCE_RESULTS.md` dosyasında, çalıştırma kanıtları ise `evidence/performance/` klasöründe bulunmaktadır.

## Test Kayıtları

Playwright yapılandırmasında:

- Başarısız testlerde trace kaydı tutulur.
- Başarısız testlerde screenshot alınır.
- Başarısız testlerde video kaydı saklanır.
- CI ortamında başarısız testler bir kez yeniden denenir.
- Yerel çalıştırmalarda otomatik tekrar yapılmaz.

Bu kayıtlar hata araştırması sırasında testin hangi aşamada başarısız olduğunu anlamaya yardımcı olur.

## CI / GitHub Actions

GitHub Actions iş akışında aşağıdaki adımlar kullanılır:

1. Node.js ortamının hazırlanması.
2. npm bağımlılıklarının yüklenmesi.
3. TypeScript typecheck kontrolü.
4. Playwright Chromium kurulumu.
5. Docker üzerinden OpenTelemetry Demo ortamının başlatılması.
6. Uygulama erişilebilirliğinin kontrol edilmesi.
7. Playwright testlerinin çalıştırılması.
8. Pull Request ve push işlemlerinde k6 smoke testinin çalıştırılması.
9. Manuel tetiklemeyle baseline, staged load ve spike testlerinin çalıştırılması.
10. Test sonuçlarının GitHub Actions artifact'ları olarak saklanması.

CI ortamında kullanılan Docker yapılandırması `docker/` klasöründe bulunmaktadır.

**Not:** CI yapılandırması ile yerel observability ortamı aynı kapsamda değildir. CI çalıştırması Grafana ve Prometheus incelemesini otomatik olarak doğrulayan tam observability stack'ini başlatmaz.

PR smoke testi kısa süreli ve düşük maliyetli bir kontrol olarak tasarlanmıştır. Daha uzun performans testleri manuel olarak tetiklenir. Bu ayrımın gerekçeleri `QUALITY_GATE_UPDATE.md` dosyasında açıklanmıştır.

## Observability Investigation

Başarılı checkout ve kontrollü hata senaryoları için dağıtık sistem gözlemlenebilirliği incelenmiştir.

- **Jaeger:** Checkout akışındaki trace ve servisler arası çağrılar incelendi.
- **Backend Logs:** Checkout işlemiyle ilişkili servis logları değerlendirildi.
- **Prometheus:** Metrik sorguları ve veri erişilebilirliği kontrol edildi.
- **Grafana:** Prometheus data source bağlantısı ve Explore ekranı incelendi.

İlk observability incelemesinde Prometheus tarafında sorgulanabilir metrik verisi doğrulanamadığı için latency, request rate ve error rate hakkında sayısal sonuç raporlanmamıştır.

Performans çalışmasında ise k6 üzerinden HTTP yanıt süreleri, hata oranları, checkout süresi ve p95 değerleri ayrıca ölçülmüştür. Jaeger trace ve servis logları ile k6 test verileri arasında ilişki kurulmaya çalışılmıştır. Ancak tüm kayıtlar trace ID ve zaman bilgisi üzerinden kesin olarak eşleştirilememiştir.

İnceleme ayrıntıları ve kanıtlar `OBSERVABILITY_NOTES.md`, `PERFORMANCE_RESULTS.md` ve `evidence/performance/` altında bulunmaktadır.

## Reliability Investigation

Kontrollü servis kesintisi ve recovery senaryosu kapsamında `paymentUnreachable` feature flag'i kullanılmıştır.

Flag etkinleştirildiğinde checkout işlemlerinin hata verdiği gözlemlenmiş; Jaeger üzerinden hata içeren servis çağrıları incelenmiştir. Flag devre dışı bırakıldıktan sonra checkout testleri yeniden çalıştırılmış ve başarılı sonuçlar elde edilmiştir.

Bu çalışma, kontrollü hata koşulunda sistem davranışını ve hata sonrasındaki fonksiyonel toparlanmayı değerlendirmeyi amaçlar. Ölçülen yanıt sürelerinin baseline seviyesine tamamen döndüğü varsayılmamıştır.

Ayrıntılı sonuçlar `RELIABILITY_INVESTIGATION.md` dosyasındadır.

## Performance Results and Limitations

Performans değerlendirmesinde aşağıdaki test türleri kullanılmıştır:

- **Baseline:** Düşük yük altında tekrarlı ölçümler.
- **Staged Load:** Kademeli artan sanal kullanıcı yükü.
- **Spike:** Kısa süreli ani yük artışı ve sonrasındaki toparlanma kontrolü.
- **Threshold:** HTTP hata oranı, p95 yanıt süresi ve test kontrolleri için kalite sınırları.

Tanımlanan threshold değerleri bu yerel test ortamı ve proje kalite kapısı amacıyla belirlenmiştir. Bunlar üretim ortamına ait SLA veya SLO değerleri değildir.

Performans testleri yerel Docker ortamında çalıştırılmıştır. Yük üreten k6 süreci ve uygulama aynı makinenin kaynaklarını kullandığından, sonuçlar üretim kapasitesini doğrudan temsil etmez. Kaynak gözlemleri de belirli test çalıştırmaları sırasında alınan sınırlı ölçümlere dayanır.

Sayısal sonuçlar ve testler arasındaki karşılaştırmalar `PERFORMANCE_RESULTS.md` ve `RESOURCE_OBSERVATION.md` dosyalarında yer almaktadır.

## Proje Dokümantasyonu

| Dosya | İçerik |
|---|---|
| `ENVIRONMENT_CHECK.md` | Test ortamının kurulumu ve erişilebilirlik kontrolleri |
| `QA_STRATEGY.md` | Checkout iş akışı, başarı kriterleri ve risk analizi |
| `OBSERVABILITY_NOTES.md` | Trace, log ve metric incelemeleri |
| `FAILURE_INVESTIGATION.md` | Önceki kontrollü hata senaryosu ve kök neden araştırması |
| `QUALITY_GATE.md` | Önceki CI kalite kapısı tasarımı ve merge kararları |
| `PERFORMANCE_STRATEGY.md` | Performans riskleri ve test yaklaşımı |
| `PERFORMANCE_RESULTS.md` | Baseline, load, spike ve threshold sonuçları |
| `RELIABILITY_INVESTIGATION.md` | Kontrollü degradation ve recovery incelemesi |
| `RESOURCE_OBSERVATION.md` | Docker kaynak kullanımı gözlemleri |
| `QUALITY_GATE_UPDATE.md` | CI performans kalite kapısı güncellemesi |
| `FINAL_QA_SUMMARY.md` | Nihai QA değerlendirmesi |
| `AI_DECISION_LOG.md` | AI desteğinin kullanıldığı alanlar ve yapılan düzenlemeler |

## Evidence

`evidence/` klasöründe ortam kontrolleri ve observability araştırmaları sırasında alınan ekran görüntüleri bulunmaktadır.

`evidence/performance/` klasöründe ise k6 test sonuçları, Jaeger trace görüntüleri ve servis loglarına ilişkin kanıtlar yer almaktadır.

Bu kanıtlar; uygulama erişilebilirliği, performans ölçümleri, servis davranışları ve hata araştırması gibi dokümantasyon bölümlerini desteklemek amacıyla kullanılmıştır.

## Quality Gate

`QUALITY_GATE.md` ve `QUALITY_GATE_UPDATE.md` dosyalarında CI kalite kapısı yaklaşımı ele alınmıştır.

Öne çıkan kontroller:

- TypeScript typecheck
- Servis erişilebilirliği
- Kritik checkout akışı
- API hata yanıtlarının kontrolü
- k6 performans smoke testi
- Baseline, staged load ve spike testlerinin manuel çalıştırılması

Pull Request sürecinde kısa performans smoke testi çalıştırılır. Daha uzun performans senaryoları manuel tetiklenir. Bu yaklaşım, PR geri bildirim süresini ve CI kaynak kullanımını sınırlarken daha kapsamlı performans incelemelerine de olanak sağlar.

## Proje Hedefi

Bu çalışmanın temel hedefi, yalnızca test senaryoları yazmak değil; bir checkout akışını QA perspektifinden değerlendirmek, performans ve güvenilirlik risklerini incelemek, hata araştırmasını teknik kanıtlarla desteklemek ve test sonuçlarını sürdürülebilir bir kalite süreci içinde ele almaktır.

Proje çalışması yaklaşık 10 saatlik bir süre içinde gerçekleştirilmiştir.