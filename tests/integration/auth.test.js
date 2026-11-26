import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const app = require('../../app');
const Admin = require('../../models/adminModels');
const produkModel = require('../../models/produkModel');
const { sequelize } = require('../../models');
const { mockAdmin, mockProdukList } = require('../fixtures/mockData');

describe('Integration Test — Autentikasi & Sesi Pengelola (/masuk, /kelola, /keluar)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /masuk harus menampilkan halaman form login (200)', async () => {
    const res = await request(app).get('/masuk');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Masuk');
  });

  it('POST /masuk harus gagal (400) jika username atau password kosong', async () => {
    const res = await request(app)
      .post('/masuk')
      .send({ username: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Username dan password wajib diisi');
  });

  it('POST /masuk harus gagal (401) jika username tidak terdaftar di database', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .post('/masuk')
      .send({ username: 'user_asing', password: 'PasswordSalah123' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('Username atau password salah');
  });

  it('POST /masuk harus gagal (401) jika password tidak cocok dengan hash bcrypt', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue(mockAdmin);

    const res = await request(app)
      .post('/masuk')
      .send({ username: 'admin_kriya', password: 'PasswordSalah!' });

    expect(res.status).toBe(401);
    expect(res.text).toContain('Username atau password salah');
  });

  it('Alur lengkap: Login valid -> redirect /kelola -> akses dashboard (200) -> Logout -> terblokir (404)', async () => {
    vi.spyOn(Admin, 'findOne').mockResolvedValue(mockAdmin);
    vi.spyOn(produkModel, 'getAll').mockResolvedValue(mockProdukList);
    if (sequelize.models.Pesanan) {
      vi.spyOn(sequelize.models.Pesanan, 'findAll').mockResolvedValue([]);
    }

    const agent = request.agent(app);

    // 1. Sebelum login, /kelola ditolak dengan 404
    const sebelumLogin = await agent.get('/kelola');
    expect(sebelumLogin.status).toBe(404);

    // 2. Login dengan kredensial valid
    const loginRes = await agent
      .post('/masuk')
      .send({ username: 'admin_kriya', password: 'KriyaBatik2026!' });

    expect(loginRes.status).toBe(302);
    expect(loginRes.headers.location).toBe('/kelola');

    // 3. Setelah login, sesi aktif dan dapat membuka /kelola
    const dashboardRes = await agent.get('/kelola');
    expect(dashboardRes.status).toBe(200);

    // 4. Logout menghancurkan sesi
    const logoutRes = await agent.post('/keluar');
    expect(logoutRes.status).toBe(302);
    expect(logoutRes.headers.location).toBe('/');

    // 5. Setelah logout, /kelola kembali terkunci (404)
    const setelahLogout = await agent.get('/kelola');
    expect(setelahLogout.status).toBe(404);
  });
});