import { test, expect } from '@playwright/test';

// =============================================================================
// CONFIGURATION
// =============================================================================
const BASE_URL = 'file:///C:/Users/jcsou/OneDrive/Documentos/GitHub/HTML/Classhero/Interface.html';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Wait for element to be both attached and visible
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} timeout - in milliseconds
 */
async function waitForVisible(page, selector, timeout = 20000) {
  await page.waitForSelector(selector, { state: 'attached', timeout });
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Fill all OTP inputs in sequence
 * @param {import('@playwright/test').Page} page
 * @param {string[]} digits - array of 6 digits
 */
async function fillOtp(page, digits = ['1', '2', '3', '4', '5', '6']) {
  for (let i = 0; i < digits.length; i++) {
    await page.fill(`#otp-${i}`, digits[i]);
  }
}

/**
 * Click button by text content
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 */
async function clickByText(page, text) {
  await page.click(`button:has-text("${text}")`);
}

// =============================================================================
// TEST SUITE
// =============================================================================

test.describe('ClassHero Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Reset state before each test
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Tests', () => {
    test('Navegação entre Início e Meus Cursos', async ({ page }) => {
      // First perform login
      await page.fill('#email-input', 'aluno@gmail.com');
      await page.getByRole('button', { name: 'Enviar código de acesso' }).click();
      // Wait for OTP step to appear
      await page.waitForSelector('.otp-wrapper', { state: 'visible' });
      await fillOtp(page);
      await clickByText(page, 'Validar e entrar');

      // Wait for app screen
      await page.waitForSelector('#screen-app', { state: 'attached' });

      // Ensure navigation button is visible
      await waitForVisible(page, '#nav-cursos');

      // Click navigation button with fallback
      try {
        await page.click('#nav-cursos');
      } catch {
        await page.evaluate(() => {
          const btn = document.getElementById('nav-cursos');
          if (btn) btn.click();
        });
      }

      // Verify transition to courses view
      await page.waitForSelector('#view-cursos', { state: 'attached' });

      // Check course cards exist
      const cards = page.locator('.full-course-card');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
    });
  });

  test.describe('Authentication Tests', () => {
    test('Simulação de acesso com login', async ({ page }) => {
      // Wait for email input to be visible
      await waitForVisible(page, '#email-input');
      await page.getByRole('textbox', { name: 'E-mail institucional' }).click();
      await page.getByRole('textbox', { name: 'E-mail institucional' }).fill('aluno@gmail.com');
      await page.getByRole('button', { name: 'Enviar código de acesso' }).click();

      // Fill OTP fields
      await fillOtp(page);

      // Continue to mission view
      await page.getByRole('button', { name: 'Validar e entrar' }).click();

      // Verify next view loads
      await page.waitForSelector('#view-missao, #view-cursos', { state: 'attached' });
    });
  });

  test.describe('UI Component Tests', () => {
    test('Verificação de elementos na Sidebar', async ({ page }) => {
      // Perform login steps
      await page.fill('#email-input', 'aluno@teste.com');
      await page.getByRole('button', { name: 'Enviar código de acesso' }).click();
      await page.waitForSelector('.otp-wrapper', { state: 'visible' });
      await fillOtp(page);
      await clickByText(page, 'Validar e entrar');

      // Wait for sidebar to appear
      await page.waitForSelector('.sidebar-xp-bar', { state: 'attached', timeout: 20000 });

      // Verify sidebar elements
      const xpBar = page.locator('.sidebar-xp-bar');
      // Find the quick‑button that displays the ranking label by its visible text
      // Ensure the quick‑button container is present
      await page.waitForSelector('.sidebar-quick', { state: 'attached' });
      const rankingBtn = page.locator('button.quick-btn', { hasText: 'Ranking' });

      await expect(xpBar).toBeVisible();
      await expect(rankingBtn).toBeVisible();
    });
  });
});