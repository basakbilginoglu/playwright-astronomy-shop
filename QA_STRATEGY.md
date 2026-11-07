# QA Strategy & Risk Analysis (Section A)

## A1 - İş Akışının Analizi ve Başarı Kriterleri

### 1. İş Akışı Tanımı (Checkout / Order Flow)
Astronomy Shop e-ticaret platformu üzerindeki kritik uçtan uca sipariş ve ödeme akışı üç ana aşamada gerçekleşmektedir:

1. **Ürün Keşfi ve Sepete Ekleme (`Product` & `Cart`):** Kullanıcı web kataloğundan istediği ürünü ve miktarını (`quantity`) seçerek sepete ekler. Sepet (`Cart`) sayfasında eklenen ürünlerin birim fiyatı, miktarı ve sepet ara toplamı dinamik olarak doğrulanabilir şekilde listelenir.
2. **Kargo ve Ödeme Bilgilerinin Girişi (`Shipping` & `Payment Details`):** Şeffaf bir kullanıcı deneyimi sağlamak adına tahmini kargo ücreti ve genel toplam tutar kullanıcıya sunulur. Kullanıcı kargo adres bilgilerini ve ödeme (kredi kartı vb.) detaylarını eksiksiz girer.
3. **Sipariş Tamamlama ve Sonuç (`Checkout` & `Order Result`):** "Place Order" (Sipariş Ver) butonuna basılmasıyla birlikte sipariş oluşturma ve ödeme servisleri (`CheckoutService`, `PaymentService`, `ShippingService`) tetiklenir. İşlem başarılı tamamlandığında kullanıcıya benzersiz bir Sipariş Numarası (`Order ID`), kargo detayları, satın alınan ürün özeti ve e-posta onay mesajı bilgisi sunulur.

### 2. Akışın "Başarılı" Sayılması İçin Kabul Kriterleri (Kanıtlar)
Checkout akışının başarıyla tamamlandığını kabul edebilmek için sistem genelinde aşağıdaki 4 ana teknik kanıtın sağlanması gerekmektedir:

* **HTTP / API Seviyesinde Başarı:** `CheckoutService` ve bağımlı mikroservislerden (`Payment`, `Shipping`, `Cart`) `HTTP 200 OK` veya `HTTP 201 Created` statü kodunun dönmesi ve API yanıtı (`payload`) içerisinde benzersiz bir `Order ID` bilgisinin üretilmesi.
* **Bildirim Servisi Kanıtı:** Kullanıcının sistemde tanımlı e-posta adresine sipariş onay mesajının (`Order Confirmation Email`) başarıyla tetiklenip iletilmiş olması.
* **Kullanıcı Arayüzü (UI) Kanıtı:** Checkout ekranının başarıyla kapanarak sipariş özet ekranının görünmesi; ekran üzerinde `Order ID`, kargo adresi ve sipariş edilen ürünlerin miktar/fiyat doğruluğunun teyit edilmesi.
* **Finansal / Ödeme Kanıtı:** Ödeme servisinin (`PaymentService`) işlemi onaylaması ve kullanıcının hesabından/kartından tam ve beklenen tutarın (`Ürünler Toplamı + Kargo`) düşmüş olması.

---

## A2 - Kalite ve Sistem Risk Analizi (5+ Risk)

Astronomy Shop checkout akışında tespit edilen kritik kalite riskleri, iş/kullanıcı etkileri, teknik nedenleri, uygun test seviyeleri ve gerekli kanıtlarıyla aşağıda matris halinde sunulmuştur:

