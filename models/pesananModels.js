const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Pesanan = sequelize.define('Pesanan', {
    kode_pesanan: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    nama_pembeli: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    whatsapp: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    daftar_item: {
      type: DataTypes.TEXT, // Menyimpan JSON array item yang dibeli
      allowNull: false
    },
    total_harga: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bukti_transfer: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'Menunggu Verifikasi' // Menunggu Verifikasi | Diproses | Dikirim
    }
  }, {
    tableName: 'pesanan',
    timestamps: true
  });

  return Pesanan;
};