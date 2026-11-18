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

function jeda(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const gambar = String(req.body.gambar || data.gambar || '').trim();

  if (!gambar) {
    if (!errors.some((msg) => /gambar|foto/i.test(msg))) {
      errors.push('Foto produk wajib diunggah');
    }
  } else {
    data.gambar = gambar;
  }

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
    const statusValid = ['Menunggu Verifikasi', 'Proses Kirim', 'Pesanan Selesai'];

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

// POST /api/chat (Publik - Chatbot Asisten Belanja AI via OpenRouter)
const chatAsisten = async (req, res) => {
  const waNomor = String(config.adminWhatsapp || '').trim();
  const waUrl = `https://wa.me/${waNomor}?text=${encodeURIComponent('Halo Kriya, saya ingin bertanya seputar kain batik/tenun.')}`;

  try {
    const pesan = String(req.body.pesan || '').trim();
    const riwayat = Array.isArray(req.body.riwayat) ? req.body.riwayat.slice(-6) : [];
    const apiKey = String(config.openrouterApiKey || '').trim();
    const daftarModel = String(config.openrouterModel || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (!pesan) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }
    if (pesan.length > 350) {
      return res.status(400).json({ error: 'Pesan maksimal 350 karakter.' });
    }

    if (!apiKey || daftarModel.length === 0) {
      console.error('Konfigurasi OpenRouter belum lengkap di .env (OPENROUTER_API_KEY / OPENROUTER_MODEL kosong).');
      return res.status(503).json({
        error: 'Asisten AI sedang tidak aktif. Silakan hubungi pengrajin langsung melalui WhatsApp.',
        whatsappUrl: waUrl
      });
    }

    const semuaProduk = await produkModel.getAll();
    const daftarKatalogTeks = semuaProduk.length
      ? semuaProduk.map((p) =>
          `- ${p.nama} (${p.kategori}) | Harga: Rp ${Number(p.harga).toLocaleString('id-ID')} | Stok: ${p.stok > 0 ? p.stok + ' tersedia' : 'HABIS'} | Keterangan: ${p.deskripsi || '-'}`
        ).join('\n')
      : 'Belum ada produk yang terdaftar di katalog.';

    const instruksiSistem = [
      `Kamu adalah Asisten Belanja resmi untuk "${config.appName}", toko daring kain batik dan tenun karya pengrajin Nusantara.`,
      'Jawab dalam bahasa Indonesia yang ramah, ringkas, sopan, dan langsung ke inti pertanyaan (maksimal 3-4 kalimat atau poin singkat).',
      'Gunakan HANYA data katalog di bawah ini untuk menjawab ketersediaan stok, harga, dan spesifikasi produk. Jangan pernah mengarang produk atau stok yang tidak ada di daftar.',
      'Jika pembeli bertanya tentang cara pemesanan: jelaskan bahwa pembeli cukup klik tombol "+ Keranjang" pada produk, buka ikon keranjang di kanan atas, transfer ke BCA 1234567890 a.n. Kriya Nusantara, lalu unggah bukti transfer tanpa perlu membuat akun.',
      'Jika pembeli meminta pesanan custom (motif/ukuran khusus), pembelian grosir/partai besar, atau menanyakan hal di luar katalog Kriya, sarankan untuk menekan tombol "Hubungi WhatsApp" di bawah chat agar terhubung langsung dengan pengrajin.',
      '',
      '=== KATALOG PRODUK KRIYA SAAT INI ===',
      daftarKatalogTeks
    ].join('\n');

    const messages = [
      { role: 'system', content: instruksiSistem },
      ...riwayat
        .filter((item) => item && (item.role === 'user' || item.role === 'model' || item.role === 'assistant') && typeof item.text === 'string')
        .map((item) => ({
          role: item.role === 'model' ? 'assistant' : item.role,
          content: item.text.slice(0, 500)
        })),
      { role: 'user', content: pesan }
    ];

    const antreanModel = daftarModel.length === 1 ? [daftarModel[0], daftarModel[0], daftarModel[0]] : daftarModel;

    for (let i = 0; i < antreanModel.length; i++) {
      const modelAktif = antreanModel[i];

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': `http://localhost:${config.port}`,
            'X-Title': config.appName
          },
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            model: modelAktif,
            messages,
            temperature: 0.35,
            max_tokens: 1000
          })
        });

        const data = await response.json();

        if (response.ok) {
          const balasan = data?.choices?.[0]?.message?.content?.trim();
          if (balasan) {
            return res.json({
              status: 'success',
              balasan,
              whatsappUrl: waUrl
            });
          }
          if (i < antreanModel.length - 1) {
            await jeda(800);
            continue;
          }
        }

        console.error(`OpenRouter API error (${modelAktif}, percobaan ${i + 1}):`, response.status, JSON.stringify(data));

        if ((response.status === 429 || response.status === 503 || response.status === 502) && i < antreanModel.length - 1) {
          await jeda(1200);
          continue;
        }

        break;
      } catch (fetchErr) {
        console.error(`OpenRouter fetch gagal (${modelAktif}):`, fetchErr.message);
        if (i < antreanModel.length - 1) {
          await jeda(1200);
          continue;
        }
      }
    }

    return res.status(502).json({
      error: 'Asisten AI sedang sibuk. Kamu bisa langsung bertanya ke pengrajin melalui WhatsApp.',
      whatsappUrl: waUrl
    });
  } catch (err) {
    console.error('Error chatAsisten:', err.name, err.message, err.cause || '');
    return res.status(500).json({
      error: 'Koneksi ke asisten AI terputus. Silakan hubungi pengrajin via WhatsApp.',
      whatsappUrl: waUrl
    });
  }
};

