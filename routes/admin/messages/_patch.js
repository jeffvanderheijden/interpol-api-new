const fs = require("fs");
const path = require("path");
const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");

function safeUnlinkFromMediaUrl(mediaUrl) {
    if (!mediaUrl) return;
    // verwacht: /uploads/messages/<file>
    const prefix = "/uploads/messages/";
    if (!mediaUrl.startsWith(prefix)) return;

    const filename = mediaUrl.slice(prefix.length);
    const abs = path.join(process.cwd(), "uploads", "messages", filename);

    fs.unlink(abs, () => { });
}

module.exports = async function patchHandler(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    upload.single("media")(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();

            if (!title) return res.status(400).json({ error: "Title is required" });
            if (!body) return res.status(400).json({ error: "Body is required" });

            // haal huidige op voor media cleanup
            const [rows] = await pool.execute(
                `SELECT media_url FROM messages WHERE id = ?`,
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

            const oldMediaUrl = rows[0].media_url;

            let media_type = null;
            let media_url = null;

            if (req.file) {
                const info = getMediaInfo(req.file);
                media_type = info.media_type;
                media_url = info.media_url;
            }

            if (req.file) {
                await pool.execute(
                    `
          UPDATE messages
          SET title = ?, body = ?, media_type = ?, media_url = ?
          WHERE id = ?
          `,
                    [title, body, media_type, media_url, id]
                );

                // oude file weg
                safeUnlinkFromMediaUrl(oldMediaUrl);
            } else {
                await pool.execute(
                    `
          UPDATE messages
          SET title = ?, body = ?
          WHERE id = ?
          `,
                    [title, body, id]
                );
            }

            return res.json({ success: true });
        } catch (e) {
            console.error("❌ PATCH /api/admin/messages/:id error:", e);
            return res.status(500).json({ error: "Server error" });
        }
    });
};
