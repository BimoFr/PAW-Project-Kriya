const produkModel = require('../models/produkModel');
const asyncHandler = require('../utils/asyncHandler');

const index = asyncHandler(async (req, res) => {
  res.render('index', {
    title: 'Beranda',
    produk: await produkModel.getAll(),
    kategori: produkModel.KATEGORI,
  });
});

function kelola(req, res) {
  res.render('kelola', {
    title: 'Kelola produk',
    kategori: produkModel.KATEGORI,
    motif: produkModel.MOTIF,
  });
}

module.exports = { index, kelola };
