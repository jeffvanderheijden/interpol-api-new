const { pool } = require("../../../../database/database.js");

module.exports = async function addMember(req, res) {
    const groupId = Number(req.params.id);
    const { name, student_number } = req.body;

    try {
        const [r] = await pool.execute(`
            INSERT INTO group_members (group_id, name, student_number)
            VALUES (?, ?, ?)
        `, [groupId, name, student_number]);

        res.json({
            success: true,
            member: {
                id: r.insertId,
                name,
                student_number
            }
        });
    } catch (err) {
        console.error("Admin add member error:", err);
        res.status(500).json({ success: false });
    }
};
