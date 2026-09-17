import { expect, test } from '@playwright/test';

test('home page shows the hotel and its featured rooms', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Twenty-four rooms');
  await expect(page.getByRole('heading', { name: 'Atomic Suite' })).toBeVisible();
});

test('search takes the chosen dates and guests to the room list', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Check in').fill('2027-03-02');
  await page.getByLabel('Check out').fill('2027-03-05');
  await page.getByLabel('Guests').selectOption('2');
  await page.getByRole('button', { name: 'Search rooms' }).click();

  await expect(page).toHaveURL(/\/rooms\?checkIn=2027-03-02&checkOut=2027-03-05&guests=2/);
  await expect(page.getByRole('heading', { name: 'Rooms', level: 1 })).toBeVisible();
});
