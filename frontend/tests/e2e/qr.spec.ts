import { test, expect } from '../fixtures/index';

const API = 'http://localhost:5000/api';

test.describe('QR Codes — generation', () => {
  test('QR Codes button opens modal with Generate button on published form', async ({ page, createTestForm }) => {
    const form = await createTestForm('QR Modal Form', true);
    await page.goto(`/forms/${form.id}/edit`);
    await page.getByRole('button', { name: 'QR Codes' }).click();
    await expect(page.getByRole('button', { name: 'Generate' })).toBeVisible({ timeout: 5000 });
  });

  test('QR generation via API returns array with tokens', async ({ authToken, createTestForm }) => {
    const form = await createTestForm('API QR Form', true);
    const res = await fetch(`${API}/forms/${form.id}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ count: 2 }),
    });
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.codes ?? [];
    expect(arr.length).toBeGreaterThan(0);
  });

  test('Generate button in UI creates QR code with image', async ({ page, createTestForm }) => {
    const form = await createTestForm('QR UI Generate', true);
    await page.goto(`/forms/${form.id}/edit`);
    await page.getByRole('button', { name: 'QR Codes' }).click();
    await page.getByRole('button', { name: 'Generate' }).click();
    // QR image or SVG should appear
    await expect(page.locator('img, svg, canvas').last()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('QR Codes — listing', () => {
  test('generated QR codes appear in API list', async ({ authToken, createTestForm }) => {
    const form = await createTestForm('QR List Form', true);
    await fetch(`${API}/forms/${form.id}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ count: 1 }),
    });
    const res = await fetch(`${API}/forms/${form.id}/qr`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.ok).toBeTruthy();
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.codes ?? [];
    expect(arr.length).toBeGreaterThan(0);
  });
});

test.describe('QR Codes — deletion', () => {
  test('deleting a QR code removes it from list', async ({ authToken, createTestForm }) => {
    const form = await createTestForm('QR Delete Form', true);
    const genRes = await fetch(`${API}/forms/${form.id}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ count: 1 }),
    });
    const genData = await genRes.json();
    const arr = Array.isArray(genData) ? genData : genData.codes ?? [];
    const qrId = arr[0]?.id;

    if (qrId) {
      const delRes = await fetch(`${API}/forms/${form.id}/qr/${qrId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(delRes.ok).toBeTruthy();

      const listRes = await fetch(`${API}/forms/${form.id}/qr`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const listData = await listRes.json();
      const remaining = Array.isArray(listData) ? listData : listData.codes ?? [];
      expect(remaining.find((q: any) => q.id === qrId)).toBeUndefined();
    }
  });
});

test.describe('QR Codes — token burn (single use)', () => {
  test('second submission with same QR token is rejected', async ({ authToken, createTestForm }) => {
    const form = await createTestForm('QR Burn Form', true);
    const genRes = await fetch(`${API}/forms/${form.id}/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ count: 1 }),
    });
    const genData = await genRes.json();
    const arr = Array.isArray(genData) ? genData : genData.codes ?? [];
    const token = arr[0]?.token;

    if (token && form.slug) {
      const first = await fetch(`${API}/f/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token, answers: [] }),
      });
      expect(first.ok).toBeTruthy();

      const second = await fetch(`${API}/f/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token, answers: [] }),
      });
      expect(second.status).toBeGreaterThanOrEqual(400);
    }
  });
});

test.describe('QR Codes — negative cases', () => {
  test('listing QR codes without auth returns 401', async () => {
    const res = await fetch(`${API}/forms/00000000-0000-0000-0000-000000000000/qr`);
    expect([401, 403, 404]).toContain(res.status);
  });

  test('generating QR for non-existent form returns error', async ({ authToken }) => {
    const res = await fetch(`${API}/forms/00000000-0000-0000-0000-000000000000/qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ count: 1 }),
    });
    expect([400, 403, 404]).toContain(res.status);
  });
});
