const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");

module.exports = async function postHandler(req, res) {
    upload.single("media")(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();

            if (!title) return res.status(400).json({ error: "Title is required" });
            if (!body) return res.status(400).json({ error: "Body is required" });

            const { media_type, media_url } = getMediaInfo(req.file);

            await pool.execute(
                `INSERT INTO messages (title, body, media_type, media_url) VALUES (?, ?, ?, ?)`,
                [title, body, media_type, media_url]
            );

            return res.json({ success: true });
        } catch (e) {
            console.error("❌ POST /api/admin/messages error:", e);
            return res.status(500).json({ error: "Server error" });
        }
    });
};
