const produkModel = require('../models/produkModel');
const asyncHandler = require('../utils/asyncHandler');
const { Pesanan } = require('../models');

const index = asyncHandler(async (req, res) => {
  res.render('index', {
    title: 'Beranda',
    produk: await produkModel.getAll(),
    kategori: produkModel.KATEGORI,
  });
});

const kelola = asyncHandler(async (req, res) => {
  const pesanan = await Pesanan.findAll({ order: [['createdAt', 'DESC']] });

  res.render('kelola', {
    title: 'Kelola produk',
    produk: await produkModel.getAll(),
    kategori: produkModel.KATEGORI,
    motif: produkModel.MOTIF,
    pesanan,
  });
});

module.exports = { index, kelola };