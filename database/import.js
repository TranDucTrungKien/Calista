const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mongoose = require('mongoose');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/calista';
const { ObjectId } = mongoose.Types;

// Fields that must be stored as ObjectId (scalar)
const OBJECTID_FIELDS = {
  categories: ['_id'],
  products: ['_id'],
  reviews: ['_id', 'productId', 'userId'],
  orders: ['_id', 'userId'],
  carts: ['_id', 'userId'],
  users: ['_id'],
};

// Array fields whose elements must be stored as ObjectId
const OBJECTID_ARRAY_FIELDS = {
  products: ['categories'],
};

function isObjectIdHex(v) {
  return typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);
}

function convertDoc(col, doc, fields) {
  const out = { ...doc };
  for (const field of fields) {
    if (out[field] && isObjectIdHex(out[field])) {
      out[field] = new ObjectId(out[field]);
    }
  }
  const arrFields = OBJECTID_ARRAY_FIELDS[col] || [];
  for (const field of arrFields) {
    if (Array.isArray(out[field])) {
      out[field] = out[field].map(v => isObjectIdHex(v) ? new ObjectId(v) : v);
    }
  }
  return out;
}

const COLLECTIONS = ['users', 'categories', 'products', 'reviews', 'orders', 'carts'];

async function importDB() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  for (const col of COLLECTIONS) {
    const filePath = path.join(__dirname, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${col}.json (not found)`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw.length) {
      console.log(`Skipping ${col} (empty)`);
      continue;
    }

    const fields = OBJECTID_FIELDS[col] || ['_id'];
    const docs = raw.map(d => convertDoc(col, d, fields));

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
