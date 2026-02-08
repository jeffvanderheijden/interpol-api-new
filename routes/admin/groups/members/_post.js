const { pool } = require("../../../../database/database.js");
const { sendOk, sendError } = require("../../../../utils/response");
const { logError } = require("../../../../utils/log");
const { parseIdParam } = require("../../../../utils/parse");

module.exports = async function addMember(req, res) {
    const groupId = parseIdParam(req, "id");
    if (!groupId) return sendError(res, 400, "Invalid id");
    const { name, student_number } = req.body;

    try {
        const [r] = await pool.execute(`
            INSERT INTO group_members (group_id, name, student_number)
            VALUES (?, ?, ?)
        `, [groupId, name, student_number]);

        return sendOk(res, {
            member: {
                id: r.insertId,
                name,
                student_number
            }
        });
    } catch (err) {
        logError("Admin add member", err);
        return sendError(res, 500, "Server error");
    }
};
