const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const apiController = require('../controllers/apiController');
const authAdminMod = require('../middlewares/authAdmin');
const uploadMod = require('../middlewares/upload');

const authAdmin = typeof authAdminMod === 'function'
  ? authAdminMod
  : (authAdminMod.authAdmin || authAdminMod.wajibAdmin || ((req, res, next) => next()));

function buatMulterFallback(subFolder, fieldName) {
  const dir = path.join(__dirname, '..', 'public', 'images', subFolder);
  fs.mkdirSync(dir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  });
  return multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }
  }).single(fieldName);
}

function ambilMiddlewareUpload(mod, kandidatKeys, fieldName, subFolder) {
  if (mod && typeof mod.single === 'function') {
    return mod.single(fieldName);
  }
  if (mod && typeof mod === 'object') {
    for (const key of kandidatKeys) {
      const target = mod[key];
      if (typeof target === 'function') return target;
      if (target && typeof target.single === 'function') return target.single(fieldName);
    }
  }
  return buatMulterFallback(subFolder, fieldName);
}

const uploadProduk = ambilMiddlewareUpload(
  uploadMod,
  ['uploadProduk', 'produk', 'uploadGambar', 'gambar', 'upload'],
  'gambar',
  'produk'
);

const uploadBukti = ambilMiddlewareUpload(
  uploadMod,
  ['uploadBukti', 'bukti', 'uploadBuktiTransfer', 'buktiTransfer', 'upload'],
  'bukti_transfer',
  'bukti'
);

// Publik
router.get('/status', apiController.status);
router.get('/produk', apiController.daftarProduk);
router.get('/produk/:id', apiController.detailProduk);
router.post('/checkout', uploadBukti, apiController.checkout);
router.post('/chat', apiController.chatAsisten);

// Pengelola / Admin
router.post('/upload', authAdmin, uploadProduk, apiController.unggahGambar);
router.post('/produk', authAdmin, apiController.tambahProduk);
router.put('/produk/:id', authAdmin, apiController.ubahProduk);
router.delete('/produk/:id', authAdmin, apiController.hapusProduk);
router.put('/pesanan/:id/status', authAdmin, apiController.ubahStatusPesanan);
router.post('/generate-caption', authAdmin, apiController.generateCaption);

module.exports = router;