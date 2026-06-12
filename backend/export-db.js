require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/calista';
const OUTPUT_DIR = path.join(__dirname, '..', 'database');

const COLLECTIONS = [
  'users',
  'categories',
  'products',
  'reviews',
  'orders',
  'carts',
];

async function exportDB() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const col of COLLECTIONS) {
    const collection = mongoose.connection.collection(col);
    const docs = await collection.find({}).toArray();
    const filePath = path.join(OUTPUT_DIR, `${col}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    console.log(`Exported ${docs.length} docs → database/${col}.json`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

exportDB().catch(err => {
  console.error(err);
  process.exit(1);
});
