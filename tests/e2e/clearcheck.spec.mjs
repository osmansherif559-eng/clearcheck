import { expect, test } from "@playwright/test";

test.describe("ClearCheck browser workflow", () => {
  test("loads real CSS and supports theme switching", async ({ page }) => {
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/");
    await expect(page).toHaveTitle(/ClearCheck/);
    await expect(page.locator("h1")).toContainText("Know the warning signs");
    const bodyFont = await page.locator("body").evaluate((element) => getComputedStyle(element).fontFamily);
    expect(bodyFont).toContain("Inter");
    const initialTheme = await page.locator("html").getAttribute("data-theme");
    await page.getByRole("button", { name: /Switch to (dark|light) mode/ }).click();
    const nextTheme = await page.locator("html").getAttribute("data-theme");
    expect(nextTheme).not.toBe(initialTheme);
    expect(await page.evaluate(() => localStorage.getItem("clearcheck-theme"))).toBe(nextTheme);
    await page.reload();
    expect(await page.locator("html").getAttribute("data-theme")).toBe(nextTheme);
    expect(consoleErrors, "browser console should not report errors").toEqual([]);
    expect(pageErrors, "page should not throw runtime errors").toEqual([]);
  });

  test("supports the mobile navigation and avoids horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileNavigation).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: "Learn" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test("keeps the checker inside the viewport across target widths", async ({ page }) => {
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      await page.goto("/check");
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        textareaWidth: document.querySelector("textarea")?.getBoundingClientRect().width ?? 0,
        viewportWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.overflow, `${width}px layout should not overflow`).toBe(false);
      expect(metrics.textareaWidth, `${width}px textarea should fit`).toBeLessThanOrEqual(metrics.viewportWidth);
    }
  });

  test("analyzes a sample, presents evidence, and resets", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Account alert/ }).click();
    await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();
    await expect(page.getByText("Evidence from your input").first()).toBeVisible();
    await expect(page.getByRole("paragraph").filter({ hasText: "Do not share the code or password." }).first()).toBeVisible();
    await page.getByRole("button", { name: "New check" }).click();
    await expect(page.getByRole("heading", { name: "High concern" })).toHaveCount(0);
    await expect(page.getByLabel("Suspicious message or URL")).toHaveValue("");
  });

  test("does not make network requests when analyzing locally", async ({ page }) => {
    await page.goto("/check");
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.getByLabel("Suspicious message or URL").fill("URGENT: send your verification code now");
    await page.getByRole("button", { name: /Analyze safely/ }).click();
    await expect(page.getByRole("heading", { name: "High concern" })).toBeVisible();
    expect(requests.filter((url) => !url.startsWith("http://127.0.0.1:3106/")).length).toBe(0);
  });
});

test("production shell can reload offline after service worker preparation", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("service workers unsupported");
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("h1")).toContainText("Know the warning signs");
  await context.setOffline(false);
});
