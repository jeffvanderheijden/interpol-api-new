const express = require('express');
const router = express.Router();
const ldapAuthenticate = require('./../auth/ldapAuth');

router.post('/login', async (req, res) => {
    const { gebruikersnaam, wachtwoord } = req.body;
    console.log("Login attempt:", gebruikersnaam);

    if (!gebruikersnaam || !wachtwoord) {
        console.log("Missing credentials");
        return res.status(400).json({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' });
    }

    try {
        const result = await ldapAuthenticate(gebruikersnaam, wachtwoord, req.session);

        if (result.error) {
            return res.status(401).json({ message: result.error });
        }

        return res.json(result);

    } catch (err) {
        console.error("LDAP auth failed:", err);
        return res.status(500).json({ error: "Interne serverfout" });
    }
});

router.get('/session', (req, res) => {
    res.json({ session: req.session });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Kon niet uitloggen' });
        res.clearCookie('connect.sid', { domain: '.heijden.sd-lab.nl', path: '/' });
        res.json({ message: 'Uitgelogd' });
    });
});

module.exports = router;
