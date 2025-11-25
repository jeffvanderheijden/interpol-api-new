const { pool } = require("../../../../database/database.js");

module.exports = async function deleteMember(req, res) {
    const memberId = Number(req.params.mid);

    try {
        await pool.execute(
            `DELETE FROM group_members WHERE id = ?`,
            [memberId]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("Admin delete member error:", err);
        res.status(500).json({ success: false });
    }
};
