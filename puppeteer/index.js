import puppeteer from "puppeteer";

const devices = [
  { name: "iPhone 14 Pro", width: 390, height: 844 },
  { name: "Pixel 6 Pro", width: 412, height: 915 },
  { name: "iPad Pro", width: 1024, height: 1366 },
];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const device of devices) {
    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: 2,
    });

    await page.goto("http://localhost:5173/favourites");

    // Optional: Wait for UI to settle (e.g., splash screen to finish)
    await new Promise(resolve => setTimeout(resolve, 10000));

    await page.screenshot({
      path: `screenshots/${device.name.replace(/\s/g, "_")}.png`,
      fullPage: false,
    });

    console.log(`✅ Screenshot taken for ${device.name}`);
  }

  await browser.close();
})();