const { sendError } = require("../utils/response");
const { getSessionUser } = require("../utils/session");

module.exports = function requireLogin(req, res, next) {
    if (!getSessionUser(req)) {
        return sendError(res, 401, "Unauthorized");
    }

    next();
};
