import { type Page, type Locator, expect } from '@playwright/test';

const UUID_REGEX =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export class OrderConfirmationPage {
  readonly page: Page;
  readonly confirmationTitle: Locator;
  readonly main: Locator;

  constructor(page: Page) {
    this.page = page;

    this.confirmationTitle = page.getByRole('heading', {
      name: 'Your order is complete!',
    });
    this.main = page.getByRole('main');
  }

  async verifyOrderSuccess() {
    await expect(this.confirmationTitle).toBeVisible({ timeout: 15_000 });
    await expect(this.main).toContainText(UUID_REGEX);
  }

  async verifyShippingAddress(
    streetAddress: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  ) {
    await expect(this.main).toContainText(streetAddress);
    await expect(this.main).toContainText(`${city}, ${state} ${zipCode}`);
    await expect(this.main).toContainText(country);
  }

  async verifyOrderItem(productName: string, quantity: number) {
    await expect(this.main).toContainText(productName);
    await expect(this.main).toContainText(`Quantity: ${quantity}`);
  }

  async verifyOrderTotal(total: number) {
    await expect(this.main).toContainText(`$ ${total.toFixed(2)}`);
  }
}