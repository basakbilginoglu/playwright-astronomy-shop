import { test, expect } from '@playwright/test';

import { HomePage } from '../pages/HomePage';
import { CartPage } from '../pages/CartPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';

import {
  createShippingAddress,
  TEST_DATA,
  type ShippingAddress,
} from '../data/testData';

test.describe('Astronomy Shop - Checkout', () => {
  let homePage: HomePage;
  let cartPage: CartPage;
  let orderConfirmationPage: OrderConfirmationPage;
  let shippingAddress: ShippingAddress;

  const { product, expectedTotal } = TEST_DATA;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    cartPage = new CartPage(page);
    orderConfirmationPage = new OrderConfirmationPage(page);
    shippingAddress = createShippingAddress();

    // Arrange: ürünü sepete ekle
    await homePage.gotoProduct(product.url);
    await homePage.verifyProductDetails(product.name, product.price);
    await homePage.addProductToCart(product.quantity);

    // Arrange: checkout formunu hazırla
    await cartPage.goto();
    await cartPage.verifyCartItem(product.price);
    await cartPage.fillShippingAddress(shippingAddress);
  });

  test('UI-01: successful checkout with valid shipping info', async ({page}) => {
  
    await cartPage.submitOrder();

    await orderConfirmationPage.verifyOrderSuccess();
    await orderConfirmationPage.verifyShippingAddress(
      shippingAddress.streetAddress,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.zipCode,
      shippingAddress.country
    );
    await orderConfirmationPage.verifyOrderItem(product.name, product.quantity);
    await orderConfirmationPage.verifyOrderTotal(expectedTotal);
  });

  test('UI-02: checkout should be prevented when ZIP code is missing', async ({ page }) => {
    let checkoutRequested = false;
    page.on('request', (r) => {
      if (r.url().includes('/api/checkout')) checkoutRequested = true;
    });

    await cartPage.zipInput.fill('');
    await cartPage.clickPlaceOrder();

    expect(await cartPage.isZipMissingByBrowserValidation()).toBe(true);
    await expect(orderConfirmationPage.confirmationTitle).not.toBeVisible();
    expect(checkoutRequested).toBe(false);
  });
  for (const status of [400, 500, 503]) {
    test(`UI-03: order should not complete when checkout API returns ${status}`, async ({ page }) => {
      // Arrange: checkout cevabını mock'la
      let checkoutCalled = false;
      await page.route('**/api/checkout**', async (route) => {
        checkoutCalled = true;
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Mocked checkout error' }),
        });
      });

      // Act
      await cartPage.clickPlaceOrder();

      // Assert: istek gerçekten gitti ve mock'a takıldı
      await expect.poll(() => checkoutCalled, { timeout: 10_000 }).toBe(true);

      // Assert: kullanıcı sepet sayfasında kaldı, sipariş tamamlanmadı
      await expect(page).toHaveURL(/\/cart/);
      await expect(orderConfirmationPage.confirmationTitle).not.toBeVisible();
      await expect(cartPage.placeOrderButton).toBeVisible();
    });
  }
});