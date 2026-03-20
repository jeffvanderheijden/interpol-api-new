const { sendOk, sendError } = require("./../../utils/response");
const { logError } = require("./../../utils/log");
const { saveSession } = require("./../../utils/session");
const {
    createGroupWithMembers,
    validateGroupPayload,
} = require("./../../services/groups");

module.exports = async function postHandler(req, res) {
    const { teamPhoto, members, teamName, className } = req.body;
    const validationError = validateGroupPayload({
        teamPhoto,
        teamName,
        className,
        members,
    });

    if (validationError) {
        return sendError(res, 400, validationError);
    }

    try {
        const { groupId, publicUrl } = await createGroupWithMembers({
            teamPhoto,
            teamName,
            className,
            members,
        });

        // 6. UPDATE SESSION
        if (req.session && req.session.user) {
            req.session.user.teamId = groupId;
            await saveSession(req);
        }

        // 7. RETURN
        return sendOk(res, {
            id: groupId,
            name: teamName,
            class: className,
            image_url: publicUrl,
        });

    } catch (err) {
        logError("POST /api/groups", err);
        return sendError(res, 500, "Server error");
    }
};
