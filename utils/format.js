const rupiah = new Intl.NumberFormat('id-ID');

// 65000 -> "Rp 65.000"
function formatRupiah(angka) {
  return 'Rp ' + rupiah.format(angka);
}

module.exports = { formatRupiah };
