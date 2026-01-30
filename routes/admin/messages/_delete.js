const fs = require("fs");
const path = require("path");
const { pool } = require("./../../../database/database.js");

function safeUnlinkFromMediaUrl(mediaUrl) {
    if (!mediaUrl) return;
    const prefix = "/uploads/messages/";
    if (!mediaUrl.startsWith(prefix)) return;

    const filename = mediaUrl.slice(prefix.length);
    const abs = path.join(process.cwd(), "uploads", "messages", filename);
    fs.unlink(abs, () => { });
}

module.exports = async function deleteHandler(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });

    try {
        const [rows] = await pool.execute(
            `SELECT media_url FROM messages WHERE id = ?`,
            [id]
        );
        if (rows.length === 0) return res.status(404).json({ error: "Message not found" });

        const mediaUrl = rows[0].media_url;

        await pool.execute(`DELETE FROM messages WHERE id = ?`, [id]);

        safeUnlinkFromMediaUrl(mediaUrl);

        return res.json({ success: true });
    } catch (err) {
        console.error("❌ DELETE /api/admin/messages/:id error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
            details: err.message,
        });
    }
};
