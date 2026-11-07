import { type Page,type Locator, expect } from '@playwright/test';
import type { ShippingAddress } from '../data/testData';

export class CartPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly zipInput: Locator;
  readonly stateInput: Locator;
  readonly countryInput: Locator;
  readonly placeOrderButton: Locator;
  readonly emptyCartHeading: Locator;
  readonly main: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.locator('input[name="email"]');
    this.streetInput = page.locator('input[name="streetAddress"]');
    this.cityInput = page.locator('input[name="city"]');
    this.zipInput = page.locator('input[name="zipCode"]');
    this.stateInput = page.locator('input[name="state"]');
    this.countryInput = page.locator('input[name="country"]');
    this.placeOrderButton = page.locator('[data-cy="checkout-place-order"]');

    this.main = page.getByRole('main');
    this.emptyCartHeading = this.main.getByRole('heading', {
      name: 'Your shopping cart is empty!',
    });
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async verifyCartItem(unitPrice: number) {
    await expect(this.main).toContainText(`$ ${unitPrice.toFixed(2)}`, {
      timeout: 10_000,
    });
    await expect(this.emptyCartHeading).not.toBeVisible();
    await expect(this.main).toContainText('Shipping');
  }

  async fillShippingAddress(address: ShippingAddress) {
    await this.emailInput.fill(address.email);
    await this.streetInput.fill(address.streetAddress);
    await this.cityInput.fill(address.city);
    await this.zipInput.fill(address.zipCode);
    await this.stateInput.fill(address.state);
    await this.countryInput.fill(address.country);
  }

  async submitOrder() {
    await expect(this.placeOrderButton).toBeVisible();
    await expect(this.placeOrderButton).toBeEnabled();
    await this.placeOrderButton.click();
  }

  async clickPlaceOrder() {
    await this.placeOrderButton.click();
  }

  async isZipMissingByBrowserValidation(): Promise<boolean> {
    return this.zipInput.evaluate(
      (el) => (el as HTMLInputElement).validity.valueMissing
    );
  }
}