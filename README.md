

# Astronomy Shop – QA Engineering Challenge

Bu proje, OpenTelemetry Astronomy Shop demo uygulaması üzerinde gerçekleştirilen bir QA Engineering Challenge çalışmasıdır.

Projenin amacı, Playwright ve TypeScript kullanarak checkout (sipariş tamamlama) akışını test etmek, uygulama davranışlarını incelemek ve gözlemlenen hataları teknik kanıtlarla değerlendirmektir.

## Kullanılan Teknolojiler

- Playwright
- TypeScript
- Node.js
- OpenTelemetry Astronomy Shop

## Proje Yapısı

```text
playwright-astronomy-shop/
├── data/
├── pages/
├── tests/
├── .github/
├── AI_DECISION_LOG.md
├── ENVIRONMENT_CHECK.md
├── FAILURE_INVESTIGATION.md
├── OBSERVABILITY_NOTES.md
├── QA_STRATEGY.md
├── QUALITY_GATE.md
├── playwright.config.ts
├── package.json
└── README.md
```

## Test Kapsamı

Checkout testleri aşağıdaki senaryoları kapsar:

- Geçerli teslimat bilgileriyle başarılı sipariş tamamlama.
- ZIP Code alanı boş bırakıldığında tarayıcı doğrulamasının checkout işlemini engellemesi.
- Checkout API'sinin HTTP 400, 500 ve 503 yanıtları verdiği durumlarda arayüz davranışı.

API hata yanıtları Playwright `route` mekanizmasıyla simüle edilmektedir. Bu testler arayüzün hata yanıtlarına verdiği davranışı doğrular; gerçek backend veya servis sağlığını kanıtlamaz.

## Kurulum

Proje bağımlılıklarını yükleyin:

```bash
npm ci
```

OpenTelemetry Astronomy Shop uygulamasını başlatın ve aşağıdaki adresten erişilebilir olduğundan emin olun:

```text
http://localhost:8080
```

Farklı bir uygulama adresi kullanılması durumunda `BASE_URL` ortam değişkeni tanımlanabilir.

## Testleri Çalıştırma

Playwright testlerini çalıştırmak için:

```bash
npx playwright test
```

TypeScript tip kontrolünü çalıştırmak için:

```bash
npm run typecheck
```

## Test Kayıtları

Playwright yapılandırmasında:

- Başarısız testlerde trace kaydı tutulur.
- Başarısız testlerde screenshot alınır.
- Başarısız testlerde video kaydı saklanır.
- CI ortamında başarısız testler bir kez yeniden denenir.
- Yerel çalıştırmalarda otomatik tekrar yapılmaz.

## Proje Dokümantasyonu

- `ENVIRONMENT_CHECK.md` – Test ortamının kurulumu ve doğrulanması.
- `QA_STRATEGY.md` – Ürün riskleri ve test stratejisi.
- `OBSERVABILITY_NOTES.md` – Trace, log ve metric incelemeleri.
- `FAILURE_INVESTIGATION.md` – Kontrollü hata araştırması ve bulgular.
- `QUALITY_GATE.md` – CI kalite kapısı önerisi ve karar gerekçeleri.
- `AI_DECISION_LOG.md` – AI desteğinin kullanıldığı alanlar ve teknik kararlar.

