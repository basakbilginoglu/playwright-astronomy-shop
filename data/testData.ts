import { randomUUID } from 'crypto';

export interface ShippingAddress {
  email: string;
  streetAddress: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
}

const PRODUCT_PRICE = 69.95;
const PRODUCT_QUANTITY = 1;
// Kargo ücretini arayüzde gördüğünüz değerle doğrulayın.
const SHIPPING_COST = 8.99;

export const TEST_DATA = {
  product: {
    name: 'Solar Filter',
    price: PRODUCT_PRICE,
    quantity: PRODUCT_QUANTITY,
    url: '/product/6E92ZMYYFZ',
  },
  shipping: SHIPPING_COST,
  expectedTotal: Number((PRODUCT_PRICE * PRODUCT_QUANTITY + SHIPPING_COST).toFixed(2)),
};

export function createShippingAddress(): ShippingAddress {
  return {
    email: `deneme.qa+${randomUUID()}@example.com`,
    streetAddress: 'Yenişehir Bulvarı No:100',
    zipCode: '06100',
    city: 'Ankara',
    state: 'Ankara',
    country: 'Turkey',
  };
}