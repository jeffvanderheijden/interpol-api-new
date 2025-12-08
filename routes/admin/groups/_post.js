const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("./../../../database/database.js");

module.exports = async function postHandler(req, res) {
    const { teamPhoto, teamName, className, members } = req.body;

    // ------------------------------------------
    // VALIDATIE
    // ------------------------------------------
    if (!teamPhoto) {
        return res.status(400).json({ error: "Teamfoto ontbreekt." });
    }
    if (!teamName || !teamName.trim()) {
        return res.status(400).json({ error: "Teamnaam ontbreekt." });
    }
    if (!className || !className.trim()) {
        return res.status(400).json({ error: "Klas ontbreekt." });
    }
    if (!Array.isArray(members) || members.length < 3) {
        return res.status(400).json({ error: "Minimaal 3 teamleden vereist." });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // ------------------------------------------
        // 1. FOTO OPSLAAN (GEFIXT & CONSISTENT)
        // ------------------------------------------
        const base64 = teamPhoto.split(",")[1];
        const fileName = `group_${Date.now()}.png`;

        const uploadRoot = path.join(process.cwd(), "uploads/groups");

        if (!fs.existsSync(uploadRoot)) {
            fs.mkdirSync(uploadRoot, { recursive: true });
        }

        const fullPath = path.join(uploadRoot, fileName);
        fs.writeFileSync(fullPath, base64, "base64");

        const baseUrl = process.env.API_BASE_URL || "https://api.heijden.sd-lab.nl";
        const publicUrl = `${baseUrl}/uploads/groups/${fileName}`;

        // ------------------------------------------
        // 2. TEAM AANMAKEN
        // ------------------------------------------
        const [groupRes] = await connection.execute(
            `INSERT INTO groups (name, class, image_url, created_at)
             VALUES (?, ?, ?, NOW())`,
            [teamName, className, publicUrl]
        );

        const groupId = groupRes.insertId;

        // ------------------------------------------
        // 3. TEAMLEDEN OPSLAAN
        // ------------------------------------------
        for (const m of members) {
            await connection.execute(
                `INSERT INTO group_members (group_id, name, student_number)
                 VALUES (?, ?, ?)`,
                [groupId, m.name, m.number]
            );
        }

        // ------------------------------------------
        // 4. ACTIEVE CHALLENGES KOPPELEN
        // ------------------------------------------
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

        await connection.commit();

        // ------------------------------------------
        // 5. RETURN (INCL. DEBUG INFO)
        // ------------------------------------------
        return res.json({
            success: true,
            id: groupId,
            name: teamName,
            class: className,
            image_url: publicUrl,

            savedFilePath: fullPath,
            savedPublicUrl: publicUrl
        });

    } catch (err) {
        console.error("Admin POST /groups ERROR:", err);

        if (connection) {
            try { await connection.rollback(); }
            catch (rbErr) { console.error("Rollback error:", rbErr); }
        }

        return res.status(500).json({
            error: err.message,
            sql: err.sql,
            sqlMessage: err.sqlMessage
        });
    } finally {
        if (connection) connection.release();
    }
};
