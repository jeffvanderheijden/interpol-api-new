const fs = require("fs");
const path = require("path");
const { pool } = require("./../../../database/database.js");
const { config } = require("./../../../config");
const { sendOk, sendError } = require("./../../../utils/response");
const { isNonEmptyString } = require("./../../../utils/validate");
const { logError } = require("./../../../utils/log");
const { parseIdParam } = require("./../../../utils/parse");

module.exports = async function putHandler(req, res) {
    const id = parseIdParam(req, "id");
    if (!id) return sendError(res, 400, "Invalid id");
    const { name, className, image_url } = req.body;

    const fields = [];
    const values = [];

    // ------------------------------------------
    // 1. TEAMNAAM & KLAS (partial update)
    // ------------------------------------------
    if (name !== undefined) {
        if (!isNonEmptyString(name)) {
            return sendError(res, 400, "Teamnaam mag niet leeg zijn.");
        }
        fields.push("name = ?");
        values.push(name);
    }

    if (className !== undefined) {
        if (!isNonEmptyString(className)) {
            return sendError(res, 400, "Klas mag niet leeg zijn.");
        }
        fields.push("class = ?");
        values.push(className);
    }

    // ------------------------------------------
    // 2. FOTO UPDATE
    // ------------------------------------------
    if (image_url !== undefined) {
        if (image_url === null) {
            fields.push("image_url = NULL");
        }
        else if (image_url.startsWith("data:image/")) {
            const base64 = image_url.split(",")[1];
            const fileName = `group_${Date.now()}.png`;

            // FIXED PATH!!
            const uploadRoot = config.uploadsGroupsDir;

            if (!fs.existsSync(uploadRoot)) {
                fs.mkdirSync(uploadRoot, { recursive: true });
            }

            const fullPath = path.join(uploadRoot, fileName);

            // Save the file
            fs.writeFileSync(fullPath, base64, "base64");

            const publicUrl = `${config.apiBaseUrl}/uploads/groups/${fileName}`;

            fields.push("image_url = ?");
            values.push(publicUrl);
        }
        else {
            fields.push("image_url = ?");
            values.push(image_url);
        }
    }

    if (fields.length === 0) {
        return sendError(res, 400, "Geen wijzigingen ontvangen.");
    }

    try {
        values.push(id);

        await pool.execute(
            `UPDATE groups SET ${fields.join(", ")} WHERE id = ?`,
            values
        );

        return sendOk(res);

    } catch (err) {
        logError("Admin PUT group", err);
        return sendError(res, 500, "Server error");
    }
};
