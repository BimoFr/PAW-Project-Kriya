import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const Admin = require('../../models/adminModels');
const produkModel = require('../../models/produkModel');
const { mockAdmin, mockProdukList } = require('../fixtures/mockData');

describe('Integration Test — Katalog & REST API Produk (/api/produk)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET / harus merender halaman etalase utama dengan daftar produk (200)', async () => {
    vi.spyOn(produkModel, 'getAll').mockResolvedValue(mockProdukList);

    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Batik Tulis Parang Rusak 2 m');
  });

  it('GET /api/produk harus mengembalikan daftar produk dalam format JSON (200)', async () => {
    vi.spyOn(produkModel, 'getAll').mockResolvedValue(mockProdukList);

    const res = await request(app).get('/api/produk');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/produk harus ditolak (401) jika diakses tanpa sesi admin', async () => {
    const res = await request(app)
      .post('/api/produk')
      .send({
        nama: 'Tenun Endek Bali',
        kategori: 'Tenun',
        harga: 275000,
        stok: 10,
        gambar: 'endek.jpg',
      });

    expect(res.status).toBe(401);
  });

  it('POST, PUT, dan DELETE /api/produk harus berhasil jika menggunakan sesi admin', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue(mockAdmin);
    vi.spyOn(produkModel, 'create').mockResolvedValue({
      id: 99,
      nama: 'Tenun Endek Bali',
      kategori: 'Tenun',
      harga: 275000,
      stok: 10,
      deskripsi: 'Kain tenun endek khas Bali.',
      gambar: 'endek.jpg',
    });
    vi.spyOn(produkModel, 'getById').mockResolvedValue({
      id: 99,
      nama: 'Tenun Endek Bali',
      kategori: 'Tenun',
      harga: 275000,
      stok: 10,
      deskripsi: 'Kain tenun endek khas Bali.',
      gambar: 'endek.jpg',
    });
    vi.spyOn(produkModel, 'update').mockResolvedValue({
      id: 99,
      nama: 'Tenun Endek Bali Edisi Baru',
      kategori: 'Tenun',
      harga: 290000,
      stok: 8,
      deskripsi: 'Kain tenun endek khas Bali.',
      gambar: 'endek.jpg',
    });
    vi.spyOn(produkModel, 'remove').mockResolvedValue(true);

    const agent = request.agent(app);
    await agent
      .post('/masuk')
      .send({ username: 'admin_kriya', password: 'KriyaBatik2026!' });

    // Create Produk
    const createRes = await agent.post('/api/produk').send({
      nama: 'Tenun Endek Bali',
      kategori: 'Tenun',
      harga: 275000,
      stok: 10,
      deskripsi: 'Kain tenun endek khas Bali.',
      gambar: 'endek.jpg',
    });
    expect([200, 201]).toContain(createRes.status);

    // Update Produk
    const updateRes = await agent.put('/api/produk/99').send({
      nama: 'Tenun Endek Bali Edisi Baru',
      harga: 290000,
      stok: 8,
    });
    expect(updateRes.status).toBe(200);

    // Delete Produk
    const deleteRes = await agent.delete('/api/produk/99');
    expect(deleteRes.status).toBe(200);
  });

  it('GET /api/rute-ngawur harus mengembalikan JSON 404', async () => {
    const res = await request(app).get('/api/rute-ngawur');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Endpoint tidak ditemukan' });
  });
});