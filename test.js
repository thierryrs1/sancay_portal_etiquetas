const text = String.fromCharCode(94) + 'FD<BarCode>' + String.fromCharCode(94) + 'FS';
const rex = /<BarCode>(\W|$)/gi;
console.log('Matches:', rex.exec(text));
console.log('Result:', text.replace(rex, 'Sem Código'));
