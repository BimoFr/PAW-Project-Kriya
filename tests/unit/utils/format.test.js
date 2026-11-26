import { describe, it, expect } from 'vitest';
const { formatRupiah } = require('../../../utils/format');

describe('Unit Test — formatRupiah()', () => {
  it('harus memformat angka ribuan menjadi format mata uang Rupiah Indonesia', () => {
    expect(formatRupiah(65000)).toBe('Rp 65.000');
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000');
  });

  it('harus memformat angka 0 dengan benar', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });
});