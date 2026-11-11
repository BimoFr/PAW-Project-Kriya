const express = require('express');
const api = require('../controllers/apiController');

const router = express.Router();

router.get('/status', api.status);

router.get('/produk', api.daftarProduk);
router.get('/produk/:id', api.detailProduk);
router.post('/produk', api.tambahProduk);
router.put('/produk/:id', api.ubahProduk);
router.delete('/produk/:id', api.hapusProduk);

module.exports = router;