| Risk ID | Risk Tanımı | Kullanıcı / İş Etkisi | Muhtemel Neden (Technical Cause) | Test Seviyesi | Beklenen Kanıt (Evidence) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | Ödeme yapılmasına rağmen siparişin oluşmaması. | **Yüksek (Kritik):** Müşteri mağduriyeti, itibar kaybı ve finansal karmaşa yaşanır. | Ödeme servisi ile Sipariş (`Order`) servisinin asenkron iletişiminde mesaj kaybı veya timeout yaşanması. | API + Telemetry (Trace) | Banka/Payment loglarında ödeme başarılı ancak Order DB/Service tarafında kaydın ve `Order ID`'nin oluşmaması. |
| **R-02** | Checkout başarılı görünürken ödeme servisinin hata üretmesi. | **Yüksek (Kritik):** Ürün ücretsiz teslim edilmiş olur; şirket doğrudan finansal zarara uğrar. | Frontend/Checkout servisinin ödeme yanıtını beklemeden veya hatalı HTTP yanıt kodunu ele almadan başarı ekranı sunması. | API + Contract Testing | UI üzerinde "Sipariş Başarılı" görünürken `PaymentService` trace/log kayıtlarında `500 Internal Server Error` veya `Payment Failed` kaydı. |
| **R-03** | Yanlış ürün veya miktar (`quantity`) ile siparişin tamamlanması. | **Orta-Yüksek:** Müşteri memnuniyetsizliği, yanlış tutar tahsilatı ve iade/lojistik maliyetleri. | Sepet servisinden Checkout servisine aktarılan payload verisinin bozulması veya race condition oluşması. | API + UI | UI sipariş özetinde seçilenden farklı adet/ürün görünmesi ve API request/response payload uyumsuzluğu. |
| **R-04** | Shipping (kargo) bilgisinin oluşmaması veya eksik/yanlış kalması. | **Orta-Yüksek:** Ürünün teslim edilememesi, kargo gecikmeleri ve yanlış adrese gönderim. | Adres doğrulama/kargo servisindeki mapping hataları veya kullanıcının girdiği verilerin backend'e eksik aktarılması. | API + UI | Sipariş onay ekranında ve kargo servisi loglarında kargo adres alanlarının `null`/boş veya hatalı görünmesi. |
| **R-05** | Servis gecikmesinin (`latency`) kullanıcıya belirsiz/yanlış sonuç göstermesi. | **Orta:** Kullanıcının mükerrer sipariş vermesi (`double charge`) veya işlemi yarıda bırakarak müşteri kaybetmesi. | Backend mikroservislerdeki (örn. Quote/Currency) yüksek latency, yetersiz timeout yönetimi veya eksik UI loading durumu. | API + Observability (Metrics) | Grafana/Jaeger üzerinde yüksek latency ($>3000\text{ ms}$) ve kullanıcının UI'da hata/loading belirsizliği yaşaması. |
| **R-06** | Miktar arttırıldığında sepet/toplam fiyatın güncellenmemesi. | **Orta:** Yanlış faturalandırma, şirket veya müşteri tarafında mali kayıplar. | Cart UI state yönetimi ile backend fiyat hesaplama servisinin senkronize olmaması. | UI + API | Sepette ürün adedi artırılmasına rağmen UI ve API response üzerindeki `total_amount` değerinin sabit kalması. |

---

## A3 - Test Seviyesi ve Strateji Kararı

Tüm kontrolleri ve test senaryolarını yalnızca UI katmanında otomatize etmek; testlerin yavaş çalışmasına (*slow feedback cycle*), kırılgan olmasına (*flaky test riski*) ve bakım maliyetlerinin aşırı yükselmesine neden olur. Bu nedenle piramit modeline uygun bir test seviyelendirme stratejisi benimsenmiştir:

1. **API ve Servis Seviyesi (Ağırlıklı Katman):** İş mantığı (*business logic*), fiyat ve vergi hesaplamaları, ödeme entegrasyonu ve kargo veri doğrulamaları öncelikle API ve mikroservis seviyesindeki otomasyon testleriyle doğrulanmalıdır. Bu katman, hataların geliştirme sürecinde en hızlı, stabil ve düşük maliyetle tespit edilmesini sağlar.
2. **UI Seviyesi (Kritik Kullanıcı Yolculuğu):** UI otomasyon testleri yalnızca kritik uçtan uca kullanıcı yolculuğunu (*Critical User Journey*) ve arayüz bileşenlerinin görsel/işlevsel doğruluğunu teyit etmek için sınırlı sayıda tutulmalıdır (Örn: En az 1 Başarılı Checkout, 1 Negatif Akış).
3. **Observability Katmanı (Derinlemesine Doğrulama):** Test sonuçlarının ötesine geçerek olası bir hatanın kök nedenini hızlıca saptamak için Trace (Jaeger), Log ve Metric (Grafana) sinyalleri test sürecine dahil edilmeli; backend servis davranışı sistem izleri üzerinden doğrulanmalıdır.