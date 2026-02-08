const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("./../../../database/database.js");
const { config } = require("./../../../config");
const { withTransaction } = require("./../../../utils/db");
const { sendOk, sendError } = require("./../../../utils/response");
const { isNonEmptyString } = require("./../../../utils/validate");
const { logError } = require("./../../../utils/log");

module.exports = async function postHandler(req, res) {
    const { teamPhoto, teamName, className, members } = req.body;

    // ------------------------------------------
    // VALIDATIE
    // ------------------------------------------
    if (!teamPhoto) {
        return sendError(res, 400, "Teamfoto ontbreekt.");
    }
    if (!isNonEmptyString(teamName)) {
        return sendError(res, 400, "Teamnaam ontbreekt.");
    }
    if (!isNonEmptyString(className)) {
        return sendError(res, 400, "Klas ontbreekt.");
    }
    if (!Array.isArray(members) || members.length < 3) {
        return sendError(res, 400, "Minimaal 3 teamleden vereist.");
    }

    try {
        const { groupId, publicUrl } = await withTransaction(pool, async (connection) => {
            // 1. FOTO OPSLAAN
            const base64 = teamPhoto.split(",")[1];
            const fileName = `group_${Date.now()}.png`;
            const uploadRoot = config.uploadsGroupsDir;

            if (!fs.existsSync(uploadRoot)) {
                fs.mkdirSync(uploadRoot, { recursive: true });
            }

            const fullPath = path.join(uploadRoot, fileName);
            fs.writeFileSync(fullPath, base64, "base64");

            const publicUrl = `${config.apiBaseUrl}/uploads/groups/${fileName}`;

            // 2. TEAM AANMAKEN
            const [groupRes] = await connection.execute(
                `INSERT INTO groups (name, class, image_url, created_at)
                 VALUES (?, ?, ?, NOW())`,
                [teamName, className, publicUrl]
            );

            const groupId = groupRes.insertId;

            // 3. TEAMLEDEN OPSLAAN
            for (const m of members) {
                await connection.execute(
                    `INSERT INTO group_members (group_id, name, student_number)
                     VALUES (?, ?, ?)`,
                    [groupId, m.name, m.number]
                );
            }

            // 4. ACTIEVE CHALLENGES KOPPELEN
            const [challenges] = await connection.execute(
                `SELECT id FROM challenges WHERE is_active = 1`
            );

            for (const c of challenges) {
                const keycode = crypto.randomBytes(8).toString("hex");

                await connection.execute(
                    `INSERT INTO group_challenges
                        (group_id, challenge_id, completed, points, point_deduction, keycode)
                     VALUES (?, ?, 0, NULL, 0, ?)`,
                    [groupId, c.id, keycode]
                );
            }

            return { groupId, publicUrl };
        });

        return sendOk(res, {
            id: groupId,
            name: teamName,
            class: className,
            image_url: publicUrl,
        });

    } catch (err) {
        logError("Admin POST /groups", err);
        return sendError(res, 500, "Server error");
    }
};
