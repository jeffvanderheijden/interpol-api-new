const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");
const { safeUnlinkFromMediaUrl } = require("./_files");
const { parsePublishAt, parseIdParam } = require("./../../../utils/parse");
const {
    inferMediaTypeFromUrl,
    normalizeMessageMediaType,
    normalizeOptionalUrl,
} = require("./../../../utils/media");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function patchHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");

    const run = async () => {
        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();
            const publish_at = parsePublishAt(req.body.publish_at);
            const manualMediaUrl = normalizeOptionalUrl(req.body.media_url);
            const manualMediaType = normalizeMessageMediaType(req.body.media_type);
            const clearMedia = String(req.body.clear_media || "").trim() === "1";

            if (!title) return sendError(res, 400, "Title is required");
            if (!body) return sendError(res, 400, "Body is required");
            if (req.file && manualMediaUrl) {
                return sendError(res, 400, "Choose either a file upload or a media URL");
            }
            if (clearMedia && (req.file || manualMediaUrl)) {
                return sendError(res, 400, "Cannot clear and replace media in the same request");
            }

            const [rows] = await pool.execute(
                `SELECT media_type, media_url, publish_at FROM messages WHERE id = ?`,
                [id]
            );
            if (rows.length === 0) return sendError(res, 404, "Message not found");

            const current = rows[0];
            const oldMediaUrl = rows[0].media_url;

            // publish_at update alleen als het meegestuurd is
            const nextPublishAt = publish_at !== undefined ? publish_at : current.publish_at;

            if (req.file) {
                const { media_type, media_url } = getMediaInfo(req.file);

                await pool.execute(
                    `UPDATE messages 
                     SET title = ?, body = ?, media_type = ?, media_url = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, media_type, media_url, nextPublishAt, id]
                );

                safeUnlinkFromMediaUrl(oldMediaUrl);
            } else if (manualMediaUrl) {
                const inferredMediaType = inferMediaTypeFromUrl(manualMediaUrl);
                const resolvedMediaType = manualMediaType || inferredMediaType;

                if (!resolvedMediaType) {
                    return sendError(
                        res,
                        400,
                        "Media type is required when the URL does not clearly end in an image or video file"
                    );
                }

                await pool.execute(
                    `UPDATE messages
                     SET title = ?, body = ?, media_type = ?, media_url = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, resolvedMediaType, manualMediaUrl, nextPublishAt, id]
                );

                if (manualMediaUrl !== oldMediaUrl) {
                    safeUnlinkFromMediaUrl(oldMediaUrl);
                }
            } else if (clearMedia) {
                await pool.execute(
                    `UPDATE messages
                     SET title = ?, body = ?, media_type = 'none', media_url = NULL, publish_at = ?
                     WHERE id = ?`,
                    [title, body, nextPublishAt, id]
                );

                safeUnlinkFromMediaUrl(oldMediaUrl);
            } else {
                await pool.execute(
                    `UPDATE messages 
                     SET title = ?, body = ?, media_type = ?, media_url = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, current.media_type, current.media_url, nextPublishAt, id]
                );
            }

            return sendOk(res);
        } catch (e) {
            logError("PATCH /api/admin/messages/:id", e);
            return sendError(res, 500, "Server error");
        }
    };

    const contentType = String(req.headers["content-type"] || "");
    if (contentType.includes("multipart/form-data")) {
        return upload.single("media")(req, res, (err) => {
            if (err) return sendError(res, 400, err.message || "Upload failed");
            return run();
        });
    }

    return run();
};
