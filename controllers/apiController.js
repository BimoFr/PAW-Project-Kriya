const fs = require('fs');
const config = require('../config');
const produkModel = require('../models/produkModel');
const asyncHandler = require('../utils/asyncHandler');
const { validasiProduk } = require('../utils/validasiProduk');
const { sequelize, Pesanan } = require('../models');

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'ID harus berupa bilangan bulat positif' });
    return null;
  }
  return id;
}

function hapusFileGagal(file) {
  if (file && file.path) {
    fs.unlink(file.path, () => {});
  }
}

// GET /api/status
const status = asyncHandler(async (req, res) => {
  let database = 'terhubung';
  let jumlahProduk = null;
  try { jumlahProduk = await produkModel.count(); } catch { database = 'terputus'; }
  res.json({
    status: 'ok',
    aplikasi: config.appName,
    database,
    jumlahProduk,
    uptimeDetik: Math.round(process.uptime()),
    waktuServer: new Date().toISOString(),
  });
});

// GET /api/produk  (opsional ?kategori=batik|tenun)
const daftarProduk = asyncHandler(async (req, res) => {
  const k = produkModel.KATEGORI.find((x) => x.toLowerCase() === String(req.query.kategori || '').toLowerCase());
  res.json(await produkModel.getAll({ kategori: k }));
});

// GET /api/produk/:id
const detailProduk = asyncHandler(async (req, res) => {
  const id = parseId(req, res); if (!id) return;
  const row = await produkModel.getById(id);
  if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(row);
});

// POST /api/produk
const tambahProduk = asyncHandler(async (req, res) => {
  const { errors, data } = validasiProduk(req.body);
  if (errors.length) return res.status(400).json({ error: 'Data tidak valid', detail: errors });
  res.status(201).json(await produkModel.create(data));
});

// PUT /api/produk/:id
const ubahProduk = asyncHandler(async (req, res) => {
  const id = parseId(req, res); if (!id) return;
  const { errors, data } = validasiProduk(req.body, { parsial: true });
  if (errors.length) return res.status(400).json({ error: 'Data tidak valid', detail: errors });
  const row = await produkModel.update(id, data);
  if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json(row);
});

// DELETE /api/produk/:id
const hapusProduk = asyncHandler(async (req, res) => {
  const id = parseId(req, res); if (!id) return;
  if (!(await produkModel.remove(id))) return res.status(404).json({ error: 'Produk tidak ditemukan' });
  res.json({ pesan: 'Produk berhasil dihapus', id });
});

// POST /api/checkout (Publik - Guest Checkout)
const checkout = async (req, res) => {
  const Produk = sequelize.models.Produk;
  const t = await sequelize.transaction();
  try {
    const namaBersih = String(req.body.nama_pembeli || '').trim();
    const waBersih = String(req.body.whatsapp || '').trim();
    const alamatBersih = String(req.body.alamat || '').trim();
    const { items } = req.body;

    if (!namaBersih || !waBersih || !alamatBersih) {
      await t.rollback();
      hapusFileGagal(req.file);
      return res.status(400).json({ error: 'Nama, nomor WhatsApp, dan alamat wajib diisi.' });
    }

    if (!/^[a-zA-Z\s]+$/.test(namaBersih)) {
      await t.rollback();
      hapusFileGagal(req.file);
      return res.status(400).json({ error: 'Nama penerima hanya boleh berisi huruf dan spasi.' });
    }

    if (!/^[0-9]{9,15}$/.test(waBersih)) {
      await t.rollback();
      hapusFileGagal(req.file);
      return res.status(400).json({ error: 'Nomor WhatsApp hanya boleh berisi angka (9–15 digit).' });
    }

    if (!/^[a-zA-Z0-9\s.,\-\/()]+$/.test(alamatBersih)) {
      await t.rollback();
      hapusFileGagal(req.file);
      return res.status(400).json({ error: 'Alamat lengkap tidak boleh mengandung karakter unik.' });
    }

    if (!req.file) {
      await t.rollback();
      return res.status(400).json({ error: 'Foto bukti transfer wajib diunggah.' });
    }

    let keranjang;
    try {
      keranjang = JSON.parse(items);
    } catch {
      await t.rollback();
      hapusFileGagal(req.file);
      return res.status(400).json({ error: 'Format data keranjang tidak valid.' });
    }

    if (!Array.isArray(keranjang) || keranjang.length === 0) {
      await t.rollback();
      hapusFileGagal(req.file);
      return res.status(400).json({ error: 'Keranjang belanja masih kosong.' });
    }

    let totalHarga = 0;
    const itemTercatat = [];

    for (const item of keranjang) {
      const qty = parseInt(item.qty, 10);
      if (!qty || qty < 1) {
        await t.rollback();
        hapusFileGagal(req.file);
        return res.status(400).json({ error: 'Jumlah pembelian tidak valid.' });
      }

      // Kunci baris produk di MySQL selama transaksi berlangsung
      const produk = await Produk.findByPk(item.id, {
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!produk) {
        await t.rollback();
        hapusFileGagal(req.file);
        return res.status(404).json({ error: `Produk dengan ID ${item.id} tidak ditemukan.` });
      }

      if (produk.stok < qty) {
        await t.rollback();
        hapusFileGagal(req.file);
        return res.status(400).json({
          error: `Stok "${produk.nama}" tersisa ${produk.stok}, tidak mencukupi permintaan (${qty}).`
        });
      }

      // Kurangi stok otomatis
      await produk.update({ stok: produk.stok - qty }, { transaction: t });

      const subtotal = produk.harga * qty;
      totalHarga += subtotal;
      itemTercatat.push({
        id: produk.id,
        nama: produk.nama,
        harga: produk.harga,
        qty,
        subtotal
      });
    }

    const kodePesanan = `KRY-${Date.now().toString().slice(-6)}`;

    const pesananBaru = await Pesanan.create({
      kode_pesanan: kodePesanan,
      nama_pembeli: namaBersih,
      whatsapp: waBersih,
      alamat: alamatBersih,
      daftar_item: JSON.stringify(itemTercatat),
      total_harga: totalHarga,
      bukti_transfer: `/images/bukti/${req.file.filename}`,
      status: 'Menunggu Verifikasi'
    }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      status: 'success',
      message: 'Pesanan berhasil dicatat dan stok telah diperbarui.',
      data: {
        kode_pesanan: pesananBaru.kode_pesanan,
        total_harga: pesananBaru.total_harga,
        items: itemTercatat
      }
    });
  } catch (err) {
    await t.rollback();
    hapusFileGagal(req.file);
    console.error('Error checkout:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses pesanan.' });
  }
};

// PUT /api/pesanan/:id/status (Khusus Pengelola - US-05)
const ubahStatusPesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const statusValid = ['Menunggu Verifikasi', 'Diproses', 'Dikirim'];

    if (!statusValid.includes(status)) {
      return res.status(400).json({ error: 'Status pesanan tidak valid.' });
    }

    const pesanan = await Pesanan.findByPk(id);
    if (!pesanan) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    await pesanan.update({ status });
    return res.json({ status: 'success', data: pesanan });
  } catch (err) {
    console.error('Error ubahStatusPesanan:', err);
    return res.status(500).json({ error: 'Gagal memperbarui status pesanan.' });
  }
};

function unggahGambar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Pilih file gambar terlebih dahulu' });
  res.status(201).json({ gambar: req.file.filename });
}

module.exports = {
  status,
  daftarProduk,
  detailProduk,
  tambahProduk,
  ubahProduk,
  hapusProduk,
  unggahGambar,
  checkout,
  ubahStatusPesanan
};