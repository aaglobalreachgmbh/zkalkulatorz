
import { test, expect } from '@playwright/test';

test.describe('Customer Mode Isolation', () => {
    // CLAIM 3: Im Customer Mode DARF KEINE interne Info leaken
    test('should NOT render sensitive financial data in Customer Mode', async ({ page }) => {
        // Navigate with mode=customer
        await page.goto('/calculator?mode=customer');

        // Wait for calculator to interact
        // Note: In a real app we might need to select a tariff first to see price bars
        // For now we check the static UI structure and global text
        try {
            await page.waitForSelector('[data-testid="calculator-loaded"]', { timeout: 5000 });
        } catch (e) {
            // If no specific test id, wait for body
            await page.waitForLoadState('networkidle');
        }

        // 1. Check for Sensitive Keywords globally
        const bodyText = await page.innerText('body');
        const sensitiveKeywords = [
            'Einkaufspreis',
            'EK-Netto',
            'Händler-Marge',
            'Marge',
            'Provision',
            'Subvention'
        ];

        for (const keyword of sensitiveKeywords) {
            expect(bodyText).not.toContain(keyword);
        }

        // 2. Check for Specific UI Elements (using likely classes or IDs)
        // Dealer Config Panel
        const dealerPanel = page.locator('[data-testid="dealer-config-panel"]');
        await expect(dealerPanel).not.toBeVisible();

        // Margin Display in Sticky Bar
        const marginDisplay = page.locator('.text-green-600:has-text("€")'); // Heuristic for margin values
        if (await marginDisplay.count() > 0) {
            // If green text exists, ensure it's not labeled as Margin
            await expect(marginDisplay).not.toContainText('Marge');
        }

        // 3. Check Source Code (Data Attributes)
        const content = await page.content();
        expect(content).not.toContain('data-margin-value');
        expect(content).not.toContain('data-ek-price');
    });

    // CLAIM 5: Admin Guard
    test('should redirect unauthenticated user from /admin', async ({ page }) => {
        await page.goto('/admin');
        // Expect redirect to login or auth page, or 403/404
        await expect(page).toHaveURL(/.*(auth|login|denied)/);
    });
});
