import { test, expect } from "@playwright/test"

test("renders task form", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /task accomplisher/i })).toBeVisible()
})
