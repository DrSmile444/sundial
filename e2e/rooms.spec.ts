import { expect, test } from '@playwright/test';

test('room list loads a card for every room', async ({ page }) => {
  await page.goto('/rooms');

  await expect(page.getByRole('article')).toHaveCount(24);
  await expect(page.getByRole('heading', { name: 'Atomic Suite' })).toBeVisible();
});

test('sorting by price reorders the cards', async ({ page }) => {
  await page.goto('/rooms');
  await expect(page.getByRole('article').first()).toContainText('Atomic Suite');

  await page.getByLabel('Sort').selectOption('price');

  await expect(page).toHaveURL(/sort=price/);
  await expect(page.getByRole('article').first()).not.toContainText('Atomic Suite');
  await expect(page.getByRole('article').first()).toContainText('Eames Studio');
});

test('room details open from a card', async ({ page }) => {
  await page.goto('/rooms/atomic-suite');

  await expect(page.getByRole('heading', { name: 'Atomic Suite', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book this room' })).toBeVisible();
  await expect(page.getByLabel('Check in')).toBeVisible();
});
