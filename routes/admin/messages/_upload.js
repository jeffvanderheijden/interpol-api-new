const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { config } = require("./../../../config");

const UPLOAD_DIR = config.uploadsMessagesDir;

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
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
        cb(ok ? null : new Error("Invalid file type"), ok);
    },
});

function getMediaInfo(file) {
    if (!file) return { media_type: "none", media_url: null };
    return {
        media_type: file.mimetype.startsWith("image/") ? "image" : "video",
        media_url: `/uploads/messages/${file.filename}`,
    };
}

module.exports = { upload, getMediaInfo };
