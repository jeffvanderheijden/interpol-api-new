import fs from "fs";
import path from "path";
import crypto from "crypto";
import { pool } from "../../db.js";

export default async function postHandler(req, res) {
    const { teamPhoto, members } = req.body;

    if (!teamPhoto || !members || members.length < 3) {
        return res.status(400).json({ error: "Invalid team data" });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // ----------------------------------------
        // 1. FOTO OPSLAAN
        // ----------------------------------------
        const base64 = teamPhoto.replace(/^data:image\/\w+;base64,/, "");
        const fileName = `group_${Date.now()}.png`;
        const folder = path.join("uploads", "groups");

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }

        const filePath = path.join(folder, fileName);
        fs.writeFileSync(filePath, base64, "base64");

        // ----------------------------------------
        // 2. GROUP AANMAKEN
        // name is verplicht → dus genereren we er één
        // ----------------------------------------
        const groupName = `Team_${Math.floor(Math.random() * 9000 + 1000)}`;

        const [groupRes] = await connection.execute(
            `INSERT INTO groups (name, image_url, class, created_at)
             VALUES (?, ?, NULL, NOW())`,
            [groupName, filePath]
        );

        const groupId = groupRes.insertId;

        // ----------------------------------------
        // 3. TEAMLEDEN OPSLAAN
        // ----------------------------------------
        for (const m of members) {
            await connection.execute(
                `INSERT INTO group_members (group_id, name, student_number)
                 VALUES (?, ?, ?)`,
                [groupId, m.name, m.number]
            );
        }

        // ----------------------------------------
        // 4. CHALLENGES OPHALEN
        // ----------------------------------------
        const [challenges] = await connection.execute(
            `SELECT id FROM challenges WHERE is_active = 1`
        );

        // ----------------------------------------
        // 5. KOPPELEN VIA group_challenges
        // ----------------------------------------
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
            image_url: filePath
        });

    } catch (err) {
        console.error(err);
        await connection.rollback();
        return res.status(500).json({ error: "Internal server error" });
    } finally {
        connection.release();
    }
}
