const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");
const { safeUnlinkFromMediaUrl } = require("./_files");

function parsePublishAt(value) {
    const v = String(value || "").trim();
    if (!v) return undefined; // undefined = niet aanpassen

    let normalized = v.replace("T", " ");
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
        normalized = `${normalized}:00`;
    }
    return normalized;
}

module.exports = async function patchHandler(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    upload.single("media")(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();
            const publish_at = parsePublishAt(req.body.publish_at);

            if (!title) return res.status(400).json({ error: "Title is required" });
            if (!body) return res.status(400).json({ error: "Body is required" });

            const [rows] = await pool.execute(
                `SELECT media_url, publish_at FROM messages WHERE id = ?`,
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

            const oldMediaUrl = rows[0].media_url;

            // publish_at update alleen als het meegestuurd is
            const nextPublishAt = publish_at !== undefined ? publish_at : rows[0].publish_at;

            if (req.file) {
                const { media_type, media_url } = getMediaInfo(req.file);

                await pool.execute(
                    `UPDATE messages 
                     SET title = ?, body = ?, media_type = ?, media_url = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, media_type, media_url, nextPublishAt, id]
                );

                safeUnlinkFromMediaUrl(oldMediaUrl);
            } else {
                await pool.execute(
                    `UPDATE messages 
                     SET title = ?, body = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, nextPublishAt, id]
                );
            }

            return res.json({ success: true });
        } catch (e) {
            console.error("❌ PATCH /api/admin/messages/:id error:", e);
            return res.status(500).json({ error: "Server error" });
        }
    });
};
