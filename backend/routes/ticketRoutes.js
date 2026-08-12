const express = require("express");
const {
  createTicket,
  listTickets,
  getTicket,
  addMessage,
  updateStatus
} = require("../controllers/ticketController");
const { auth, role } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, listTickets);
router.post("/", auth, role("CUSTOMER"), createTicket);
router.get("/:id", auth, getTicket);
router.post("/:id/messages", auth, addMessage);
router.patch("/:id", auth, role("AGENT", "ADMIN"), updateStatus);

module.exports = router;
