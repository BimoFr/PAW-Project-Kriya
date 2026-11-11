const config = require('../config');
const produkModel = require('../models/produkModel');
const asyncHandler = require('../utils/asyncHandler');
const { validasiProduk } = require('../utils/validasiProduk');

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'ID harus berupa bilangan bulat positif' });
    return null;
  }
  return id;
}

// GET /api/status
const status = asyncHandler(async (req, res) => {
  let database = 'terhubung';
  let jumlahProduk = null;
  try { jumlahProduk = await produkModel.count(); } catch { database = 'terputus'; }
  res.json({
    status: 'ok',
    aplikasi: config.appName,
    database,
    jumlahProduk,
    uptimeDetik: Math.round(process.uptime()),
    waktuServer: new Date().toISOString(),
  });
});

// GET /api/produk  (opsional ?kategori=batik|tenun)
const daftarProduk = asyncHandler(async (req, res) => {
  const k = produkModel.KATEGORI.find((x) => x.toLowerCase() === String(req.query.kategori || '').toLowerCase());
  res.json(await produkModel.getAll({ kategori: k }));
});

// GET /api/produk/:id
const detailProduk = asyncHandler(async (req, res) => {
  const id = parseId(req, res); if (!id) return;
  const row = await produkModel.getById(id);
  if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(row);
});

// POST /api/produk
const tambahProduk = asyncHandler(async (req, res) => {
  const { errors, data } = validasiProduk(req.body);
  if (errors.length) return res.status(400).json({ error: 'Data tidak valid', detail: errors });
  res.status(201).json(await produkModel.create(data));
});

// PUT /api/produk/:id
const ubahProduk = asyncHandler(async (req, res) => {
  const id = parseId(req, res); if (!id) return;
  const { errors, data } = validasiProduk(req.body, { parsial: true });
  if (errors.length) return res.status(400).json({ error: 'Data tidak valid', detail: errors });
  const row = await produkModel.update(id, data);
  if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(row);
});

// DELETE /api/produk/:id
const hapusProduk = asyncHandler(async (req, res) => {
  const id = parseId(req, res); if (!id) return;
  if (!(await produkModel.remove(id))) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json({ pesan: 'Produk berhasil dihapus', id });
});

module.exports = { status, daftarProduk, detailProduk, tambahProduk, ubahProduk, hapusProduk };