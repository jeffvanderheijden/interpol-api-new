const { pool } = require("./../../database/database.js");
const { sendOk, sendError } = require("./../../utils/response");
const { parseIdParam } = require("./../../utils/parse");
const { logError } = require("./../../utils/log");

module.exports = async function getHandler(req, res) {
    const groupId = parseIdParam(req, "id");

    // Geen groupId → fout
    if (!groupId) {
        return sendError(res, 400, "Invalid team id");
    }

    // Security: studenten mogen ALLEEN hun eigen team-dashboard bekijken
    try {
        const user = req.session?.user;

        if (!user) {
            return sendError(res, 401, "Unauthorized");
        }

        // STUDENT → check of route teamId gelijk is aan session teamId
        if (user.role === "student") {
            const sessionTeamId = Number(user.teamId);

            if (sessionTeamId !== groupId) {
                return sendError(res, 403, "Forbidden");
            }
        }

        // DOCENT → volledige toegang (geen restricties)
    } catch (authErr) {
        logError("Auth error", authErr);
        return sendError(res, 500, "Server error");
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
            return sendError(res, 404, "Team not found");
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
        // 5. Challenges ophalen
        // ---------------------------
        const [challenges] = await pool.execute(
            `
            SELECT 
                gc.challenge_id,
                gc.completed,
                gc.points,
                gc.point_deduction,
                c.name
            FROM group_challenges gc
            JOIN challenges c ON c.id = gc.challenge_id
            WHERE gc.group_id = ?
            ORDER BY gc.challenge_id ASC
            `,
            [groupId]
        );

        return sendOk(res, { team, members, challenges });

    } catch (err) {
        logError("GET /api/groups/:id", err);
        return sendError(res, 500, "Server error");
    }
};
