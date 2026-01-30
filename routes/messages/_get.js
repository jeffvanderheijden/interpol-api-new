const { pool } = require("./../../database/database.js");

module.exports = async function getHandler(req, res) {
    const user = req.session?.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    try {
        const [rows] = await pool.execute(
            `
      SELECT id, title, body, media_type, media_url, created_at
      FROM messages
      ORDER BY created_at DESC, id DESC
      `
        );

        return res.json({ success: true, messages: rows });
    } catch (err) {
        console.error("❌ GET /api/messages error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
            details: err.message,
        });
    }
};
