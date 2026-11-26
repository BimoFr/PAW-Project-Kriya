const bcrypt = require('bcrypt');

const mockAdmin = {
  id: 1,
  username: 'admin_kriya',
  password: bcrypt.hashSync('KriyaBatik2026!', 10),
  nama_lengkap: 'Pemilik Toko Kriya',
  role: 'owner',
};

const mockProdukList = [
  {
    id: 1,
    nama: 'Batik Tulis Parang Rusak 2 m',
    deskripsi: 'Batik tulis pewarna soga alami di atas katun primissima.',
    harga: 685000,
    stok: 8,
    kategori: 'Batik',
    motif: 'parang',
    gambar: 'batik-parang.webp',
  },
  {
    id: 2,
    nama: 'Tenun Lurik Yogyakarta Hujan Gerimis',
    deskripsi: 'Kain tenun lurik ATBM khas Yogyakarta motif Hujan Gerimis.',
    harga: 165000,
    stok: 18,
    kategori: 'Tenun',
    motif: '',
    gambar: 'tenun-lurik.jpeg',
  },
];

module.exports = { mockAdmin, mockProdukList };