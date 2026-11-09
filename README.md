# Astronomy Shop – QA Engineering Challenge

Bu proje, [OpenTelemetry Astronomy Shop](https://github.com/open-telemetry/opentelemetry-demo) demo uygulaması üzerinde gerçekleştirilen bir QA Engineering Challenge çalışmasıdır.

Projenin amacı, Playwright ve TypeScript kullanarak checkout (sipariş tamamlama) akışını test etmek, uygulama davranışlarını incelemek ve gözlemlenen sorunları teknik kanıtlarla değerlendirmektir.

Çalışma yalnızca UI otomasyonunu değil; test ortamının hazırlanmasını, servis bağımlılıklarının incelenmesini, observability verilerinin araştırılmasını ve CI kalite kapısı yaklaşımını da kapsar.

## Kullanılan Teknolojiler

- Playwright
- TypeScript
- Node.js
- Docker
- Docker Compose
- GitHub Actions
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
├── pages/
├── tests/
├── AI_DECISION_LOG.md
├── ENVIRONMENT_CHECK.md
├── FAILURE_INVESTIGATION.md
├── OBSERVABILITY_NOTES.md
├── QA_STRATEGY.md
├── QUALITY_GATE.md
├── playwright.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## Test Kapsamı

Checkout akışı için toplam beş test senaryosu bulunmaktadır.

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
- `evidence/`: Ortam kontrolleri ve araştırmalar sırasında alınan ekran görüntüleri.

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
8. Başarısızlık durumunda log ve test kayıtlarının artifact olarak saklanması.

CI ortamında kullanılan Docker yapılandırması `docker/` klasöründe bulunmaktadır.

**Not:** CI yapılandırması ile yerel observability ortamı aynı kapsamda değildir. CI çalıştırması Grafana ve Prometheus incelemesini otomatik olarak doğrulayan tam observability stack'i başlatmaz.

## Observability Investigation

Başarılı checkout ve kontrollü hata senaryoları için dağıtık sistem gözlemlenebilirliği incelenmiştir.

- **Jaeger:** Checkout akışındaki trace ve servisler arası çağrılar incelendi.
- **Backend Logs:** Checkout işleminin başarılı ve başarısız sonuçlarına ilişkin loglar değerlendirildi.
- **Prometheus:** Metrik sorguları ve veri erişilebilirliği kontrol edildi.
- **Grafana:** Prometheus data source bağlantısı ve Explore ekranı incelendi.

Trace ve log incelemelerinde bulgular elde edilmiştir. Prometheus tarafında sorgulanabilir metrik verisi doğrulanamadığı için latency, request rate ve error rate hakkında sayısal sonuç raporlanmamıştır.

İnceleme ayrıntıları ve kanıtlar `OBSERVABILITY_NOTES.md` dosyasında bulunmaktadır.

## Proje Dokümantasyonu

| Dosya | İçerik |
|---|---|
| `ENVIRONMENT_CHECK.md` | Test ortamının kurulumu ve erişilebilirlik kontrolleri |
| `QA_STRATEGY.md` | Checkout iş akışı, başarı kriterleri ve risk analizi |
| `OBSERVABILITY_NOTES.md` | Trace, log ve metric incelemeleri |
| `FAILURE_INVESTIGATION.md` | Kontrollü hata senaryosu ve kök neden araştırması |
| `QUALITY_GATE.md` | CI kalite kapısı tasarımı ve merge kararları |
| `AI_DECISION_LOG.md` | AI desteğinin kullanıldığı alanlar ve yapılan düzenlemeler |

## Evidence

`evidence/` klasöründe ortam kontrolleri ve observability araştırmaları sırasında elde edilen ekran görüntüleri bulunmaktadır.

Bu kanıtlar; uygulama erişilebilirliği, Jaeger incelemesi, Grafana kontrolleri ve hata araştırması gibi dokümantasyon bölümlerini desteklemek amacıyla kullanılmıştır.

## Quality Gate

`QUALITY_GATE.md` dosyasında PR öncesinde uygulanması önerilen kontroller değerlendirilmiştir.

Öne çıkan kontroller:

- TypeScript typecheck
- Servis erişilebilirliği
- Kritik checkout akışı
- API hata yanıtlarının kontrolü
- Observability sanity check

Bu doküman mevcut test kapsamı ve gözlemlenen riskler üzerinden hazırlanmış bir kalite kapısı tasarımıdır. Henüz otomasyona eklenmemiş kontroller uygulanmış gibi değerlendirilmemelidir.

## Proje Hedefi

Bu çalışmanın temel hedefi, yalnızca test senaryoları yazmak değil; bir checkout akışını QA perspektifinden değerlendirmek, hata araştırmasını teknik kanıtlarla desteklemek ve test sonuçlarını sürdürülebilir bir kalite süreci içinde ele almaktır.