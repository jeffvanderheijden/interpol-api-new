const { pool } = require("../../../database/database.js");

module.exports = async function getHandler(req, res) {
    const groupId = Number(req.params.id);

    // Geen groupId → fout
    if (!groupId) {
        return res.status(400).json({ error: "Invalid team id" });
    }

    // Security: studenten mogen ALLEEN hun eigen team-dashboard bekijken
    try {
        const user = req.session?.user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // STUDENT → check of route teamId gelijk is aan session teamId
        if (user.role === "student") {
            const sessionTeamId = Number(user.teamId);

            if (sessionTeamId !== groupId) {
                return res.status(403).json({
                    error: "Forbidden: cannot access another team's dashboard"
                });
            }
        }

        // DOCENT → volledige toegang (geen restricties)
    } catch (authErr) {
        console.error("Auth error:", authErr);
        return res.status(500).json({ error: "Server error (auth)" });
    }

    // ---------------------------
    // 3. Team info ophalen
    // ---------------------------
    try {
        const [teamRows] = await pool.execute(
            `
            SELECT 
                id,
                name,
                class,
                image_url,
                created_at
            FROM groups
            WHERE id = ?
            `,
            [groupId]
        );

        if (teamRows.length === 0) {
            return res.status(404).json({ error: "Team not found" });
        }

        const team = teamRows[0];

        // ---------------------------
        // 4. Teamleden ophalen
        // ---------------------------
        const [members] = await pool.execute(
            `
            SELECT 
                name,
                student_number
            FROM group_members
            WHERE group_id = ?
            ORDER BY name ASC
            `,
            [groupId]
        );

        // ---------------------------
        // 5. Optioneel: challenges ophalen
        // ---------------------------
        const [challenges] = await pool.execute(
            `
            SELECT 
                gc.challenge_id,
                gc.completed,
                gc.points,
                gc.point_deduction,
                c.title
            FROM group_challenges gc
            JOIN challenges c ON c.id = gc.challenge_id
            WHERE gc.group_id = ?
            ORDER BY gc.challenge_id ASC
            `,
            [groupId]
        );

        return res.json({
            success: true,
            team,
            members,
            challenges
        });

    } catch (err) {
        console.error("❌ GET /api/groups/:id error:", err);
        return res.status(500).json({
            success: false,
            error: "Server error",
            details: err.message
        });
    }
};
