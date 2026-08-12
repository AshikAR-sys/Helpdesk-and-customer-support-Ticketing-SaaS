const express = require("express");
const { login, logout, me } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", auth, me);

module.exports = router;
