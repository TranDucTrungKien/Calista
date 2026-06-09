const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/calista';
  try {
    await mongoose.connect(uri);
    console.log('Kết nối MongoDB thành công:', mongoose.connection.name);
  } catch (err) {
    console.error('Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
