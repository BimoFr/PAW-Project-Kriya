import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const produkModel = require('../../models/produkModel');
const { mockProdukList } = require('../fixtures/mockData');

describe('Integration Test — Fitur Asisten Belanja AI (/api/chat)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('POST /api/chat harus mengembalikan error (400) jika pesan kosong', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ pesan: '' });

    expect(res.status).toBe(400);
  });

  it('POST /api/chat harus memproses pesan dengan grounding katalog dan mengembalikan balasan AI (200)', async () => {
    vi.spyOn(produkModel, 'getAll').mockResolvedValue(mockProdukList);
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'Kami menyediakan Tenun Lurik Yogyakarta Hujan Gerimis seharga Rp 165.000 dengan stok 18 kain.',
            },
          },
        ],
      }),
    });

    const res = await request(app)
      .post('/api/chat')
      .send({ pesan: 'Ada kain tenun yang ready stok?' });

    expect(res.status).toBe(200);
    expect(res.body.balasan).toContain('Tenun Lurik Yogyakarta');
  });
});