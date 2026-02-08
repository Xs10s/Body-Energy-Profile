import { chromium } from "playwright";

export async function renderEnergyProfilePdf({
  baseUrl,
  profileId,
  variantId,
  authCookie,
  chineseMethod,
}: {
  baseUrl: string;
  profileId: string;
  variantId: string;
  chineseMethod?: string;
  authCookie?: { name: string; value: string; domain: string; path: string };
}): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1240, height: 1754 },
    deviceScaleFactor: 2,
  });

  if (authCookie) {
    await page.context().addCookies([authCookie]);
  }

  const methodQuery = chineseMethod ? `&chinese_method=${encodeURIComponent(chineseMethod)}` : "";
  const printUrl = `${baseUrl}/print/energy-profile?profile_id=${encodeURIComponent(
    profileId
  )}&variant_id=${encodeURIComponent(variantId)}${methodQuery}`;

  await page.goto(printUrl, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-export-ready="true"]', { timeout: 20000 });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    preferCSSPageSize: true,
  });

  await browser.close();
  return pdf;
}
