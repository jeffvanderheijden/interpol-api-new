const express = require("express");

const getHandler = require("./_get");
const postHandler = require("./_post");
const patchHandler = require("./_patch");
const deleteHandler = require("./_delete");

const router = express.Router();

router.get("/", getHandler);
router.post("/", postHandler);
router.patch("/:id", patchHandler);
router.delete("/:id", deleteHandler);

module.exports = router;
