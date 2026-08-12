const pool = require("../config/db");

/*
  Scalable routing baseline:
  1. Find available agents matching the category.
  2. Calculate active ticket load.
  3. Assign to the least-loaded agent.

  This service can later be moved behind Redis/BullMQ
  for high-volume asynchronous ticket routing.
*/
async function routeTicket(category, client = pool) {
  const result = await client.query(
    `SELECT u.id,
            COUNT(t.id)::int AS active_load
     FROM users u
     LEFT JOIN tickets t
       ON t.assignee_id = u.id
       AND t.status IN ('OPEN','IN_PROGRESS')
     WHERE u.role = 'AGENT'
       AND u.is_available = TRUE
       AND (u.category = $1 OR u.category IS NULL)
     GROUP BY u.id
     ORDER BY active_load ASC
     LIMIT 1`,
    [category]
  );

  return result.rows[0]?.id || null;
}

module.exports = { routeTicket };
