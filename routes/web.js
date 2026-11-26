const express = require('express');
const bcrypt = require('bcrypt');
const homeController = require('../controllers/homeController');
const { cekAdminWeb } = require('../middlewares/authAdmin');
const Admin = require('../models/adminModels');

const router = express.Router();

// Halaman publik
router.get('/', homeController.index);
router.get('/lacak', homeController.lacak);

// Autentikasi pengelola (akses manual lewat /masuk)
router.get('/masuk', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/kelola');
  }
  res.render('masuk', { title: 'Masuk Pengelola — Kriya', error: null });
});

router.post('/masuk', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).render('masuk', {
        title: 'Masuk Pengelola — Kriya',
        error: 'Username dan password wajib diisi.'
      });
    }

    const admin = await Admin.findOne({ where: { username: username.trim() } });
    if (!admin) {
      return res.status(401).render('masuk', {
        title: 'Masuk Pengelola — Kriya',
        error: 'Username atau password salah.'
      });
    }

    const passwordCocok = await bcrypt.compare(password, admin.password);
    if (!passwordCocok) {
      return res.status(401).render('masuk', {
        title: 'Masuk Pengelola — Kriya',
        error: 'Username atau password salah.'
      });
    }

    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    req.session.adminRole = admin.role;

    return res.redirect('/kelola');
  } catch (err) {
    console.error('Error saat login admin:', err);
    return res.status(500).render('masuk', {
      title: 'Masuk Pengelola — Kriya',
      error: 'Terjadi kesalahan pada server.'
    });
  }
});

router.post('/keluar', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Halaman pengelola terkunci (pengunjung biasa akan melihat 404)
router.get('/kelola', cekAdminWeb, homeController.kelola);

module.exports = router;