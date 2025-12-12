const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        const [challenges] = await pool.execute(`
            SELECT id, title, description
            FROM challenges
            ORDER BY id ASC
        `);

        const [classes] = await pool.execute(`
            SELECT DISTINCT class
            FROM groups
            ORDER BY class ASC
        `);

        const [states] = await pool.execute(`
            SELECT challenge_id, class, is_open
            FROM class_challenges
        `);

        const stateMap = {};
        for (const s of states) {
            stateMap[`${s.challenge_id}_${s.class}`] = !!s.is_open;
        }

        const result = challenges.map((c) => ({
            ...c,
            classes: classes.map((cl) => ({
                class: cl.class,
                is_open: stateMap[`${c.id}_${cl.class}`] || false
            }))
        }));

        res.json({ success: true, challenges: result });
    } catch (err) {
        console.error("Admin GET challenges error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
