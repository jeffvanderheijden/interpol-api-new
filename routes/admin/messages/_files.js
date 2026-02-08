const fs = require("fs");
const path = require("path");
const { config } = require("./../../../config");
const { logError } = require("./../../../utils/log");

function safeUnlinkFromMediaUrl(mediaUrl) {
    if (!mediaUrl) return;
    const prefix = "/uploads/messages/";
    if (!mediaUrl.startsWith(prefix)) return;

    const filename = mediaUrl.slice(prefix.length);
    const abs = path.join(config.uploadsMessagesDir, filename);
    fs.unlink(abs, (err) => {
        if (err) {
            // best-effort cleanup; ignore ENOENT
            if (err.code !== "ENOENT") logError("Media cleanup failed", err);
        }
    });
}

module.exports = { safeUnlinkFromMediaUrl };
