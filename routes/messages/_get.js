const { pool } = require("./../../database/database.js");
const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");

module.exports = async function getHandler(req, res) {
    const user = req.session?.user;
    if (!user) return sendError(res, 401, "Unauthorized");

    try {
        const [rows] = await pool.execute(
            `
            SELECT id, title, body, media_type, media_url, publish_at, created_at
            FROM messages
            WHERE publish_at IS NULL OR publish_at <= NOW()
            ORDER BY publish_at DESC, created_at DESC, id DESC
            `
        );

        return sendOk(res, { messages: rows });
    } catch (err) {
        logError("GET /api/messages", err);
        return sendError(res, 500, "Server error");
    }
};
