require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/calista';

const COLLECTIONS = [
  'users',
  'categories',
  'products',
  'reviews',
  'orders',
  'carts',
];

async function importDB() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  for (const col of COLLECTIONS) {
    const filePath = path.join(__dirname, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${col}.json (not found)`);
      continue;
    }

    const docs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!docs.length) {
      console.log(`Skipping ${col} (empty)`);
      continue;
    }

    const collection = mongoose.connection.collection(col);
    await collection.deleteMany({});
    await collection.insertMany(docs);
    console.log(`Imported ${docs.length} docs → ${col}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

importDB().catch(err => {
  console.error(err);
  process.exit(1);
});
