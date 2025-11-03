const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ldapAuthenticate = require('./../auth/ldapAuth');

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,   // 5 minuten
    max: 5,                    // 5 pogingen
    message: { error: 'Te veel mislukte pogingen, probeer later opnieuw.' }
});

router.post('/login', loginLimiter, async (req, res) => {
    console.log('>>> /api/login reached');

    const { gebruikersnaam, wachtwoord } = req.body || {};   // ✅ safe destructure
    if (!gebruikersnaam || !wachtwoord) {
        return res.status(400).json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' });
    }

    try {
        const result = await ldapAuthenticate(gebruikersnaam, wachtwoord, req.session);
        if (result.error) return res.status(401).json({ message: result.error });

        req.session.regenerate(err => {
            if (err) return res.status(500).json({ error: 'Interne serverfout (sessie)' });

            req.session.user = {
                username: gebruikersnaam,
                name: result.displayName || gebruikersnaam,
                role: result.role || 'student'
            };

            req.session.save(err2 => {
                if (err2) return res.status(500).json({ error: 'Interne serverfout (opslaan sessie)' });
                res.json({ message: 'Ingelogd', user: req.session.user });
            });
        });
    } catch (err) {
        console.error('LOGIN route crashed:', err);
        res.status(500).json({ error: 'Interne serverfout' });
    }
});

router.get('/session', (req, res) => {
    res.json({ user: req.session?.user || null });
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
