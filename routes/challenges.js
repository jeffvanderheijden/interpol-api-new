const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json("challenges");
});

module.exports = router;
