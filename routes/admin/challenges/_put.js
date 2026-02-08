const { pool } = require("./../../../database/database.js");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");
const { parseIdParam } = require("./../../../utils/parse");

module.exports = async function putHandler(req, res) {
    const id = parseIdParam(req, "id"); // challengeId
    if (!id) return sendError(res, 400, "Invalid id");
    const { class_name, is_open } = req.body;

    if (!class_name || typeof class_name !== "string") {
        return sendError(res, 400, "class_name is verplicht.");
    }
    if (typeof is_open !== "boolean") {
        return sendError(res, 400, "is_open moet true/false zijn.");
    }

    try {
        // Upsert: bestaat record al? update, anders insert
        await pool.execute(
            `
            INSERT INTO class_challenges (class, challenge_id, is_open)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE is_open = VALUES(is_open)
            `,
            [class_name, id, is_open ? 1 : 0]
        );

        return sendOk(res);
    } catch (err) {
        logError("Admin PUT /challenges/:id", err);
        return sendError(res, 500, "Server error");
    }
};
