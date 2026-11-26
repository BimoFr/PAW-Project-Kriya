import { describe, it, expect, vi } from 'vitest';
const { cekAdminWeb, cekAdminApi } = require('../../../middlewares/authAdmin');

describe('Unit Test — Middleware authAdmin', () => {
  it('cekAdminWeb meneruskan request (next) jika sesi isAdmin bernilai true', () => {
    const req = { session: { isAdmin: true } };
    const res = { status: vi.fn().mockReturnThis(), render: vi.fn() };
    const next = vi.fn();

    cekAdminWeb(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('cekAdminWeb mengembalikan status 404 jika pengunjung belum login', () => {
    const req = { session: {} };
    const res = { status: vi.fn().mockReturnThis(), render: vi.fn() };
    const next = vi.fn();

    cekAdminWeb(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('404', { title: 'Halaman Tidak Ditemukan' });
  });

  it('cekAdminApi meneruskan request (next) jika sesi isAdmin bernilai true', () => {
    const req = { session: { isAdmin: true } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    cekAdminApi(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('cekAdminApi mengembalikan status 401 JSON jika belum login sebagai admin', () => {
    const req = {};
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    cekAdminApi(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Akses ditolak. Silakan login sebagai pengelola.',
    });
  });
});