require('dotenv').config();
const connectDB = require('./config/db');
const Category = require('./models/category');

const BASE = process.env.BACKEND_URL || 'http://localhost:5000';

const imageMap = {
  'lam-sach': `${BASE}/uploads/images/lamsach.png`,
  'can-bang-cap-nen': `${BASE}/uploads/images/canbangvacapnen.png`,
  'treatment': `${BASE}/uploads/images/treatment.png`,
  'duong-am': `${BASE}/uploads/images/duongam.png`,
  'mat-na': `${BASE}/uploads/images/matna.png`,
};

async function run() {
  await connectDB();
  for (const [slug, image] of Object.entries(imageMap)) {
    const result = await Category.updateOne({ slug }, { image });
    console.log(`${slug}: ${result.modifiedCount ? 'updated' : 'not found'}`);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
