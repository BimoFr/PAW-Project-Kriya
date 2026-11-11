const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const KATEGORI = ['Batik', 'Tenun'];
const MOTIF = ['parang', 'mega', 'kawung', 'lurik', 'ikat'];

const Produk = sequelize.define(
  'Produk',
  {
    nama: { type: DataTypes.STRING(120), allowNull: false },
    deskripsi: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    harga: { type: DataTypes.INTEGER, allowNull: false },
    stok: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    kategori: { type: DataTypes.STRING(20), allowNull: false },
    motif: { type: DataTypes.STRING(20), allowNull: false },
  },
  { tableName: 'produk' }
);

// Seluruh akses database dikelola di sini; controller hanya memanggil fungsi ini.
async function getAll({ kategori } = {}) {
  const where = kategori ? { kategori } : undefined;
  return Produk.findAll({ where, order: [['id', 'ASC']], raw: true });
}

async function getById(id) {
  return Produk.findByPk(id, { raw: true });
}

async function create(data) {
  const row = await Produk.create(data);
  return row.get({ plain: true });
}

async function update(id, data) {
  const row = await Produk.findByPk(id);
  if (!row) return null;
  await row.update(data);
  return row.get({ plain: true });
}

async function remove(id) {
  const row = await Produk.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
}

async function count() {
  return Produk.count();
}

async function bulkCreate(list) {
  return Produk.bulkCreate(list);
}

module.exports = { KATEGORI, MOTIF, getAll, getById, create, update, remove, count, bulkCreate };
