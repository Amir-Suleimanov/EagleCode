import { expect, test } from '@playwright/test';

test('landing and athlete login flow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Характер\. Развитие/ })).toBeVisible();
  await page.goto('/login');
  await page.getByRole('button', { name: 'Войти в профиль' }).click();
  await expect(page).toHaveURL(/\/app\/profile/);
  await expect(page.getByRole('heading', { name: /Добро пожаловать/ })).toBeVisible();
});

test('admin can open moderation queue', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@eaglecode.ru');
  await page.getByRole('button', { name: 'Войти в профиль' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto('/admin/applications');
  await expect(page.getByRole('heading', { name: 'Заявки участников' })).toBeVisible();
});

test('mobile routes do not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('all athlete routes render directly', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Войти в профиль' }).click();
  for (const route of ['/app/rating', '/app/competitions', '/app/competitions/cp1', '/app/results', '/app/achievements', '/app/map', '/app/cities', '/app/levels']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});

test('all admin routes render directly', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@eaglecode.ru');
  await page.getByRole('button', { name: 'Войти в профиль' }).click();
  for (const route of ['/admin/users', '/admin/competitions', '/admin/applications', '/admin/results', '/admin/rating', '/admin/levels']) {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  }
});
