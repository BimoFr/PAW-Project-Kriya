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

const lacak = asyncHandler(async (req, res) => {
  const kode = (req.query.kode || '').trim().toUpperCase();
  let pesanan = null;
  let errorPesan = null;

  if (kode) {
    pesanan = await Pesanan.findOne({
      where: { kode_pesanan: kode },
    });

    if (!pesanan) {
      errorPesan = `Kode pesanan "${kode}" tidak ditemukan. Periksa kembali kode transaksi Anda.`;
    }
  }

  res.render('lacak', {
    title: 'Lacak Pesanan — Kriya',
    kode,
    pesanan,
    errorPesan,
  });
});

module.exports = { index, kelola, lacak };