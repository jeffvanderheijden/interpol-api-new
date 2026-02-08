function sendOk(res, data = {}, status = 200) {
    return res.status(status).json({ success: true, ...data });
}

function sendError(res, status = 500, message = "Server error") {
    return res.status(status).json({ success: false, error: message });
}

module.exports = { sendOk, sendError };
