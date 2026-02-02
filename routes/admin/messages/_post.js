const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");

function parsePublishAt(value) {
    const v = String(value || "").trim();
    if (!v) return null;

    // accepteer zowel "YYYY-MM-DD HH:mm:ss" als "YYYY-MM-DDTHH:mm"
    // mysql kan meestal beide aan, maar we normaliseren T->spatie en voegen :00 toe als nodig
    let normalized = v.replace("T", " ");
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
        normalized = `${normalized}:00`;
    }
    return normalized;
}

module.exports = async function postHandler(req, res) {
    upload.single("media")(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message || "Upload failed" });

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();
            const publish_at = parsePublishAt(req.body.publish_at);

            if (!title) return res.status(400).json({ error: "Title is required" });
            if (!body) return res.status(400).json({ error: "Body is required" });

            const { media_type, media_url } = getMediaInfo(req.file);

            // Als publish_at null is: direct publiceren (NOW()).
            // Wil je liever NULL in de DB? Zeg het, dan switch ik het naar null opslaan.
            const finalPublishAt = publish_at || new Date();

            await pool.execute(
                `INSERT INTO messages (title, body, media_type, media_url, publish_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [title, body, media_type, media_url, finalPublishAt]
            );

            return res.json({ success: true });
        } catch (e) {
            console.error("❌ POST /api/admin/messages error:", e);
            return res.status(500).json({ error: "Server error" });
        }
    });
};
