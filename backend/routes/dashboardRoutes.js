const express = require("express");
const { dashboard } = require("../controllers/dashboardController");
const { auth } = require("../middleware/auth");

const router = express.Router();
router.get("/", auth, dashboard);

module.exports = router;
