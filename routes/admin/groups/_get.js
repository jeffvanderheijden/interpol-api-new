const { pool } = require("../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        const [groups] = await pool.execute(`
            SELECT 
                g.id,
                g.name,
                g.class,
                g.image_url,
                COUNT(m.id) AS memberCount
            FROM groups g
            LEFT JOIN group_members m ON m.group_id = g.id
            GROUP BY g.id
            ORDER BY g.id DESC
        `);

        res.json({ success: true, groups });

    } catch (err) {
        console.error("❌ Admin GET /groups error:", err);
        res.status(500).json({
            success: false,
            error: "Server error",
            details: err.message
        });
    }
};
