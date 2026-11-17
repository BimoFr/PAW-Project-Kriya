const express = require('express');
const { unggahGambar, unggahBukti } = require('../middlewares/upload');
const { cekAdminApi } = require('../middlewares/authAdmin');
const api = require('../controllers/apiController');

const router = express.Router();

router.get('/status', api.status);

// Rute publik untuk katalog, transaksi pembeli, & asisten AI
router.get('/produk', api.daftarProduk);
router.get('/produk/:id', api.detailProduk);
router.post('/checkout', unggahBukti, api.checkout);
router.post('/chat', api.chatAsisten);

// Rute terkunci khusus pengelola
router.post('/upload', cekAdminApi, unggahGambar, api.unggahGambar);
router.post('/produk', cekAdminApi, api.tambahProduk);
router.put('/produk/:id', cekAdminApi, api.ubahProduk);
router.delete('/produk/:id', cekAdminApi, api.hapusProduk);
router.put('/pesanan/:id/status', cekAdminApi, api.ubahStatusPesanan);

module.exports = router;