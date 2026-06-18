const XLSX = require('xlsx');

const filePath = './Shopee_mass_upload.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== COLUMN HEADERS ===');
if (data.length > 0) {
  const headers = data[0];
  console.log('Row 1 (Headers):');
  headers.forEach((header, index) => {
    const colLetter = String.fromCharCode(65 + index);
    console.log(`  Column ${colLetter}: "${header}"`);
  });
  
  console.log('\n=== ALL DATA ROWS ===');
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length > 0) {
      console.log(`\nRow ${i + 1}:`);
      console.log(`  Column A (${headers[0]}): ${row[0]}`);
      console.log(`  Column B (${headers[1]}): ${row[1]}`);
      console.log(`  Column C (${headers[2]}): ${row[2]}`);
    }
  }
}
