import { type Page,type Locator,type Response, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly productDetail: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productQuantity: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.productDetail = page.locator('[data-cy="product-detail"]');
    this.productName = this.productDetail.locator('[data-cy="product-name"]');
    this.productPrice = this.productDetail
      .locator('div[class*="Details"]')
      .locator('[data-cy="product-price"]');
    this.productQuantity = this.productDetail.locator('[data-cy="product-quantity"]');
    this.addToCartButton = this.productDetail.locator('[data-cy="product-add-to-cart"]');
  }

  async gotoProduct(productUrl: string) {
    await this.page.goto(productUrl);
  }

  async verifyProductDetails(productName: string, price: number) {
    await expect(this.productName).toHaveText(productName, { timeout: 15_000 });
    await expect(this.productPrice).toHaveText(`$ ${price.toFixed(2)}`);
    await expect(this.productQuantity).toBeVisible();
    await expect(this.addToCartButton).toBeVisible();
  }

  async addProductToCart(quantity: number = 1) {
    await this.productQuantity.selectOption(String(quantity));
    await expect(this.addToCartButton).toBeEnabled();

    // Sayfa değişmeden önce sepet isteğinin tamamlandığından emin ol,
    // yoksa tarayıcı devam eden isteği iptal eder.
    let cartUpdated = false;
    const onResponse = (response: Response) => {
      if (
        response.url().includes('/api/cart') &&
        response.request().method() === 'POST' &&
        response.ok()
      ) {
        cartUpdated = true;
      }
    };

    this.page.on('response', onResponse);
    await this.addToCartButton.click();
    await expect.poll(() => cartUpdated, { timeout: 15_000 }).toBe(true);
    this.page.off('response', onResponse);
  }
}