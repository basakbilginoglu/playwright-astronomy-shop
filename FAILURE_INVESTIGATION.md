# FAILURE_INVESTIGATION.md — Bölüm D Raporu

Bu doküman, OpenTelemetry Astronomy Shop demo ortamında `http://localhost:8080/feature` paneli üzerinden `paymentUnreachable` bayrağı **"On" (Açık)** konuma getirilip `paymentFailure` oranı **%100**'e ayarlanarak gerçekleştirilen kontrollü hata simülasyonunun sonuçlarını içermektedir.

---

### 1. Belirti (Symptom)
* **Kullanıcı veya Otomasyon Ne Gördü?**
  * Playwright otomasyon testi veya arayüz üzerinden sepet onaylanıp "Place Order" butonuna tıklandığında, arayüz herhangi bir hata mesajı veya görsel uyarı vermeksizin askıda kalmıştır. Tarayıcı Geliştirici Araçları (DevTools) Network sekmesinde `/api/checkout` isteği uzun süre "pending" (beklemede) kalmış ve nihayetinde zaman aşımı (`504 Gateway Timeout`) hatasıyla sonuçlanmıştır.

---

### 2. İlk Üç Hipotez (Initial Hypotheses)
1. **Hipotez A:** Frontend ile checkout servisi arasındaki ağ tüneli veya gRPC bağlantısı tamamen kopmuştur.
2. **Hipotez B:** `paymentUnreachable` bayrağının aktif edilmesi ve `paymentFailure` oranının %100 yapılması nedeniyle `checkout` servisinin `payment` servisine gönderdiği gRPC çağrısı erişim/yanıt sorunu yaşamış ve senkron zaman aşımına (`DEADLINE_EXCEEDED`) yol açmıştır.
3. **Hipotez C:** Frontend (Next.js BFF) katmanında gelen upstream gRPC zaman aşımı hatalarını yakalayıp kullanıcıya şık bir hata mesajı iletecek hata yönetimi (Error Boundary / Fallback) mekanizması eksiktir.

---

### 3. Kanıt (Evidence)
* **Network Kanıtı (DevTools):** İstek atıldığında `/api/checkout` uç noktasının yanıt veremeyip `504 Gateway Timeout` üretmesi.
* **Trace Kanıtı (Jaeger UI):** `checkout` servisinden `payment` servisine giden gRPC çağrısının üzerinde kırmızı hata ikonu ve `DEADLINE_EXCEEDED` / `UNAVAILABLE` statüsü (*Trace ID: `0f2f97c1fca1b6c09d9f4568b3acbbfd`*).
* **Log Kanıtı (Docker):** `checkout` mikroservisi konsol loglarında yakalanan zaman aşımı hatası:
  ```text
  [CheckoutService] Error calling PaymentService: grpc: deadline exceeded

  ### Config Kanıtı (Feature Flag UI)

Feature Flag UI üzerinden aşağıdaki konfigürasyonlar doğrulanmıştır:

- URL: `http://localhost:8080/feature`
- `paymentUnreachable` bayrağı: **On**
- `paymentFailure` oranı: **%100**

Bu konfigürasyon, ödeme servisinin erişilemez veya başarısız olduğu senaryonun kontrollü olarak simüle edilmesini sağlar.

### 4. Eleme (Elimination)

- **Hipotez A Elendi:** Diğer mikroservislerin (`cart`, `product-catalog`) sorunsuz çalışması ve isteklerin `checkout` servisine kadar başarıyla ulaşması nedeniyle genel bir altyapı veya ağ bağlantısı kopması ihtimali elenmiştir.
- **Hipotez B ve C Doğrulandı:** Feature flag konfigürasyonunun (`paymentUnreachable` = On, `paymentFailure` = %100) ödeme servisiyle iletişimi etkilediği gözlemlenmiştir. Log ve trace verileri, frontend katmanının bu hata veya zaman aşımı durumunu kullanıcıya yeterli geri bildirimle yansıtamadığını desteklemektedir.

### 5. Root Cause / Sonuç (Root Cause)

**Kesinleşen Sonuç:**

Sorun iki katmanlı olarak değerlendirilmiştir:

1. **Konfigürasyon Nedeni:** `paymentUnreachable` bayrağının açılması ve `paymentFailure` oranının %100 olarak ayarlanması, ödeme servisinin erişilebilirliğini veya başarılı işlem gerçekleştirmesini kontrollü olarak engellemiştir.
2. **Uygulama / UX Nedeni:** Frontend katmanının gRPC hata ve zaman aşımı durumlarını kullanıcıya anlaşılır biçimde yansıtamaması, arayüzün donmuş gibi görünmesine yol açmıştır.

### 6. QA Kararı (QA Decision)

**Karar:** `Environment Issue (Controlled Simulation) + UX Error Handling Defect`

**Neden:**

Arka plandaki servis hatası, QA tarafından sistemin hata yönetimi ve gözlemlenebilirlik davranışını incelemek amacıyla kontrollü olarak tetiklenmiştir (`Controlled Simulation`).

Ancak frontend katmanının bu hata koşullarında kullanıcıya yeterli geri bildirim sağlamaması ve arayüzün askıda kalmış gibi görünmesi, ayrıca değerlendirilmesi gereken bir kullanıcı deneyimi (`UX Defect`) problemidir.