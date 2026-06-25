const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { config } = require("./../../../config");

const UPLOAD_DIR = config.uploadsDossiersDir;

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        const ok = file.mimetype.startsWith("image/");
        cb(ok ? null : new Error("Invalid file type"), ok);
    },
});

function getImageUrl(file) {
    return file ? `/uploads/dossiers/${file.filename}` : null;
}

module.exports = { upload, getImageUrl };
