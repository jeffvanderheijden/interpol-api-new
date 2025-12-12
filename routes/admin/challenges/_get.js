const { pool } = require("./../../../database/database.js");

module.exports = async function getHandler(req, res) {
    try {
        const debug = {};

        // 1. Test: challenges
        const [challenges] = await pool.execute(
            "SELECT id, title FROM challenges"
        );
        debug.challenges = challenges.length;

        // 2. Test: classes uit groups
        const [classes] = await pool.execute(
            "SELECT DISTINCT `class` FROM groups"
        );
        debug.classes = classes.map(c => c.class);

        // 3. Test: class_challenges
        const [states] = await pool.execute(
            "SELECT challenge_id, `class`, is_open FROM class_challenges"
        );
        debug.states = states.length;

        return res.json({
            success: true,
            debug,
            challenges,
            classes,
            states
        });

    } catch (err) {
        console.error("❌ ADMIN CHALLENGES GET ERROR");
        console.error(err);

        return res.status(500).json({
            error: err.message,
            code: err.code,
            sql: err.sql,
            stack: err.stack
        });
    }
};
