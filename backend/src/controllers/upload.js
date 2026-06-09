const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Chỉ chấp nhận hình ảnh (JPG, PNG, WEBP, GIF)'));
  },
});

exports.middleware = upload.array('files', 10);

exports.handle = (req, res) => {
  const files = (req.files || []).map((f) => ({
    url: `/uploads/${f.filename}`,
    filename: f.filename,
    size: f.size,
  }));
  res.status(201).json({ files });
};
