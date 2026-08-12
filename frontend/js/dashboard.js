(async () => {
  const user = await requireAuth();
  if (!user) return;

  document.getElementById("userInfo").textContent = `${user.name} · ${user.role}`;
  document.getElementById("logoutBtn").onclick = logout;

  if (user.role !== "CUSTOMER") {
    document.getElementById("newTicketBtn").style.display = "none";
  }

  try {
    const data = await api("/dashboard");
    document.getElementById("total").textContent = data.stats.total;
    document.getElementById("open").textContent = data.stats.open;
    document.getElementById("progress").textContent = data.stats.inProgress;
    document.getElementById("resolved").textContent = data.stats.resolved;

    const list = document.getElementById("tickets");
    if (!data.tickets.length) {
      list.innerHTML = '<div class="ticket-item">No tickets found.</div>';
      return;
    }

    list.innerHTML = data.tickets.map(t => `
      <a class="ticket-item" href="ticket.html?id=${t.id}">
        <div>
          <div class="ticket-title">#${t.ticket_no} · ${escapeHtml(t.subject)}</div>
          <div class="ticket-meta">${escapeHtml(t.category)} · ${t.priority} · ${t.assignee_name ? "Agent: " + escapeHtml(t.assignee_name) : "Unassigned"}</div>
        </div>
        <span class="status">${t.status}</span>
      </a>
    `).join("");
  } catch (err) {
    document.getElementById("tickets").innerHTML = `<div class="ticket-item error">${err.message}</div>`;
  }
})();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
