# BÖLÜM C: Observability Investigation (Trace, Log & Metric Analizi)

Bu dokümanda, OpenTelemetry Astronomy Shop demo ortamında gerçekleştirilen uçtan uca checkout (`UI-01`) senaryosunun dağıtık sistemler üzerindeki izleri (traces), logları ve metrikleri detaylıca analiz edilmiş ve somut kanıtlarla (evidence) desteklenmiştir.

---

## C1 — Distributed Tracing İncelemesi (Jaeger UI)

Playwright testi sırasında tetiklenen `POST /api/checkout` isteği Jaeger UI (`http://localhost:8080/jaeger/ui/`) üzerinden incelenmiştir.

1. **İstek Hangi Servislerden Geçti?**
   * İstek sırasıyla `frontend-web` (Nginx) -> `frontend-proxy` -> `frontend` (Next.js BFF) -> `checkout` (CheckoutService) -> `cart` (CartService) -> `flagd` (Feature Flag) ve `valkey-cart` (Redis) servislerinden geçmiştir.
2. **Hangi Servis Diğerini Çağırdı? (Servisler Arası İletişim)**
   * `frontend` katmanı gRPC protokolü üzerinden `checkout` servisini (`PlaceOrder`) tetikler. `checkout` servisi ise sepet doğrulaması için `cart` servisini, bayrak kontrolü için `flagd` servisini alt çağrılar (child spans) olarak tetikler.
3. **En Uzun Süren Adım Hangisiydi?**
   * Jaeger zaman çizelgesinde (timeline) orkestrasyonun ve veritabanı etkileşiminin yoğun olduğu `checkout` ile alt servislerin (`valkey-cart` / Redis) koşturulduğu adımlar toplam sürenin en büyük kısmını oluşturmuştur.
4. **Bir Servis Hata Verse Upstream / Downstream Nasıl Etkilenir?**
   * Alt seviyedeki `cart` veya `payment` servislerinden birinin hata dönmesi durumunda upstream'deki `checkout` servisi zaman aşımına uğrar ve bu durum `frontend` katmanına yansıyarak kullanıcı arayüzünde hata gösterilmesine neden olur.
5. **UI Sonucu ile Trace Uyumlu mu?**
   * **Evet, uyumludur.** Playwright testinde UI'da "Sipariş Başarılı" görülmüş, Jaeger'daki tüm span'ler HTTP 200 ve gRPC OK statüsüyle hatasız tamamlanmıştır.

---

## C2 — Log İncelemesi

1. **İlgili Log Örneği:**

   `checkout` mikroservisinden alınan başarılı sipariş ve HTTP yanıtı kayıtları:

   ```json
   {"level":30, "time":1794133325900, "demo.order.id":"3f209ae5-db5e-11f1-85ed-72eafc9581b5", "msg":"Order placed successfully"}
   {"level":30, "time":1794133325901, "http.request.method":"POST", "url.path":"/api/checkout", "http.response.status_code":200, "msg":"API request completed"}

2. **Servis ve Olay Detayı:**

   Kayıtlar, checkout işlemi sırasında siparişin başarıyla oluşturulduğunu ve `/api/checkout` endpoint'ine yapılan POST isteğinin HTTP 200 yanıtıyla tamamlandığını göstermektedir.

3. **Sağladığı Ek Bilgi:**

   UI testi yalnızca kullanıcıya gösterilen sipariş onay mesajını doğrularken, backend logu siparişe ait benzersiz `order-id` bilgisini sağlar:

   `3f209ae5-db5e-11f1-85ed-72eafc9581b5`

   Bu bilgi, siparişin backend tarafındaki kaydının izlenmesine yardımcı olur.

4. **Kanıt Durumu:**

   Loglar, sipariş oluşturma işleminin başarılı olarak raporlandığını ve HTTP isteğinin 200 OK yanıtıyla tamamlandığını kanıtlamaktadır. Ancak bu kayıtlar tek başına siparişin kalıcı veritabanına yazıldığını veya sonraki tüm iş adımlarının tamamlandığını kanıtlamaz.

---

## C3 — Metric İncelemesi (Grafana)

1. **Seçilen Metrik:** `http_server_duration_milliseconds` (İstek Latency Değeri) ve Hata Oranları.
2. **QA Açısından Katkısı:** Anlık yavaşlamaları ve mikroservis darboğazlarını kullanıcı şikâyeti oluşmadan önce tespit etmeyi sağlar.
3. **Spike / Yüksek Değer Analizi:** Tek bir yüksek latency değeri anlık Docker CPU/RAM kısıtından veya GC sürecinden kaynaklanabileceği için hemen "Bug" olarak etiketlenmez; metrik sürekliliği (trend) incelenir.

---

## C4 — Observability Evidence (Kanıtlar)

### 1. Distributed Trace Kanıtı
* **Trace ID:** `015e512ba706ea76f2cb4b99d76bcb79`
* **Görsel Kanıt:**

![Jaeger Checkout Trace Tree](evidence/jaeger-checkout-trace.png)

> *Açıklama: Yukarıdaki ekran görüntüsünde UI-01 testinin tetiklediği parent-child span ağacı, HTTP status 200/OK değerleri ve gRPC çağrıları görünmektedir.*

---

### 2. Backend Log Kanıtı
* **Konteyner:** `opentelemetry-demo-checkout`
* **Log Çıktısı:**
![Log Çıktısı](evidence/backend-log-succesful.png)