const { sendOk, sendError } = require("./../../../utils/response");
const { logError } = require("./../../../utils/log");
const {
    createGroupWithMembers,
    validateGroupPayload,
} = require("./../../../services/groups");

module.exports = async function postHandler(req, res) {
    const { teamPhoto, teamName, className, members } = req.body;
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

        return sendOk(res, {
            id: groupId,
            name: teamName,
            class: className,
            image_url: publicUrl,
        });

    } catch (err) {
        logError("Admin POST /groups", err);
        return sendError(res, 500, "Server error");
    }
};
