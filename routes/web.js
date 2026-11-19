const express = require('express');
const homeController = require('../controllers/homeController');
const { cekAdminWeb } = require('../middlewares/authAdmin');

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

router.post('/masuk', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.redirect('/kelola');
  }
  res.status(401).render('masuk', {
    title: 'Masuk Pengelola — Kriya',
    error: 'Username atau password salah.'
  });
});

router.post('/keluar', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Halaman pengelola terkunci (pengunjung biasa akan melihat 404)
router.get('/kelola', cekAdminWeb, homeController.kelola);

module.exports = router;