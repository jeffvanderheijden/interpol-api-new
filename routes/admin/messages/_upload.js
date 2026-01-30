const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "messages");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    },
});

const fileFilter = (req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    cb(ok ? null : new Error("Unsupported media type"), ok);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

function getMediaInfo(file) {
    if (!file) return { media_type: "none", media_url: null };
    const media_type = file.mimetype.startsWith("image/") ? "image" : "video";
    const media_url = `/uploads/messages/${file.filename}`;
    return { media_type, media_url };
}

module.exports = { upload, getMediaInfo, UPLOAD_DIR };
