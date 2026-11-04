const produkModel = require('../models/produkModel');

function index(req, res) {
  res.render('index', {
    title: 'Beranda',
    produk: produkModel.getAll(),
    kategori: produkModel.getKategori(),
  });
}

module.exports = { index };
