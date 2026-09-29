/**
 * Konversi nominal rupiah menjadi kata-kata.
 * Dipakai bersama oleh laporan operasional agar nominal tercetak
 * konsisten antar laporan (tidak ada duplikasi per service).
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const units = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
  const ones = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  const tens = [
    '',
    '',
    'Dua Puluh',
    'Tiga Puluh',
    'Empat Puluh',
    'Lima Puluh',
    'Enam Puluh',
    'Tujuh Puluh',
    'Delapan Puluh',
    'Sembilan Puluh',
  ];

  function convertBelowThousand(n: number): string {
    if (n === 0) return '';
    if (n < 12) return ones[n];
    if (n < 20) return ones[n - 10] + ' Belas';
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const rest = n % 10;
      return tens[ten] + (rest ? ' ' + ones[rest] : '');
    }
    if (n < 200) {
      const rest = n - 100;
      return 'Seratus' + (rest ? ' ' + convertBelowThousand(rest) : '');
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      return (
        ones[hundred] +
        ' Ratus' +
        (rest ? ' ' + convertBelowThousand(rest) : '')
      );
    }
    return '';
  }

  function convert(n: number): string {
    if (n < 0) return 'Minus ' + convert(-n);
    if (n < 1000) return convertBelowThousand(n);
    for (let i = 1; i < units.length; i++) {
      const divisor = Math.pow(1000, i);
      if (n < divisor * 1000) {
        const quotient = Math.floor(n / divisor);
        const remainder = n % divisor;
        let prefix: string;
        if (quotient === 1 && i === 1) prefix = 'Se';
        else prefix = convert(quotient) + ' ';
        return prefix + units[i] + (remainder ? ' ' + convert(remainder) : '');
      }
    }
    return '';
  }

  return convert(Math.round(num)).trim().replace(/\s+/g, ' ') + ' Rupiah';
}
