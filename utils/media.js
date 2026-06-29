const path = require("path");

const IMAGE_EXTENSIONS = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".bmp",
    ".avif",
]);

const VIDEO_EXTENSIONS = new Set([
    ".mp4",
    ".webm",
    ".mov",
    ".m4v",
    ".ogv",
    ".ogg",
    ".avi",
    ".mkv",
]);

function normalizeOptionalUrl(value) {
    const normalized = String(value || "").trim();
    return normalized || null;
}

function inferMediaTypeFromUrl(mediaUrl) {
    if (!mediaUrl) return null;

    const cleanUrl = String(mediaUrl).split("#")[0].split("?")[0];
    const extension = path.extname(cleanUrl).toLowerCase();

    if (IMAGE_EXTENSIONS.has(extension)) return "image";
    if (VIDEO_EXTENSIONS.has(extension)) return "video";

    return null;
}

function normalizeMessageMediaType(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "image" || normalized === "video" ? normalized : null;
}

module.exports = {
    inferMediaTypeFromUrl,
    normalizeMessageMediaType,
    normalizeOptionalUrl,
};
