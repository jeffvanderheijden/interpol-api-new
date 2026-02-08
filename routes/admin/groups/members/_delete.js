const { pool } = require("../../../../database/database.js");
const { sendOk, sendError } = require("../../../../utils/response");
const { logError } = require("../../../../utils/log");
const { parseIdParam } = require("../../../../utils/parse");

module.exports = async function deleteMember(req, res) {
    const memberId = parseIdParam(req, "mid");
    if (!memberId) return sendError(res, 400, "Invalid id");

    try {
        await pool.execute(
            `DELETE FROM group_members WHERE id = ?`,
            [memberId]
        );

        return sendOk(res);

    } catch (err) {
        logError("Admin delete member", err);
        return sendError(res, 500, "Server error");
    }
};
