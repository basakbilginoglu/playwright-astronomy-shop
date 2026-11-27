
import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

export const options = {
  vus: 1,
  iterations: 1,

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<5000'],
    checks: ['rate>0.99'],
    checkout_duration: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080';

const checkoutDuration = new Trend('checkout_duration');

export default function () {
  const userId = `k6-smoke-${__VU}-${__ITER}`;

  const cartPayload = JSON.stringify({
    userId,
    item: {
      productId: '6E92ZMYYFZ',
      quantity: 1,
    },
  });

  const cartResponse = http.post(
    `${BASE_URL}/api/cart?currencyCode=USD`,
    cartPayload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(cartResponse, {
    'Sepet başarıyla oluşturuldu': (res) => res.status === 200,
  });

  const checkoutPayload = JSON.stringify({
    userId,
    userCurrency: 'USD',
    address: {
      streetAddress: 'Yenişehir Bulvarı No:100',
      city: 'Ankara',
      state: 'Ankara',
      country: 'Turkey',
      zipCode: '06100',
    },
    email: `k6-${userId}@example.com`,
    creditCard: {
      creditCardNumber: '4432-8015-6152-0454',
      creditCardCvv: 672,
      creditCardExpirationYear: 2030,
      creditCardExpirationMonth: 1,
    },
  });

  const checkoutResponse = http.post(
    `${BASE_URL}/api/checkout?currencyCode=USD`,
    checkoutPayload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  checkoutDuration.add(checkoutResponse.timings.duration);

  check(checkoutResponse, {
    'Sipariş başarıyla tamamlandı': (res) => res.status === 200,
  });
}
