const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ldapAuthenticate = require('./../auth/ldapAuth');
const { pool } = require('./../database/database.js');

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 minuut
    max: 15,                   // 15 pogingen
    message: { error: 'Te veel mislukte pogingen, probeer later opnieuw.' }
});

router.post('/login', loginLimiter, async (req, res) => {
    const { gebruikersnaam, wachtwoord } = req.body || {};
    if (!gebruikersnaam || !wachtwoord) {
        return res.status(400).json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' });
    }

    try {
        const result = await ldapAuthenticate(gebruikersnaam, wachtwoord, req.session);
        if (result.error) return res.status(401).json({ message: result.error });

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
            console.error("Kon teamId niet ophalen:", teamErr);
        }

        // prevent session fixation + ensure cookie is persisted before responding
        req.session.regenerate(err => {
            if (err) return res.status(500).json({ error: 'Interne serverfout (sessie)' });

            req.session.user = {
                username: gebruikersnaam,
                name: result.displayName || gebruikersnaam,
                role: result.role || 'student',
                teamId
            };

            req.session.save(err2 => {
                if (err2) return res.status(500).json({ error: 'Interne serverfout (opslaan sessie)' });
                return res.json({ message: 'Ingelogd', user: req.session.user });
            });
        });
    } catch (err) {
        console.error('LDAP auth failed:', err);
        return res.status(500).json({ error: 'Interne serverfout' });
    }
});


router.get("/session", async (req, res) => {
    if (!req.session.user) {
        return res.json({ user: null });
    }

    let teamId = req.session.user.teamId;

    if (!teamId && req.session.user.role === "student") {
        const [rows] = await pool.execute(
            `SELECT group_id 
             FROM group_members 
             WHERE student_number = ? 
             LIMIT 1`,
            [req.session.user.username]
        );

        if (rows.length) {
            teamId = rows[0].group_id;
            req.session.user.teamId = teamId;
            await req.session.save();
        }
    }

    res.json({
        user: {
            ...req.session.user,
            teamId
        }
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Kon niet uitloggen' });
        res.clearCookie('connect.sid', {
            domain: '.heijden.sd-lab.nl',
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });
        res.json({ message: 'Uitgelogd' });
    });
});

module.exports = router;
