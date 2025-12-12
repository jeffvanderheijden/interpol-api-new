const { pool } = require("./../../../database/database.js");

module.exports = async function putHandler(req, res) {
    const { id } = req.params; // challengeId
    const { className, is_open } = req.body;

    if (!className || typeof className !== "string") {
        return res.status(400).json({ error: "className is verplicht." });
    }
    if (typeof is_open !== "boolean") {
        return res.status(400).json({ error: "is_open moet true/false zijn." });
    }

    try {
        // Upsert: bestaat record al? update, anders insert
        await pool.execute(
            `
            INSERT INTO class_challenges (class, challenge_id, is_open)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_open = VALUES(is_open)
            `,
            [className, Number(id), is_open ? 1 : 0]
        );

        return res.json({ success: true });
    } catch (err) {
        console.error("❌ Admin PUT /challenges/:id error:", err);
        return res.status(500).json({
            error: err.message,
            code: err.code,
            sql: err.sql
        });
    }
};
