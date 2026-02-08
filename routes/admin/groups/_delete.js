const { pool } = require("./../../../database/database.js");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");
const { parseIdParam } = require("./../../../utils/parse");

module.exports = async function deleteHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");

    try {
        await pool.execute(
            `DELETE FROM groups WHERE id = ?`,
            [id]
        );

        return sendOk(res);
    } catch (err) {
        logError("Admin DELETE group", err);
        return sendError(res, 500, "Server error");
    }
};
