import { expect, test } from "@playwright/test";

test("builds a chart image URL from form inputs", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Build a chart image URL in seconds." }),
  )
    .toBeVisible();

  await page.getByLabel("Chart type").selectOption("line");
  await page.getByLabel("Labels (comma separated)").fill("Jan, Feb, Mar");
  await page.getByLabel("Values (comma separated)").fill("5, 9, 12");

  const imageInput = page.getByLabel("Image URL");
  await expect(imageInput).toHaveValue(/http:\/\/127\.0\.0\.1:8000\/\?/);

  const imageUrl = await imageInput.inputValue();
  const response = await page.request.get(imageUrl);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect((await response.body()).length).toBeGreaterThan(1000);
});

test("buttons have matching sizes", async ({ page }) => {
  await page.goto("/");

  const copyButton = page.getByRole("button", { name: "Copy URL" });
  const downloadButton = page.getByRole("button", { name: "Download SVG" });

  await expect(copyButton).toBeVisible();
  await expect(downloadButton).toBeVisible();

  const copyBox = await copyButton.boundingBox();
  const downloadBox = await downloadButton.boundingBox();

  expect(copyBox).not.toBeNull();
  expect(downloadBox).not.toBeNull();

  const widthDiff = Math.abs((copyBox?.width ?? 0) - (downloadBox?.width ?? 0));
  const heightDiff = Math.abs(
    (copyBox?.height ?? 0) - (downloadBox?.height ?? 0),
  );

  expect(widthDiff).toBeLessThanOrEqual(1);
  expect(heightDiff).toBeLessThanOrEqual(1);
});
