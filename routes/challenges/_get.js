const { sendOk } = require("../../utils/response");

module.exports = function getHandler(req, res) {
    return sendOk(res, { challenges: [] });
};
