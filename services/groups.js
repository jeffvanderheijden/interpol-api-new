const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { pool } = require("../database/database.js");
const {
    ensureChallengeCatalog,
    getChallengeCatalog,
} = require("./challengeCatalog");
const { config } = require("../config");
const { withTransaction } = require("../utils/db");
const { isNonEmptyString } = require("../utils/validate");

function getStudentNumber(member) {
    if (member?.number !== undefined && member?.number !== null) {
        return String(member.number);
    }

    if (member?.student_number !== undefined && member?.student_number !== null) {
        return String(member.student_number);
    }

    return "";
}

function normalizeMembers(members = []) {
    return members.map((member) => ({
        name: member?.name,
        studentNumber: getStudentNumber(member),
    }));
}

function validateGroupPayload({ teamPhoto, teamName, className, members }) {
    if (!teamPhoto) {
        return "Teamfoto ontbreekt.";
    }

    if (!isNonEmptyString(teamName)) {
        return "Teamnaam ontbreekt.";
    }

    if (!isNonEmptyString(className)) {
        return "Klas ontbreekt.";
    }

    if (!Array.isArray(members) || members.length < 3) {
        return "Minimaal 3 teamleden vereist.";
    }

    const hasInvalidMember = normalizeMembers(members).some(
        (member) =>
            !isNonEmptyString(member.name) ||
            !isNonEmptyString(member.studentNumber)
    );

    if (hasInvalidMember) {
        return "Elk teamlid moet een naam en studentnummer hebben.";
    }

    return null;
}

function saveGroupPhoto(teamPhoto) {
    const base64Payload = teamPhoto.includes(",")
        ? teamPhoto.split(",")[1]
        : teamPhoto;
    const fileName = `group_${Date.now()}.png`;

    fs.mkdirSync(config.uploadsGroupsDir, { recursive: true });
    fs.writeFileSync(
        path.join(config.uploadsGroupsDir, fileName),
        base64Payload,
        "base64"
    );

    return `${config.apiBaseUrl}/uploads/groups/${fileName}`;
}

async function seedGroupChallenges(connection, groupId) {
    await ensureChallengeCatalog(connection);

    const challenges = getChallengeCatalog();

    for (const challenge of challenges) {
        const keycode = crypto.randomBytes(8).toString("hex");

        await connection.execute(
            `INSERT INTO group_challenges
                (group_id, challenge_id, completed, points, point_deduction, keycode)
             VALUES (?, ?, 0, NULL, 0, ?)`,
            [groupId, challenge.id, keycode]
        );
    }
}

async function createGroupWithMembers({
    teamPhoto,
    teamName,
    className,
    members,
}) {
    const normalizedMembers = normalizeMembers(members);

    return withTransaction(pool, async (connection) => {
        const publicUrl = saveGroupPhoto(teamPhoto);
        const [groupResult] = await connection.execute(
            `INSERT INTO groups (name, class, image_url, created_at)
             VALUES (?, ?, ?, NOW())`,
            [teamName, className, publicUrl]
        );

        const groupId = groupResult.insertId;

        for (const member of normalizedMembers) {
            await connection.execute(
                `INSERT INTO group_members (group_id, name, student_number)
                 VALUES (?, ?, ?)`,
                [groupId, member.name, member.studentNumber]
            );
        }

        await seedGroupChallenges(connection, groupId);

        return { groupId, publicUrl };
    });
}

module.exports = {
    createGroupWithMembers,
    normalizeMembers,
    validateGroupPayload,
};
