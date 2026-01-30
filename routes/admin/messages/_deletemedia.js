const { pool } = require("./../../../database/database.js");
const { safeUnlinkFromMediaUrl } = require("./_files");

module.exports = async function deleteMediaHandler(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    try {
        const [rows] = await pool.execute(`SELECT media_url FROM messages WHERE id = ?`, [id]);
        if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

        const oldMediaUrl = rows[0].media_url;

        await pool.execute(
            `UPDATE messages SET media_type = 'none', media_url = NULL WHERE id = ?`,
            [id]
        );

        safeUnlinkFromMediaUrl(oldMediaUrl);

        return res.json({ success: true });
    } catch (err) {
        console.error("❌ DELETE /api/admin/messages/:id/media error:", err);
        return res.status(500).json({ success: false, error: "Server error", details: err.message });
    }
};
