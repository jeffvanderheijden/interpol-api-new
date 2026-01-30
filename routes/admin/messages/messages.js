const express = require("express");
const router = express.Router();

const getHandler = require("./_get");
const postHandler = require("./_post");
const patchHandler = require("./_patch");
const deleteHandler = require("./_delete");

router.get("/", getHandler);
router.post("/", postHandler);
router.patch("/:id", patchHandler);
router.delete("/:id", deleteHandler);

module.exports = router;
