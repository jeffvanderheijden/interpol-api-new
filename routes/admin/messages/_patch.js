const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");
const { safeUnlinkFromMediaUrl } = require("./_files");

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

            const [rows] = await pool.execute(`SELECT media_url FROM messages WHERE id = ?`, [id]);
            if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

            const oldMediaUrl = rows[0].media_url;

            if (req.file) {
                const { media_type, media_url } = getMediaInfo(req.file);

                await pool.execute(
                    `UPDATE messages SET title = ?, body = ?, media_type = ?, media_url = ? WHERE id = ?`,
                    [title, body, media_type, media_url, id]
                );

                safeUnlinkFromMediaUrl(oldMediaUrl);
            } else {
                await pool.execute(
                    `UPDATE messages SET title = ?, body = ? WHERE id = ?`,
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
