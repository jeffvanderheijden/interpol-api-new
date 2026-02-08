const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");
const { parsePublishAt } = require("./../../../utils/parse");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function postHandler(req, res) {
    upload.single("media")(req, res, async (err) => {
        if (err) return sendError(res, 400, err.message || "Upload failed");

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();
            const publish_at = parsePublishAt(req.body.publish_at, { allowNull: true });

            if (!title) return sendError(res, 400, "Title is required");
            if (!body) return sendError(res, 400, "Body is required");

            const { media_type, media_url } = getMediaInfo(req.file);

            // Als publish_at null is: direct publiceren (NOW()).
            // Wil je liever NULL in de DB? Zeg het, dan switch ik het naar null opslaan.
            const finalPublishAt = publish_at || new Date();

            await pool.execute(
                `INSERT INTO messages (title, body, media_type, media_url, publish_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [title, body, media_type, media_url, finalPublishAt]
            );

            return sendOk(res);
        } catch (e) {
            logError("POST /api/admin/messages", e);
            return sendError(res, 500, "Server error");
        }
    });
};
