const { pool } = require("../../../../database/database.js");
const { sendOk, sendError } = require("../../../../utils/response");
const { logError } = require("../../../../utils/log");
const { parseIdParam } = require("../../../../utils/parse");

module.exports = async function updateMember(req, res) {
    const memberId = parseIdParam(req, "mid");
    if (!memberId) return sendError(res, 400, "Invalid id");
    const { name, student_number } = req.body;

    try {
        await pool.execute(`
            UPDATE group_members
            SET name = ?, student_number = ?
            WHERE id = ?
        `, [name, student_number, memberId]);

        return sendOk(res);

    } catch (err) {
        logError("Admin update member", err);
        return sendError(res, 500, "Server error");
    }
};
