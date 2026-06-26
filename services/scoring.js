const { getChallengeById } = require("./challengeCatalog");

const TUTORIAL_POINTS = 100;

async function ensureManualGroupScoring(executor) {
    const [manualPointsColumns] = await executor.execute(
        `SHOW COLUMNS FROM groups LIKE 'manual_points'`
    );
    if (manualPointsColumns.length === 0) {
        await executor.execute(
            `ALTER TABLE groups ADD COLUMN manual_points INT NOT NULL DEFAULT 0`
        );
    }

    const [manualNotesColumns] = await executor.execute(
        `SHOW COLUMNS FROM groups LIKE 'manual_points_note'`
    );
    if (manualNotesColumns.length === 0) {
        await executor.execute(
            `ALTER TABLE groups ADD COLUMN manual_points_note TEXT DEFAULT NULL`
        );
    }
}

async function ensureScoringTables(executor) {
    await ensureManualGroupScoring(executor);

    await executor.execute(`
        CREATE TABLE IF NOT EXISTS student_tutorial_progress (
            id INT NOT NULL AUTO_INCREMENT,
            student_number VARCHAR(16) NOT NULL,
            completed_at DATETIME DEFAULT NULL,
            points INT NOT NULL DEFAULT 100,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_student_tutorial (student_number)
        )
    `);

    await executor.execute(`
        CREATE TABLE IF NOT EXISTS student_challenge_scores (
            id INT NOT NULL AUTO_INCREMENT,
            student_number VARCHAR(16) NOT NULL,
            challenge_id INT NOT NULL,
            started_at DATETIME DEFAULT NULL,
            completed_at DATETIME DEFAULT NULL,
            duration_seconds INT DEFAULT NULL,
            points INT DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_student_challenge (student_number, challenge_id),
            KEY idx_challenge_id (challenge_id),
            CONSTRAINT fk_student_challenge_scores_challenge
                FOREIGN KEY (challenge_id) REFERENCES challenges (id) ON DELETE CASCADE
        )
    `);
}

function calculateChallengePoints({ minimumPoints, timeLimit, durationSeconds }) {
    const basePoints = Number(minimumPoints) || 0;
    const maxPoints = basePoints * 2;

    if (basePoints <= 0) {
        return 0;
    }

    if (!timeLimit || timeLimit <= 0) {
        return basePoints;
    }

    const duration = Math.max(0, Number(durationSeconds) || 0);

    if (duration >= timeLimit) {
        return basePoints;
    }

    const ratio = 1 - duration / timeLimit;
    return Math.round(basePoints + ratio * (maxPoints - basePoints));
}

async function completeTutorial(executor, studentNumber) {
    await ensureScoringTables(executor);

    await executor.execute(
        `
        INSERT INTO student_tutorial_progress (
            student_number,
            completed_at,
            points
        )
        VALUES (?, NOW(), ?)
        ON DUPLICATE KEY UPDATE
            completed_at = COALESCE(completed_at, VALUES(completed_at)),
            points = VALUES(points)
        `,
        [studentNumber, TUTORIAL_POINTS]
    );

    return { points: TUTORIAL_POINTS };
}

async function startChallenge(executor, studentNumber, challengeId) {
    await ensureScoringTables(executor);

    await executor.execute(
        `
        INSERT INTO student_challenge_scores (
            student_number,
            challenge_id,
            started_at
        )
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            started_at = COALESCE(started_at, VALUES(started_at))
        `,
        [studentNumber, challengeId]
    );
}

async function completeChallenge(executor, studentNumber, challengeId) {
    await ensureScoringTables(executor);

    const definition = getChallengeById(challengeId);
    if (!definition) {
        throw new Error("Unknown challenge");
    }

    const [existingRows] = await executor.execute(
        `
        SELECT started_at, completed_at, duration_seconds, points
        FROM student_challenge_scores
        WHERE student_number = ?
          AND challenge_id = ?
        LIMIT 1
        `,
        [studentNumber, challengeId]
    );

    const existing = existingRows[0];
    if (existing?.completed_at && existing?.points !== null) {
        return {
            challengeId,
            points: Number(existing.points) || 0,
            durationSeconds: existing.duration_seconds || null,
            alreadyCompleted: true,
        };
    }

    const startTime = existing?.started_at ? new Date(existing.started_at) : new Date();
    const now = new Date();
    const durationSeconds = Math.max(
        0,
        Math.round((now.getTime() - startTime.getTime()) / 1000)
    );
    const points = calculateChallengePoints({
        minimumPoints: definition.minimumPoints,
        timeLimit: definition.timeLimit,
        durationSeconds,
    });

    await executor.execute(
        `
        INSERT INTO student_challenge_scores (
            student_number,
            challenge_id,
            started_at,
            completed_at,
            duration_seconds,
            points
        )
        VALUES (?, ?, COALESCE(?, NOW()), NOW(), ?, ?)
        ON DUPLICATE KEY UPDATE
            started_at = COALESCE(started_at, VALUES(started_at)),
            completed_at = COALESCE(completed_at, VALUES(completed_at)),
            duration_seconds = COALESCE(duration_seconds, VALUES(duration_seconds)),
            points = COALESCE(points, VALUES(points))
        `,
        [studentNumber, challengeId, existing?.started_at || null, durationSeconds, points]
    );

    return {
        challengeId,
        points,
        durationSeconds,
        alreadyCompleted: false,
    };
}

module.exports = {
    TUTORIAL_POINTS,
    calculateChallengePoints,
    completeChallenge,
    completeTutorial,
    ensureManualGroupScoring,
    ensureScoringTables,
    startChallenge,
};
