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

## C2 — Log İncelemesi

1. **İlgili Log Örneği:**
   * `checkout` mikroservisinden/Next.js uygulamasından alınan başarılı sipariş kayıt ve HTTP yanıtı çıktıları:
     ```json
     {"level":30, "time":1794133325900, "demo.order.id":"3f209ae5-db5e-11f1-85ed-72eafc9581b5", "msg":"Order placed successfully"}
     {"level":30, "time":1794133325901, "http.request.method":"POST", "url.path":"/api/checkout", "http.response.status_code":200, "msg":"API request completed"}
     ```
2. **Servis ve Olay Detayı:** `checkout` konteynerinden gelmektedir ve siparişin işlenerek başarıyla kuyruğa/veritabanına kaydedildiğini onaylar.
3. **Sağladığı Ek Bilgi:** UI ekranında kullanıcıya gösterilen sipariş numarasının (`3f209ae5-...`), backend servisleri tarafından da eksiksiz üretilip işlendiğini teknik olarak doğrular.
4. **Kanıt Durumu:** UI üzerindeki başarı bildiriminin arka plandaki sistem iş kurallarıyla (`HTTP 200 OK`) birebir uyuştuğunu kanıtlar.

---

## C3 — Metric İncelemesi (Grafana)

1. **Seçilen Metrik ve Grafana Görünümü:**
   * **Metrik Adı:** `http_server_duration_milliseconds` (veya `rpc_server_duration_milliseconds` / gRPC istek süreleri)
   * **Grafana Paneli:** OpenTelemetry Demo ile birlikte gelen standart **"Service Performance"** veya **"RED Method"** (Rate, Errors, Duration) panelleri incelenmiştir.

2. **Metrik Ne Anlama Geliyor ve QA Sürecinde Neden Kritik?**
   * Bu metrik, `checkout` servisinin ve alt mikroservislerin gelen isteklere yanıt vermesinin **milisaniye bazında ne kadar sürdüğünü** (latency dağılımını) gösterir. 
   * QA açısından değeri şudur: Bir Playwright testi arayüzde yeşil yanıp "başarılı" dese bile, arka planda bir servis yavaş çalışıyor (örneğin 500ms yerine 4000ms yanıt veriyorsa) bu durum ilerleyen aşamada **timeout (zaman aşımı)** hatalarına veya kullanıcı kaybına yol açar. Metrikler, bu gizli performans düşüşlerini henüz kullanıcıya yansımadan yakalamamızı sağlar.

3. **Spike (Ani Yük/Tepe Değer) ve Anomali Analizi:**
   * Grafana panellerinde test sırasında görülen ani gecikme artışları (spike'lar), genellikle Docker konteynerlerinin anlık CPU/RAM kaynak kısıtlamalarından veya Go dilinin Garbage Collection (GC) süreçlerinden kaynaklanır. 
   * Bu yüzden tek bir yüksek latency değeri doğrudan "Yazılım Hatası (Bug)" olarak etiketlenmez; metrik sürekliliğine (trend line) bakılarak sorunun anlık bir kaynak darboğazından mı yoksa kalıcı bir kod verimsizliğinden mi kaynaklandığı doğrulanır.

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