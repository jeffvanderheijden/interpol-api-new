const { pool } = require("./../../../database/database.js");

module.exports = async function postHandler(req, res) {
    const { name, className } = req.body;

    if (!name || !className) {
        return res.status(400).json({ error: "Naam en klas zijn verplicht." });
    }

    try {
        const [result] = await pool.execute(
            `INSERT INTO groups (name, class, created_at)
             VALUES (?, ?, NOW())`,
            [name, className]
        );

        res.json({
            success: true,
            id: result.insertId
        });
    } catch (err) {
        console.error("Admin POST group error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
