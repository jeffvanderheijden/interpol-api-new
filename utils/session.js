function getSessionUser(req) {
    return req.session?.user || null;
}

function saveSession(req) {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            resolve();
            return;
        }

        req.session.save((err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

module.exports = { getSessionUser, saveSession };
