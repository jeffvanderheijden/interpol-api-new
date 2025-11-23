const { pool } = require("../../../database/database.js");

module.exports = async function deleteHandler(req, res) {
    const { id } = req.params;

    try {
        await pool.execute(
            `DELETE FROM groups WHERE id = ?`,
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Admin DELETE group error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
