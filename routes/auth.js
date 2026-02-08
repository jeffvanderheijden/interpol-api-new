const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ldapAuthenticate = require('./../auth/ldapAuth');
const { pool } = require('./../database/database.js');
const { sendOk, sendError } = require("./../utils/response");
const { logError } = require("./../utils/log");
const { config } = require("./../config");

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 minuut
    max: 15,                   // 15 pogingen
    message: { error: 'Te veel mislukte pogingen, probeer later opnieuw.' }
});

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

        // prevent session fixation + ensure cookie is persisted before responding
        req.session.regenerate(err => {
            if (err) return sendError(res, 500, "Interne serverfout (sessie)");

            req.session.user = {
                username: gebruikersnaam,
                name: result.displayName || gebruikersnaam,
                role: result.role || 'student',
                teamId 
            };

            req.session.save(err2 => {
                if (err2) return sendError(res, 500, "Interne serverfout (opslaan sessie)");
                return sendOk(res, { user: req.session.user });
            });
        });
    } catch (err) {
        logError("LDAP auth failed", err);
        return sendError(res, 500, "Interne serverfout");
    }
});


router.get('/session', (req, res) => {
    return sendOk(res, { user: req.session?.user || null });
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
