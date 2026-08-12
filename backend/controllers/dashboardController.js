const pool = require("../config/db");

async function dashboard(req, res) {
  let filter = "";
  const params = [];

  if (req.user.role === "CUSTOMER") {
    filter = "WHERE creator_id = $1";
    params.push(req.user.id);
  } else if (req.user.role === "AGENT") {
    filter = "WHERE assignee_id = $1";
    params.push(req.user.id);
  }

  const stats = await pool.query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status='OPEN')::int AS open,
      COUNT(*) FILTER (WHERE status='IN_PROGRESS')::int AS "inProgress",
      COUNT(*) FILTER (WHERE status='RESOLVED')::int AS resolved
     FROM tickets ${filter}`,
    params
  );

  let ticketFilter = filter;

  const tickets = await pool.query(
    `SELECT t.id, t.ticket_no, t.subject, t.category, t.priority, t.status,
            t.updated_at, a.name AS assignee_name
     FROM tickets t
     LEFT JOIN users a ON a.id=t.assignee_id
     ${ticketFilter.replaceAll("creator_id", "t.creator_id").replaceAll("assignee_id", "t.assignee_id")}
     ORDER BY t.updated_at DESC
     LIMIT 100`,
    params
  );

  res.json({ stats: stats.rows[0], tickets: tickets.rows });
}

module.exports = { dashboard };
