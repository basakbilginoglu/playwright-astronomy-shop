### Jaeger – Checkout ve Payment Trace İncelemesi

Jaeger üzerinden CheckoutService/PlaceOrder işlemi incelendi. Checkout span süresi 439 ms olarak gözlemlendi.

Checkout servisinin Payment servisine yaptığı gRPC çağrısı 58.9 ms, Payment servisindeki Charge işlemi ise 2.1 ms sürdü. gRPC status code değeri 0 olduğu için servis çağrısı başarılı tamamlandı.

Checkout span'inde `prepared`, `charged` ve `shipped` event'leri gözlemlendi. Ayrıca `paymentUnreachable` feature flag değerinin false olduğu görüldü.

Checkout sipariş tutarı 29.93 USD, Payment span tutarı ise 29.94 USD olarak kaydedilmiş. Bu 0.01 USD farkı olası bir tutar tutarsızlığı olarak not edildi. Nedeni henüz doğrulanmadı.