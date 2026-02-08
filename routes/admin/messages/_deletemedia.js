const { pool } = require("./../../../database/database.js");
const { safeUnlinkFromMediaUrl } = require("./_files");
const { parseIdParam } = require("./../../../utils/parse");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function deleteMediaHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");

    try {
        const [rows] = await pool.execute(`SELECT media_url FROM messages WHERE id = ?`, [id]);
        if (rows.length === 0) return sendError(res, 404, "Message not found");

        const oldMediaUrl = rows[0].media_url;

        await pool.execute(
            `UPDATE messages SET media_type = 'none', media_url = NULL WHERE id = ?`,
            [id]
        );

        safeUnlinkFromMediaUrl(oldMediaUrl);

        return sendOk(res);
    } catch (err) {
        logError("DELETE /api/admin/messages/:id/media", err);
        return sendError(res, 500, "Server error");
    }
};
