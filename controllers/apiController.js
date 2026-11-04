const config = require('../config');
const produkModel = require('../models/produkModel');

// GET /api/status
function status(req, res) {
  res.json({
    status: 'ok',
    aplikasi: config.appName,
    uptimeDetik: Math.round(process.uptime()),
    waktuServer: new Date().toISOString(),
  });
}

// GET /api/produk  (opsional: ?kategori=batik|tenun)
function produk(req, res) {
  let data = produkModel.getAll();
  const { kategori } = req.query;
  if (kategori) {
    data = data.filter((p) => p.kategori.toLowerCase() === String(kategori).toLowerCase());
  }
  res.json(data);
}

module.exports = { status, produk };
