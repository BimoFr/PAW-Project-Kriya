const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const folder = path.join(__dirname, '..', 'public', 'images', 'produk');
fs.mkdirSync(folder, { recursive: true });

const EKSTENSI = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, folder),
    // Nama acak agar tidak menimpa file lain dan aman dipakai di URL
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${EKSTENSI[file.mimetype]}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    EKSTENSI[file.mimetype]
      ? cb(null, true)
      : cb(Object.assign(new Error('Format gambar harus JPG, PNG, atau WebP'), { status: 400 })),
}).single('gambar');

const folderBukti = path.join(__dirname, '../public/images/bukti');
fs.mkdirSync(folderBukti, { recursive: true });

const storageBukti = multer.diskStorage({
  destination: (req, file, cb) => cb(null, folderBukti),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `bukti-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const unggahBukti = multer({
  storage: storageBukti,
  limits: { fileSize: 3 * 1024 * 1024 }, // Maks 3MB
  fileFilter: (req, file, cb) => {
    const valid = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
    if (valid) return cb(null, true);
    cb(new Error('Format bukti transfer harus berupa JPG, PNG, atau WEBP.'));
  }
}).single('bukti_transfer');

// Membungkus multer agar error-nya menjadi JSON yang rapi
function unggahGambar(req, res, next) {
  upload(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Ukuran gambar maksimal 2 MB' });
    if (err instanceof multer.MulterError || err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  });
}

module.exports = { unggahGambar, unggahBukti };