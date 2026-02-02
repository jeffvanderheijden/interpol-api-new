const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        const [rows] = await pool.execute(
            `
      SELECT id, title, body, media_type, media_url, publish_at, created_at, updated_at
      FROM messages
      ORDER BY created_at DESC, id DESC
      `
        );
        return res.json({ success: true, messages: rows });
    } catch (err) {
        console.error("❌ GET /api/admin/messages error:", err);
        return res.status(500).json({ success: false, error: "Server error", details: err.message });
    }
};
