const { pool } = require("./../../../database/database.js");
const { ensureDossiersTable } = require("./../../../services/dossiers");
const { upload, getImageUrl } = require("./_upload");
const { safeUnlinkFromImageUrl } = require("./_files");
const { parseBooleanFlag } = require("./_shared");
const { parseIdParam } = require("./../../../utils/parse");
const { normalizeOptionalUrl } = require("./../../../utils/media");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function patchHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");

    const run = async () => {
        try {
            await ensureDossiersTable(pool);

            const name = String(req.body.name || "").trim();
            const description = String(req.body.description || "").trim();

            if (!name) return sendError(res, 400, "Name is required");

            const [rows] = await pool.execute(
                `SELECT image_url, video_url, is_suspect, is_eliminated FROM dossiers WHERE id = ?`,
                [id]
            );

            if (rows.length === 0) return sendError(res, 404, "Dossier not found");

            const current = rows[0];
            const image_url = req.file ? getImageUrl(req.file) : current.image_url;
            const hasVideoUrlField = Object.prototype.hasOwnProperty.call(req.body, "video_url");
            const video_url = hasVideoUrlField
                ? normalizeOptionalUrl(req.body.video_url)
                : current.video_url;
            const is_suspect = parseBooleanFlag(req.body.is_suspect, current.is_suspect ? 1 : 0);
            const is_eliminated = parseBooleanFlag(
                req.body.is_eliminated,
                current.is_eliminated ? 1 : 0
            );

            await pool.execute(
                `
                UPDATE dossiers
                SET name = ?, description = ?, image_url = ?, video_url = ?, is_suspect = ?, is_eliminated = ?
                WHERE id = ?
                `,
                [
                    name,
                    description || null,
                    image_url,
                    video_url,
                    is_suspect,
                    is_eliminated,
                    id,
                ]
            );

            if (req.file && current.image_url && current.image_url !== image_url) {
                safeUnlinkFromImageUrl(current.image_url);
            }

            return sendOk(res);
        } catch (e) {
            if (e && e.code === "ER_DUP_ENTRY") {
                return sendError(res, 409, "A dossier with this name already exists");
            }

            logError("PATCH /api/admin/dossiers/:id", e);
            return sendError(res, 500, "Server error");
        }
    };

    const contentType = String(req.headers["content-type"] || "");
    if (contentType.includes("multipart/form-data")) {
        return upload.single("image")(req, res, (err) => {
            if (err) return sendError(res, 400, err.message || "Upload failed");
            return run();
        });
    }

    return run();
};
