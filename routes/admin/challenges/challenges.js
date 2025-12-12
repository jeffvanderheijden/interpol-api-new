const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        // 1. Alle challenges
        const [challenges] = await pool.execute(
            `
            SELECT 
                c.id,
                c.name,
                c.description
            FROM challenges c
            ORDER BY c.id
            `
        );

        // 2. Alle klassen (uit bestaande groups)
        const [classes] = await pool.execute(
            `
            SELECT DISTINCT \`class\`
            FROM groups
            ORDER BY \`class\`
            `
        );

        // 3. Open/gesloten status per klas
        const [classChallenges] = await pool.execute(
            `
            SELECT 
                challenge_id,
                \`class\`,
                is_open
            FROM class_challenges
            `
        );

        return res.json({
            success: true,
            challenges,
            classes,
            classChallenges
        });

    } catch (err) {
        console.error("❌ ADMIN CHALLENGES GET ERROR");
        console.error(err);

        return res.status(500).json({
            error: err.message,
            code: err.code,
            sql: err.sql
        });
    }
};
