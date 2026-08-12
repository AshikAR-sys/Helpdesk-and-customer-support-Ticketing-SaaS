const pool = require("../config/db");
const { routeTicket } = require("../services/ticketRouter");

async function createTicket(req, res) {
  const { subject, description, category, priority } = req.body;

  if (!subject || !description || !category || !priority) {
    return res.status(400).json({ message: "All ticket fields are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const agentId = await routeTicket(category, client);

    const ticket = await client.query(
      `INSERT INTO tickets
       (subject, description, category, priority, creator_id, assignee_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [subject, description, category, priority, req.user.id, agentId]
    );

    await client.query(
      `INSERT INTO ticket_messages (ticket_id, author_id, body)
       VALUES ($1,$2,$3)`,
      [ticket.rows[0].id, req.user.id, description]
    );

    await client.query("COMMIT");
    res.status(201).json(ticket.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listTickets(req, res) {
  const condition = req.user.role === "CUSTOMER"
    ? "t.creator_id = $1"
    : req.user.role === "AGENT"
    ? "t.assignee_id = $1"
    : "TRUE";

  const result = await pool.query(
    `SELECT t.id, t.ticket_no, t.subject, t.category, t.priority, t.status,
            t.updated_at, a.name AS assignee_name
     FROM tickets t
     LEFT JOIN users a ON a.id = t.assignee_id
     WHERE ${condition}
     ORDER BY t.updated_at DESC
     LIMIT 100`,
    [req.user.id]
  );

  res.json(result.rows);
}

async function getTicket(req, res) {
  const ticketResult = await pool.query(
    `SELECT t.*, c.name AS creator_name, a.name AS assignee_name
     FROM tickets t
     JOIN users c ON c.id = t.creator_id
     LEFT JOIN users a ON a.id = t.assignee_id
     WHERE t.id = $1`,
    [req.params.id]
  );

  if (!ticketResult.rows.length) return res.status(404).json({ message: "Ticket not found" });

  const ticket = ticketResult.rows[0];

  const allowed =
    req.user.role === "ADMIN" ||
    ticket.creator_id === req.user.id ||
    ticket.assignee_id === req.user.id;

  if (!allowed) return res.status(403).json({ message: "Forbidden" });

  const messages = await pool.query(
    `SELECT m.id, m.body, m.created_at, u.name AS author_name, u.role AS author_role
     FROM ticket_messages m
     JOIN users u ON u.id = m.author_id
     WHERE m.ticket_id = $1
     ORDER BY m.created_at ASC`,
    [req.params.id]
  );

  res.json({ ...ticket, messages: messages.rows });
}

async function addMessage(req, res) {
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: "Message is required" });

  const ticketResult = await pool.query(
    "SELECT * FROM tickets WHERE id = $1",
    [req.params.id]
  );

  if (!ticketResult.rows.length) return res.status(404).json({ message: "Ticket not found" });

  const ticket = ticketResult.rows[0];
  const allowed =
    req.user.role === "ADMIN" ||
    ticket.creator_id === req.user.id ||
    ticket.assignee_id === req.user.id;

  if (!allowed) return res.status(403).json({ message: "Forbidden" });

  const result = await pool.query(
    `INSERT INTO ticket_messages (ticket_id, author_id, body)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [req.params.id, req.user.id, body]
  );

  if (["AGENT", "ADMIN"].includes(req.user.role)) {
    await pool.query(
      "UPDATE tickets SET status = 'IN_PROGRESS', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    );
  }

  res.status(201).json(result.rows[0]);
}

async function updateStatus(req, res) {
  const { status } = req.body;

  const result = await pool.query(
    `UPDATE tickets
     SET status = $1,
         resolved_at = CASE WHEN $1 IN ('RESOLVED','CLOSED') THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [status, req.params.id]
  );

  if (!result.rows.length) return res.status(404).json({ message: "Ticket not found" });

  res.json(result.rows[0]);
}

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  addMessage,
  updateStatus
};
