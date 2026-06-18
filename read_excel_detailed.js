const XLSX = require('xlsx');

const filePath = './Shopee_mass_upload.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON with headers
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== FIRST 40 ROWS (RAW) ===');
for (let i = 0; i < Math.min(40, data.length); i++) {
  const row = data[i];
  console.log(`Row ${i + 1}: [${row.map(cell => `"${cell}"`).join(', ')}]`);
}

// Try to find where actual product data starts
console.log('\n=== SEARCHING FOR PRODUCT DATA ===');
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  // Look for rows that might be headers (contain "Tên sản phẩm" or similar)
  if (row[0] && row[0].toLowerCase && row[0].toLowerCase().includes('sản phẩm')) {
    console.log(`\nPossible header row at ${i + 1}: [${row.map(cell => `"${cell}"`).join(', ')}]`);
    // Print next few rows
    for (let j = i + 1; j <= i + 5 && j < data.length; j++) {
      console.log(`Row ${j + 1}: [${data[j].map(cell => `"${cell}"`).join(', ')}]`);
    }
    break;
  }
}
