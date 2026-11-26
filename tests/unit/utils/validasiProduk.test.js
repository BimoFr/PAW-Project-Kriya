import { describe, it, expect } from 'vitest';
const { validasiProduk } = require('../../../utils/validasiProduk');

describe('Unit Test — validasiProduk()', () => {
  it('harus meloloskan data produk lengkap yang valid', () => {
    const input = {
      nama: '  Tenun Troso Jepara  ',
      deskripsi: 'Tenun ikat buatan tangan pengrajin Jepara.',
      harga: '210000',
      stok: '14',
      kategori: 'tenun',
      gambar: 'tenun-troso.jpg',
    };

    const { errors, data } = validasiProduk(input);

    expect(errors).toHaveLength(0);
    expect(data).toEqual({
      nama: 'Tenun Troso Jepara',
      deskripsi: 'Tenun ikat buatan tangan pengrajin Jepara.',
      harga: 210000,
      stok: 14,
      kategori: 'Tenun',
      motif: '',
      gambar: 'tenun-troso.jpg',
    });
  });

  it('harus memberi default stok = 0 dan gambar = null jika kosong', () => {
    const { errors, data } = validasiProduk({
      nama: 'Batik Cap Kawung',
      harga: 185000,
      kategori: 'Batik',
      gambar: '',
    });

    expect(errors).toHaveLength(0);
    expect(data.stok).toBe(0);
    expect(data.gambar).toBeNull();
  });

  it('harus menolak jika nama kosong, harga negatif, kategori salah, dan ekstensi gambar tidak valid', () => {
    const { errors } = validasiProduk({
      nama: '',
      deskripsi: 'a'.repeat(505),
      harga: -5000,
      stok: 1.5,
      kategori: 'Songket',
      gambar: 'virus.exe',
    });

    expect(errors.length).toBeGreaterThanOrEqual(5);
    expect(errors).toContain('nama wajib diisi (maksimal 120 karakter)');
    expect(errors).toContain('deskripsi maksimal 500 karakter');
    expect(errors).toContain('harga harus berupa bilangan bulat >= 0');
    expect(errors).toContain('stok harus berupa bilangan bulat >= 0');
    expect(errors).toContain('kategori harus salah satu dari: Batik, Tenun');
  });

  it('harus mendukung mode parsial (PUT) dan menolak jika tidak ada field dikirim', () => {
    const validUpdate = validasiProduk({ harga: 250000 }, { parsial: true });
    expect(validUpdate.errors).toHaveLength(0);
    expect(validUpdate.data).toEqual({ harga: 250000 });

    const emptyUpdate = validasiProduk({}, { parsial: true });
    expect(emptyUpdate.errors).toContain('tidak ada field yang dikirim untuk diperbarui');
  });
});