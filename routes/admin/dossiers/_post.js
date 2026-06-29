const { pool } = require("./../../../database/database.js");
const { ensureDossiersTable } = require("./../../../services/dossiers");
const { upload, getImageUrl } = require("./_upload");
const { parseBooleanFlag } = require("./_shared");
const { normalizeOptionalUrl } = require("./../../../utils/media");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function postHandler(req, res) {
    const run = async () => {
        try {
            await ensureDossiersTable(pool);

            const name = String(req.body.name || "").trim();
            const description = String(req.body.description || "").trim();
            const is_suspect = parseBooleanFlag(req.body.is_suspect, 1);
            const is_eliminated = parseBooleanFlag(req.body.is_eliminated, 0);
            const image_url = getImageUrl(req.file);
            const video_url = normalizeOptionalUrl(req.body.video_url);

            if (!name) return sendError(res, 400, "Name is required");

            await pool.execute(
                `
                INSERT INTO dossiers (name, description, image_url, video_url, is_suspect, is_eliminated)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    name,
                    description || null,
                    image_url,
                    video_url,
                    is_suspect,
                    is_eliminated,
                ]
            );

            return sendOk(res);
        } catch (e) {
            if (e && e.code === "ER_DUP_ENTRY") {
                return sendError(res, 409, "A dossier with this name already exists");
            }

            logError("POST /api/admin/dossiers", e);
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
