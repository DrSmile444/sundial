import { expect, test, type APIRequestContext } from '@playwright/test';

const STAY = { checkIn: '2027-03-02', checkOut: '2027-03-05', guests: 2 };

const CANDIDATE_ROOMS = ['apollo-loft', 'kidney-pool-bungalow', 'eames-studio'];

async function firstFreeRoom(request: APIRequestContext): Promise<string> {
  for (const roomSlug of CANDIDATE_ROOMS) {
    const response = await request.post('/api/availability/check', {
      data: { roomSlug, ...STAY },
    });
    const body = (await response.json()) as { available: boolean };

    if (body.available) return roomSlug;
  }

  throw new Error('No candidate room is free for the test stay.');
}

test('a guest books a room, opens it from the manage page and cancels it', async ({
  page,
  request,
}) => {
  const roomSlug = await firstFreeRoom(request);
  const email = `e2e-${String(Date.now())}@example.test`;

  await page.goto(
    `/book/${roomSlug}?checkIn=${STAY.checkIn}&checkOut=${STAY.checkOut}&guests=${String(STAY.guests)}`,
  );

  await expect(page.getByText('Available for 3 nights.')).toBeVisible();
  await expect(page.getByText('Total at the property')).toBeVisible();

  await page.getByLabel('Full name').fill('Iris Calloway');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Confirm reservation' }).click();

  await expect(page).toHaveURL(/\/booking\/SD-[A-Z2-9]{6}\/confirmed/);
  await expect(page.getByRole('heading', { name: 'Your room is held' })).toBeVisible();

  const reference = /\/booking\/(SD-[A-Z2-9]{6})\//.exec(page.url())?.[1];
  expect(reference).toBeTruthy();

  await page.goto('/manage');
  await page.getByLabel('Reservation reference').fill(reference ?? '');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Find my reservation' }).click();

  await expect(page.getByRole('heading', { name: reference ?? '', level: 1 })).toBeVisible();
  await expect(page.getByText('confirmed')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel reservation' }).click();

  await expect(page.getByText('This reservation is cancelled.')).toBeVisible();
});
