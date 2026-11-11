const { initDatabase, sequelize } = require('../models');
const produkModel = require('../models/produkModel');

const dataAwal = [
  { nama: 'Batik Tulis Parang Rusak 2 m', deskripsi: 'Batik tulis pewarna soga alami, motif klasik keraton di atas katun primissima.', harga: 685000, stok: 8, kategori: 'Batik', motif: 'parang' },
  { nama: 'Kemeja Batik Mega Mendung', deskripsi: 'Lengan panjang, katun halus, potongan slim. Cocok untuk kondangan.', harga: 245000, stok: 18, kategori: 'Batik', motif: 'mega' },
  { nama: 'Batik Cap Kawung Sogan 2 m', deskripsi: 'Batik cap warna sogan, adem dipakai dan mudah dirawat untuk harian.', harga: 185000, stok: 26, kategori: 'Batik', motif: 'kawung' },
  { nama: 'Selendang Batik Sutra Tulis', deskripsi: 'Sutra tipis dengan batik tulis, jatuh lembut dan ringan.', harga: 320000, stok: 11, kategori: 'Batik', motif: 'mega' },
  { nama: 'Tenun Lurik Klasik 2 m', deskripsi: 'Ditenun dengan alat tradisional dari katun, sejuk untuk dipakai harian.', harga: 95000, stok: 34, kategori: 'Tenun', motif: 'lurik' },
  { nama: 'Tenun Ikat Sumba Kain Panjang', deskripsi: 'Pewarna alami, ditenun tangan selama berminggu-minggu oleh pengrajin Sumba.', harga: 890000, stok: 5, kategori: 'Tenun', motif: 'ikat' },
  { nama: 'Syal Tenun Ikat Troso', deskripsi: 'Motif ikat khas Troso, hangat dan cocok dipadukan dengan busana polos.', harga: 165000, stok: 22, kategori: 'Tenun', motif: 'ikat' },
  { nama: 'Outer Lurik Lengan Panjang', deskripsi: 'Outer dari kain lurik tenun, potongan longgar dan nyaman untuk keseharian.', harga: 275000, stok: 14, kategori: 'Tenun', motif: 'lurik' },
];

// Mengisi data awal hanya jika tabel produk masih kosong.
async function seedIfEmpty() {
  if ((await produkModel.count()) === 0) {
    await produkModel.bulkCreate(dataAwal);
    console.log(`Data awal ditambahkan (${dataAwal.length} produk).`);
  }
}

module.exports = { seedIfEmpty };

if (require.main === module) {
  initDatabase()
    .then(seedIfEmpty)
    .then(() => sequelize.close())
    .catch((err) => { console.error('Seed gagal:', err.message); process.exit(1); });
}
