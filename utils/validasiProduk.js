const { KATEGORI, MOTIF } = require('../models/produkModel');

// Memvalidasi body produk. `parsial: true` dipakai PUT (hanya field yang dikirim dicek).
function validasiProduk(body = {}, { parsial = false } = {}) {
  const errors = [];
  const data = {};
  const ada = (k) => body[k] !== undefined && body[k] !== null && body[k] !== '';

  if (!parsial || ada('nama')) {
    const nama = String(body.nama ?? '').trim();
    if (!nama || nama.length > 120) errors.push('nama wajib diisi (maksimal 120 karakter)');
    else data.nama = nama;
  }

  if (body.deskripsi !== undefined) {
    const d = String(body.deskripsi).trim();
    if (d.length > 500) errors.push('deskripsi maksimal 500 karakter');
    else data.deskripsi = d;
  }

  for (const k of ['harga', 'stok']) {
    if (!parsial && k === 'stok' && !ada('stok')) { data.stok = 0; continue; }
    if (!parsial || ada(k)) {
      const n = Number(body[k]);
      if (!ada(k) || !Number.isInteger(n) || n < 0) errors.push(`${k} harus berupa bilangan bulat >= 0`);
      else data[k] = n;
    }
  }

  if (!parsial || ada('kategori')) {
    const k = KATEGORI.find((x) => x.toLowerCase() === String(body.kategori ?? '').toLowerCase());
    if (!k) errors.push(`kategori harus salah satu dari: ${KATEGORI.join(', ')}`);
    else data.kategori = k;
  }

  if (!parsial || ada('motif')) {
    const m = String(body.motif ?? '').toLowerCase();
    if (!MOTIF.includes(m)) errors.push(`motif harus salah satu dari: ${MOTIF.join(', ')}`);
    else data.motif = m;
  }

  if (parsial && Object.keys(data).length === 0 && errors.length === 0) {
    errors.push('tidak ada field yang dikirim untuk diperbarui');
  }

  return { errors, data };
}

module.exports = { validasiProduk };