// POST /api/generate-caption (Admin - AI Auto-Caption Deskripsi F-06)
const generateCaption = async (req, res) => {
  try {
    const nama = String(req.body.nama || '').trim();
    const kategori = String(req.body.kategori || 'Batik').trim();
    const harga = Number(req.body.harga || 0);
    const apiKey = String(config.openrouterApiKey || '').trim();
    const daftarModel = String(config.openrouterModel || '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (!nama) {
      return res.status(400).json({ error: 'Isi nama produk terlebih dahulu sebelum membuat caption AI.' });
    }

    if (!apiKey || daftarModel.length === 0) {
      return res.status(503).json({ error: 'Konfigurasi OpenRouter AI belum aktif di .env.' });
    }

    const promptSistem = [
      `Kamu adalah copywriter profesional untuk "${config.appName}", toko daring kain batik dan tenun Nusantara.`,
      'Tugasmu menulis deskripsi promosi produk yang menarik, elegan, jujur, dan ringkas untuk etalase toko.',
      'Aturan penulisan:',
      '- Tulis dalam bahasa Indonesia yang natural dan persuasif (2–3 kalimat, maksimal 280 karakter).',
      '- Tonjolkan keindahan motif, kenyamanan bahan, dan kecocokan pemakaian (misalnya acara formal, kondangan, atau busana harian).',
      '- JANGAN menggunakan tanda bintang (**), tagar (#), emoji berlebihan, atau kalimat pembuka seperti "Berikut deskripsi produk:". Langsung tulis teks deskripsinya saja.'
    ].join('\n');

    const infoHarga = harga > 0 ? `, Harga: Rp ${harga.toLocaleString('id-ID')}` : '';
    const promptUser = `Buatkan deskripsi produk untuk -> Nama Produk: "${nama}", Kategori: ${kategori}${infoHarga}.`;

    const antreanModel = daftarModel.length === 1 ? [daftarModel[0], daftarModel[0], daftarModel[0]] : daftarModel;

    for (let i = 0; i < antreanModel.length; i++) {
      const modelAktif = antreanModel[i];

      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': `http://localhost:${config.port}`,
            'X-Title': config.appName
          },
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            model: modelAktif,
            messages: [
              { role: 'system', content: promptSistem },
              { role: 'user', content: promptUser }
            ],
            temperature: 0.6,
            max_tokens: 1000
          })
        });

        const data = await response.json();

        if (response.ok) {
          const caption = data?.choices?.[0]?.message?.content?.trim().replace(/^["']|["']$/g, '');
          if (caption) {
            return res.json({
              status: 'success',
              caption
            });
          }
          if (i < antreanModel.length - 1) {
            await jeda(800);
            continue;
          }
        }

        console.error(`OpenRouter Auto-Caption error (${modelAktif}):`, response.status, JSON.stringify(data));

        if ((response.status === 429 || response.status === 503 || response.status === 502) && i < antreanModel.length - 1) {
          await jeda(1200);
          continue;
        }

        break;
      } catch (fetchErr) {
        console.error(`OpenRouter Auto-Caption fetch gagal (${modelAktif}):`, fetchErr.message);
        if (i < antreanModel.length - 1) {
          await jeda(1200);
          continue;
        }
      }
    }

    return res.status(502).json({
      error: 'AI sedang sibuk. Silakan coba klik ulang atau isi deskripsi secara manual.'
    });
  } catch (err) {
    console.error('Error generateCaption:', err);
    return res.status(500).json({
      error: 'Gagal terhubung ke layanan AI. Silakan isi deskripsi secara manual.'
    });
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
  ubahStatusPesanan,
  chatAsisten,
  generateCaption
};