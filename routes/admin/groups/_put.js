const { pool } = require("../../../database/database.js");

module.exports = async function putHandler(req, res) {
    const { id } = req.params;
    const { name, className } = req.body;

    if (!name || !className) {
        return res.status(400).json({ error: "Naam en klas zijn verplicht." });
    }

    try {
        await pool.execute(
            `UPDATE groups SET name = ?, class = ? WHERE id = ?`,
            [name, className, id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Admin PUT group error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
