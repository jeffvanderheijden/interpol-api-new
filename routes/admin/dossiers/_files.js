const fs = require("fs");
const path = require("path");

const { config } = require("./../../../config");
const { logError } = require("./../../../utils/log");

function safeUnlinkFromImageUrl(imageUrl) {
    if (!imageUrl) return;

    const prefix = "/uploads/dossiers/";
    if (!imageUrl.startsWith(prefix)) return;

    const filename = imageUrl.slice(prefix.length);
    const absPath = path.join(config.uploadsDossiersDir, filename);

    fs.unlink(absPath, (err) => {
        if (err && err.code !== "ENOENT") {
            logError("Dossier image cleanup failed", err);
        }
    });
}

module.exports = { safeUnlinkFromImageUrl };
