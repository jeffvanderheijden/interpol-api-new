const { pool } = require("./../../../database/database.js");
const { upload, getMediaInfo } = require("./_upload");
const { parsePublishAt } = require("./../../../utils/parse");
const {
    inferMediaTypeFromUrl,
    normalizeMessageMediaType,
    normalizeOptionalUrl,
} = require("./../../../utils/media");
const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");

module.exports = async function postHandler(req, res) {
    upload.single("media")(req, res, async (err) => {
        if (err) return sendError(res, 400, err.message || "Upload failed");

        try {
            const title = String(req.body.title || "").trim();
            const body = String(req.body.body || "").trim();
            const publish_at = parsePublishAt(req.body.publish_at, { allowNull: true });
            const manualMediaUrl = normalizeOptionalUrl(req.body.media_url);
            const manualMediaType = normalizeMessageMediaType(req.body.media_type);

            if (!title) return sendError(res, 400, "Title is required");
            if (!body) return sendError(res, 400, "Body is required");

            if (req.file && manualMediaUrl) {
                return sendError(res, 400, "Choose either a file upload or a media URL");
            }

            let media = { media_type: "none", media_url: null };
            if (req.file) {
                media = getMediaInfo(req.file);
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

                media = {
                    media_type: resolvedMediaType,
                    media_url: manualMediaUrl,
                };
            }

            // Als publish_at null is: direct publiceren (NOW()).
            // Wil je liever NULL in de DB? Zeg het, dan switch ik het naar null opslaan.
            const finalPublishAt = publish_at || new Date();

            await pool.execute(
                `INSERT INTO messages (title, body, media_type, media_url, publish_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [title, body, media.media_type, media.media_url, finalPublishAt]
            );

            return sendOk(res);
        } catch (e) {
            logError("POST /api/admin/messages", e);
            return sendError(res, 500, "Server error");
        }
    });
};
