const fs = require("fs");
const path = require("path");

function safeUnlinkFromMediaUrl(mediaUrl) {
    if (!mediaUrl) return;
    const prefix = "/uploads/messages/";
    if (!mediaUrl.startsWith(prefix)) return;

    const filename = mediaUrl.slice(prefix.length);
    const abs = path.join(process.cwd(), "uploads", "messages", filename);
    fs.unlink(abs, () => { }); // ignore errors
}

module.exports = { safeUnlinkFromMediaUrl };
