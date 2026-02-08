const { pool } = require("./../../../database/database.js");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function getHandler(req, res) {
    try {
        const [rows] = await pool.execute(
            `
      SELECT id, title, body, media_type, media_url, publish_at, created_at, updated_at
      FROM messages
      ORDER BY created_at DESC, id DESC
      `
        );
        return sendOk(res, { messages: rows });
    } catch (err) {
        logError("GET /api/admin/messages", err);
        return sendError(res, 500, "Server error");
    }
};
