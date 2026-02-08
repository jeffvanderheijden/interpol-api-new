const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");
const { safeUnlinkFromMediaUrl } = require("./_files");
const { parsePublishAt, parseIdParam } = require("./../../../utils/parse");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function patchHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");

    upload.single("media")(req, res, async (err) => {
        if (err) return sendError(res, 400, err.message || "Upload failed");

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();
            const publish_at = parsePublishAt(req.body.publish_at);

            if (!title) return sendError(res, 400, "Title is required");
            if (!body) return sendError(res, 400, "Body is required");

            const [rows] = await pool.execute(
                `SELECT media_url, publish_at FROM messages WHERE id = ?`,
                [id]
            );
            if (rows.length === 0) return sendError(res, 404, "Message not found");

            const oldMediaUrl = rows[0].media_url;

            // publish_at update alleen als het meegestuurd is
            const nextPublishAt = publish_at !== undefined ? publish_at : rows[0].publish_at;

            if (req.file) {
                const { media_type, media_url } = getMediaInfo(req.file);

                await pool.execute(
                    `UPDATE messages 
                     SET title = ?, body = ?, media_type = ?, media_url = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, media_type, media_url, nextPublishAt, id]
                );

                safeUnlinkFromMediaUrl(oldMediaUrl);
            } else {
                await pool.execute(
                    `UPDATE messages 
                     SET title = ?, body = ?, publish_at = ?
                     WHERE id = ?`,
                    [title, body, nextPublishAt, id]
                );
            }

            return sendOk(res);
        } catch (e) {
            logError("PATCH /api/admin/messages/:id", e);
            return sendError(res, 500, "Server error");
        }
    });
};
