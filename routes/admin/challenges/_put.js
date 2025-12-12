const { pool } = require("./../../../database/database.js");

module.exports = async function putHandler(req, res) {
    const { id } = req.params; // challenge_id
    const { className, is_open } = req.body;

    if (!className || typeof is_open !== "boolean") {
        return res.status(400).json({ error: "className en is_open verplicht" });
    }

    try {
        await pool.execute(
            `
            INSERT INTO class_challenges (challenge_id, class, is_open)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_open = ?
            `,
            [id, className, is_open ? 1 : 0, is_open ? 1 : 0]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Admin PUT challenge error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
