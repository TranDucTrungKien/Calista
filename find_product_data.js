const XLSX = require('xlsx');

const filePath = './Shopee_mass_upload.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON with headers
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(`Total rows: ${data.length}\n`);

// Search for actual product data - looking for typical headers
const headerKeywords = ['tên sản phẩm', 'mô tả', 'giá', 'kho', 'product name', 'description'];

for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const rowStr = row.map(cell => (cell || '').toString().toLowerCase()).join('|');
  
  if (row[0] && row[1] && !row[0].includes('Định') && !row[0].includes('Lưu') && !row[0].includes('Hướng')) {
    // Print rows that have content in at least 2 columns
    if (row.length >= 3 && row[0] && row[1] && row[2]) {
      console.log(`Row ${i + 1}: ${row.slice(0, 5).map(c => `"${c}"`).join(' | ')}`);
    }
  }
}

// Also check if there are other sheets
console.log('\n=== Available Sheets ===');
workbook.SheetNames.forEach((name, idx) => {
  console.log(`Sheet ${idx + 1}: ${name}`);
});
