/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: "tests/e2e",
  timeout: 120000,
  expect: { timeout: 20000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:18976",
    trace: "off",
  },
  webServer: {
    command: "python -m http.server 18976 --directory interfaces",
    url: "http://127.0.0.1:18976/digital-pru-snap-robots.html",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
};
