const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ldapAuthenticate = require('./../auth/ldapAuth');
const { pool } = require('./../database/database.js');
const { sendOk, sendError } = require("./../utils/response");
const { logError } = require("./../utils/log");
const { config } = require("./../config");
const { getSessionUser, saveSession } = require("./../utils/session");

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 minuut
    max: 15,                   // 15 pogingen
    message: { error: 'Te veel mislukte pogingen, probeer later opnieuw.' }
});

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

router.post('/login', loginLimiter, async (req, res) => {
    const { gebruikersnaam, wachtwoord } = req.body || {};
    if (!gebruikersnaam || !wachtwoord) {
        return sendError(res, 400, "Gebruikersnaam en wachtwoord zijn verplicht");
    }

    try {
        const result = await ldapAuthenticate(gebruikersnaam, wachtwoord, req.session);
        if (result.error) return sendError(res, 401, result.error);

        // Check of gebruiker al in een team zit
        let teamId = null;

        try {
            const [teamRows] = await pool.execute(
                `SELECT group_id 
                 FROM group_members 
                 WHERE student_number = ? 
                 LIMIT 1`,
                [gebruikersnaam]
            );

            if (teamRows.length > 0) {
                teamId = teamRows[0].group_id;
            }
        } catch (teamErr) {
            logError("Auth team lookup", teamErr);
        }

        await regenerateSession(req);

        req.session.user = {
            username: gebruikersnaam,
            name: result.displayName || gebruikersnaam,
            role: result.role || 'student',
            teamId,
        };

        await saveSession(req);

        return sendOk(res, { user: req.session.user });
    } catch (err) {
        logError("LDAP auth failed", err);
        return sendError(res, 500, "Interne serverfout");
    }
});


router.get('/session', (req, res) => {
    return sendOk(res, { user: getSessionUser(req) });
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return sendError(res, 500, "Kon niet uitloggen");
        res.clearCookie('connect.sid', {
            domain: config.sessionCookieDomain,
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        return sendOk(res);
    });
});

module.exports = router;
