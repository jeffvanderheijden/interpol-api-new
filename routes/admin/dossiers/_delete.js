const { pool } = require("./../../../database/database.js");
const { ensureDossiersTable } = require("./../../../services/dossiers");
const { safeUnlinkFromImageUrl } = require("./_files");
const { parseIdParam } = require("./../../../utils/parse");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function deleteHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");

    try {
        await ensureDossiersTable(pool);

        const [rows] = await pool.execute(
            `SELECT image_url FROM dossiers WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) return sendError(res, 404, "Dossier not found");

        await pool.execute(`DELETE FROM dossiers WHERE id = ?`, [id]);
        safeUnlinkFromImageUrl(rows[0].image_url);

        return sendOk(res);
    } catch (err) {
        logError("DELETE /api/admin/dossiers/:id", err);
        return sendError(res, 500, "Server error");
    }
};
