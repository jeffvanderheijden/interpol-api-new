// routes/groups/_post.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("./../../database/database.js");

module.exports = async function postHandler(req, res) {
    const { teamPhoto, members } = req.body;

    if (!teamPhoto || !members || members.length < 3) {
        return res.status(400).json({ error: "Invalid team data" });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // ------------------------------------------
        // 1. FOTO OPSLAAN
        // ------------------------------------------
        const base64 = teamPhoto.replace(/^data:image\/\w+;base64,/, "");
        const fileName = `group_${Date.now()}.png`;

        // Absoluut pad voor Plesk
        const uploadRoot = path.join(__dirname, "../../uploads/groups");

        if (!fs.existsSync(uploadRoot)) {
            fs.mkdirSync(uploadRoot, { recursive: true });
        }

        // Lokaal opslaan
        const filePath = path.join(uploadRoot, fileName);
        fs.writeFileSync(filePath, base64, "base64");

        // Publieke URL die in DB moet
        // API_BASE_URL moet in .env staan
        const baseUrl = process.env.API_BASE_URL || "https://api.heijden.sd-lab.nl";

        const publicUrl = `${baseUrl}/uploads/groups/${fileName}`;

        // ------------------------------------------
        // 2. GROUP AANMAKEN
        // ------------------------------------------
        const groupName = `Team_${Math.floor(Math.random() * 9000 + 1000)}`;

        const [groupRes] = await connection.execute(
            `INSERT INTO groups (name, image_url, class, created_at)
             VALUES (?, ?, NULL, NOW())`,
            [groupName, publicUrl]
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
        // 4. CHALLENGES OPHALEN
        // ------------------------------------------
        const [challenges] = await connection.execute(
            `SELECT id FROM challenges WHERE is_active = 1`
        );

        // ------------------------------------------
        // 5. group_challenges aanmaken
        // ------------------------------------------
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

        return res.json({
            success: true,
            id: groupId,
            name: groupName,
            image_url: publicUrl
        });

    } catch (err) {
        console.error("❌ POST /api/groups ERROR:", err);
        if (connection) {
            try { await connection.rollback(); }
            catch (rbErr) { console.error("❌ ROLLBACK ERROR:", rbErr); }
        }

        return res.status(500).json({
            error: err.message,
            stack: err.stack,
            sql: err.sql,
            sqlMessage: err.sqlMessage
        });
    } finally {
        if (connection) connection.release();
    }
};
