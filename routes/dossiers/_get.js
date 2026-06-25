const { pool } = require("./../../database/database.js");
const { ensureDossiersTable } = require("./../../services/dossiers");
const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");

module.exports = async function getHandler(req, res) {
    const user = req.session?.user;
    if (!user) return sendError(res, 401, "Unauthorized");

    try {
        await ensureDossiersTable(pool);

        const [rows] = await pool.execute(
            `
            SELECT
                id,
                name,
                description,
                image_url,
                is_suspect,
                is_eliminated,
                sort_order,
                created_at,
                updated_at
            FROM dossiers
            ORDER BY sort_order ASC, name ASC, id ASC
            `
        );

        return sendOk(res, { dossiers: rows });
    } catch (err) {
        logError("GET /api/dossiers", err);
        return sendError(res, 500, "Server error");
    }
};
