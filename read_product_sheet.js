const XLSX = require('xlsx');

const filePath = './Shopee_mass_upload.xlsx';
const workbook = XLSX.readFile(filePath);

// Read the "Bản đăng tải" (Upload Template) sheet
const sheetName = 'Bản đăng tải';
const worksheet = workbook.Sheets[sheetName];

// Get all data
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== SHEET: "Bản đăng tải" (Product Upload) ===\n');

console.log('=== COLUMN HEADERS (Row 1) ===');
const headers = data[0];
console.log(`Total columns: ${headers.length}`);
for (let i = 0; i < Math.min(15, headers.length); i++) {
  const colLetter = String.fromCharCode(65 + i);
  console.log(`  Column ${colLetter}: "${headers[i]}"`);
}

if (headers.length > 15) {
  console.log(`  ... and ${headers.length - 15} more columns`);
}

console.log('\n=== DATA ROWS ===');
console.log(`Total data rows (excluding header): ${data.length - 1}`);

// Print all rows with data
let dataRowCount = 0;
for (let i = 1; i < data.length; i++) {
  const row = data[i];
  // Check if row has any content
  if (row.some(cell => cell && cell.toString().trim() !== '')) {
    dataRowCount++;
    console.log(`\nRow ${i + 1} (Data row ${dataRowCount}):`);
    console.log(`  Column A (${headers[0]}): "${row[0]}"`);
    console.log(`  Column B (${headers[1]}): "${row[1]}"`);
    console.log(`  Column C (${headers[2]}): "${row[2]}"`);
    
    // Show first few values of the row
    if (headers.length > 3) {
      console.log(`  Column D (${headers[3]}): "${row[3]}"`);
    }
  }
}

if (dataRowCount === 0) {
  console.log('No product data found in this sheet.');
}
