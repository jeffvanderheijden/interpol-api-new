const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ldapAuthenticate = require('./../auth/ldapAuth');

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,   // 5 minuten
    max: 5,                    // 5 pogingen
    message: { error: 'Te veel mislukte pogingen, probeer later opnieuw.' }
});

router.post('/login', async (req, res) => {
    const { gebruikersnaam, wachtwoord } = req.body;

    if (!gebruikersnaam || !wachtwoord) {
        return res.status(400).json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' });
    }

    try {
        const result = await ldapAuthenticate(gebruikersnaam, wachtwoord, req.session);

        if (result.error) {
            return res.status(401).json({ message: result.error });
        }

        req.session.user = {
            username: gebruikersnaam,
            name: result.displayName || gebruikersnaam,
            role: result.role || 'student'
        };

        return res.json({ message: 'Ingelogd', user: req.session.user });

    } catch (err) {
        console.error('LDAP auth failed:', err);
        return res.status(500).json({ error: 'Interne serverfout' });
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
            sameSite: 'lax'
        });
        res.json({ message: 'Uitgelogd' });
    });
});

module.exports = router;
