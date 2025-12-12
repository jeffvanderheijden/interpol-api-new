const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        // 1. Alle challenges
        const [challenges] = await pool.execute(`
            SELECT id, title, description
            FROM challenges
            ORDER BY id ASC
        `);

        // 2. Alle klassen (uit bestaande teams)
        const [classes] = await pool.execute(`
            SELECT DISTINCT \`class\`
            FROM groups
            ORDER BY \`class\` ASC
        `);

        // 3. Open/dicht status per klas
        const [states] = await pool.execute(`
            SELECT 
                challenge_id, 
                \`class\`, 
                is_open
            FROM class_challenges
        `);

        // 4. Lookup map
        const stateMap = {};
        for (const s of states) {
            stateMap[`${s.challenge_id}_${s.class}`] = s.is_open === 1;
        }

        // 5. Combineer alles
        const result = challenges.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            classes: classes.map((cl) => ({
                class: cl.class,
                is_open: stateMap[`${c.id}_${cl.class}`] || false
            }))
        }));

        return res.json({
            success: true,
            challenges: result
        });

    } catch (err) {
        console.error("❌ Admin GET /challenges error:");
        console.error(err);

        return res.status(500).json({
            error: "Server error",
            details: err.message,
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined
        });
    }
};
