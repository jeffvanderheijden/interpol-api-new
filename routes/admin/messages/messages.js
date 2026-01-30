const express = require("express");
const router = express.Router();

const getHandler = require("./get");
const postHandler = require("./post");
const patchHandler = require("./patch");
const deleteHandler = require("./delete");

router.get("/", getHandler);
router.post("/", postHandler);
router.patch("/:id", patchHandler);
router.delete("/:id", deleteHandler);

module.exports = router;
