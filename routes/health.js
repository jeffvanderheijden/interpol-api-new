const express = require('express');
const router = express.Router();
const { sendOk } = require("../utils/response");

router.get('/', (req, res) => {
    return sendOk(res, { message: "API is running" });
});

module.exports = router;
