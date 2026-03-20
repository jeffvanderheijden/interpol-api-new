const { sendError } = require("../utils/response");
const { getSessionUser } = require("../utils/session");

module.exports = function requireTeacher(req, res, next) {
    const user = getSessionUser(req);

    if (!user) {
        return sendError(res, 401, "Unauthorized");
    }

    if (user.role !== "docent") {
        return sendError(res, 403, "Forbidden");
    }

    next();
};
