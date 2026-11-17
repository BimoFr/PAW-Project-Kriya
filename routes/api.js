const express = require('express');
const { unggahGambar } = require('../middlewares/upload');
const api = require('../controllers/apiController');

const router = express.Router();

router.post('/upload', unggahGambar, api.unggahGambar);
router.get('/status', api.status);

router.get('/produk', api.daftarProduk);
router.get('/produk/:id', api.detailProduk);
router.post('/produk', api.tambahProduk);
router.put('/produk/:id', api.ubahProduk);
router.delete('/produk/:id', api.hapusProduk);

module.exports = router;
