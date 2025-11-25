const { pool } = require("../../../../database/database.js");

module.exports = async function updateMember(req, res) {
    const memberId = Number(req.params.mid);
    const { name, student_number } = req.body;

    try {
        await pool.execute(
            `
            UPDATE group_members
            SET name = ?, student_number = ?
            WHERE id = ?
            `,
            [name, student_number, memberId]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("Admin update member error:", err);
        res.status(500).json({ success: false });
    }
};
