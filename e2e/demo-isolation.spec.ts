import { test, expect, type Page } from "@playwright/test";

/**
 * Demo-/Echtmodus: Datentrennung, Aktionen und Navigation.
 * Benötigt ein Testkonto: E2E_EMAIL / E2E_PASSWORD.
 * Ohne Zugang werden Tests sichtbar übersprungen (nicht bestanden).
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const DEMO_NAME_SAMPLE = /demo\.invalid|Erfundener Beispieldatensatz/;

test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL/E2E_PASSWORD fehlen – Tests übersprungen");

async function login(page: Page) {
  await page.goto("/auth");
  await page.getByLabel(/e-?mail/i).first().fill(EMAIL!);
  await page.getByLabel(/passwort/i).first().fill(PASSWORD!);
  await page.getByRole("button", { name: /anmelden|einloggen/i }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 20000 });
}

async function setDemo(page: Page, on: boolean) {
  await page.evaluate((enable) => {
    const authKey = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
    const userId = authKey ? JSON.parse(localStorage.getItem(authKey) ?? "{}")?.user?.id : undefined;
    const key = `demo-mode:${userId ?? "anon"}`;
    if (enable) localStorage.setItem(key, "1"); else localStorage.removeItem(key);
  }, on);
  await page.reload();
}

/** Zeichnet jede schreibende Backend-Anfrage auf. */
function trackWrites(page: Page) {
  const writes: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    const isBackend = url.includes("/rest/v1/") || url.includes("/functions/v1/");
    const isRead = url.includes("/rest/v1/rpc/get_") || req.method() === "GET" || req.method() === "HEAD";
    if (isBackend && !isRead && ["POST", "PATCH", "PUT", "DELETE"].includes(req.method())) {
      writes.push(`${req.method()} ${url}`);
    }
  });
  return writes;
}

test.describe("Demo-Modus", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await setDemo(page, true);
  });

  test("Kunden, Angebote, Verträge zeigen Demo-Daten ohne Backend-Schreibzugriff", async ({ page }) => {
    const writes = trackWrites(page);
    for (const path of ["/customers", "/offers", "/contracts"]) {
      await page.goto(path);
      await expect(page.getByText("Demo-Modus aktiv")).toBeVisible();
      await expect(page.locator("main")).not.toBeEmpty();
    }
    // Aktion: einen Demo-Kunden öffnen
    await page.goto("/customers");
    const firstRow = page.locator("main").getByRole("row").nth(1);
    if (await firstRow.count()) await firstRow.click();
    expect(writes, `Unerlaubte Schreibzugriffe: ${writes.join(", ")}`).toEqual([]);
  });

  test("Zurücksetzen stellt Demo-Daten wieder her", async ({ page }) => {
    await page.goto("/customers");
    await page.getByRole("button", { name: /zurücksetzen/i }).click();
    await expect(page.getByText(/zurückgesetzt/i)).toBeVisible();
  });

  test("Navigation: alle Menüpunkte sichtbar und ohne Seitenfehler erreichbar", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    const links = await page.locator("[data-sidebar] a[href^='/']").evaluateAll((as) =>
      Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!)))
    );
    expect(links.length).toBeGreaterThan(10);
    expect(links).toContain("/super-admin");
    for (const href of links) {
      await page.goto(href);
      await expect(page.getByText("Zugriff verweigert")).toHaveCount(0);
    }
    expect(errors, errors.join("\n")).toEqual([]);
  });
});

test.describe("Echtmodus", () => {
  test("Keine Demo-Datensätze und kein Demo-Banner", async ({ page }) => {
    await login(page);
    await setDemo(page, false);
    for (const path of ["/customers", "/offers", "/contracts"]) {
      await page.goto(path);
      await expect(page.getByText("Demo-Modus aktiv")).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(DEMO_NAME_SAMPLE);
    }
  });

  test("Wechsel Demo an/aus vermischt keine Daten", async ({ page }) => {
    await login(page);
    await setDemo(page, true);
    await page.goto("/customers");
    await setDemo(page, false);
    await page.goto("/customers");
    await expect(page.locator("main")).not.toContainText(DEMO_NAME_SAMPLE);
  });
});
