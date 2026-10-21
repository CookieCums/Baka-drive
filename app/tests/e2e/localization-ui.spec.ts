import { expect, test } from '@playwright/test';
import { desktopFixture, nativeCalls } from './desktop-fixture';

test('fresh launch presents Baka Drive authentication without monetization or updater gates', async ({ page }) => {
  await desktopFixture(page, { signedOut: true });
  await page.goto('/');
  await expect(page.getByText(/Baka Drive/i).first()).toBeVisible();
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByText(/sponsor|sponsored|supporter|donat/i)).toHaveCount(0);
  expect(await nativeCalls(page, 'cmd_get_supporter_status')).toHaveLength(0);
  expect(await nativeCalls(page, 'cmd_begin_supporter_checkout')).toHaveLength(0);
  expect(await nativeCalls(page, 'cmd_submit_crash_report')).toHaveLength(0);
  expect(await nativeCalls(page, 'plugin:updater|check')).toHaveLength(0);
});

test('signed-in session opens dashboard without calling a payment or update service', async ({ page }) => {
  await desktopFixture(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Preferences', exact: true })).toBeVisible();
  expect(await nativeCalls(page, 'cmd_get_supporter_status')).toHaveLength(0);
  expect(await nativeCalls(page, 'cmd_begin_supporter_checkout')).toHaveLength(0);
  expect(await nativeCalls(page, 'cmd_refresh_supporter')).toHaveLength(0);
  expect(await nativeCalls(page, 'plugin:updater|check')).toHaveLength(0);
});
