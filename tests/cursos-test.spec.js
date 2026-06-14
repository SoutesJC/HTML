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
  await page.getByText(text).first().click();
}

/**
 * Perform login flow
 * @param {import('@playwright/test').Page} page
 * @param {string} email - email to use for login
 */
async function performLogin(page, email = 'aluno@gmail.com') {
  await waitForVisible(page, '#email-input');
  await page.getByRole('textbox', { name: 'E-mail institucional' }).click();
  await page.getByRole('textbox', { name: 'E-mail institucional' }).fill(email);
  await page.getByRole('button', { name: 'Enviar código de acesso' }).click();
  await page.waitForSelector('.otp-wrapper', { state: 'visible' });
  await fillOtp(page);
  await clickByText(page, 'Validar e entrar');
  await page.waitForSelector('#screen-app', { state: 'attached' });
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
      await performLogin(page);

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
      // Perform login
      await performLogin(page);

      // Verify next view loads
      await page.waitForSelector('#view-missao, #view-cursos', { state: 'attached' });
    });
  });

  test.describe('UI Component Tests', () => {
    test('Verificação de elementos na Sidebar', async ({ page }) => {
      // Perform login
      await performLogin(page, 'aluno@teste.com');

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

  test.describe('Course Workflow Tests', () => {
    test('Enviar entrega de trabalho', async ({ page }) => {
      // Perform login
      await performLogin(page);

      // Navigate to Meus Cursos
      await waitForVisible(page, '#nav-cursos');
      await clickByText(page, 'Meus Cursos');

      // Wait for courses view to be visible
      await page.waitForSelector('#view-cursos', { state: 'visible' });

      // Click on the specific course (within the courses view)
      const courseCard = page.locator('#view-cursos').getByText('Desenvolvimento de Apps com Flutter').first();
      await courseCard.click();

      // Click "Enviar entrega" button on the course card
      // Use a more resilient selector that looks for the button with the matching text
      await page.locator('button.mat-btn-primary', { hasText: 'Enviar entrega' }).click();

      // Wait for the submit modal to be attached and open
      await page.waitForSelector('#submit-modal.open', { state: 'attached' });

      // Wait for upload zone to be visible inside the modal
      await page.waitForSelector('#upload-zone', { state: 'visible' });

      // Click on upload area
      await page.locator('#upload-zone').click();

      // Click "Enviar entrega" in the upload modal footer
      await page.locator('#submit-modal button.btn-primary').click();
    });
  });
});