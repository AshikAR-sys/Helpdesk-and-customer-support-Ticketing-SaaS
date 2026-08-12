(async () => {
  const user = await requireAuth();
  if (!user) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;

  try {
    const ticket = await api(`/tickets/${id}`);
    renderTicket(ticket, user);
  } catch (err) {
    document.getElementById("ticket").innerHTML = `<p class="error">${err.message}</p>`;
  }
})();

function renderTicket(t, user) {
  const canManage = user.role === "AGENT" || user.role === "ADMIN";

  document.getElementById("ticket").innerHTML = `
    <div class="ticket-header">
      <div>
        <p class="muted">Ticket #${t.ticket_no}</p>
        <h1>${escapeHtml(t.subject)}</h1>
        <p class="muted">${escapeHtml(t.category)} · ${t.priority} · ${t.status}</p>
      </div>
      ${canManage ? `
        <select id="statusSelect">
          ${["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(s => `<option ${s===t.status?"selected":""}>${s}</option>`).join("")}
        </select>` : ""}
    </div>

    <div class="ticket-description">${escapeHtml(t.description)}</div>

    <div>
      ${t.messages.map(m => `
        <div class="message">
          <div class="message-head">
            <b>${escapeHtml(m.author_name)}</b>
            <span>${m.author_role}</span>
          </div>
          <div>${escapeHtml(m.body)}</div>
        </div>`).join("")}
    </div>

    <form id="replyForm" class="panel form-panel">
      <label>Response</label>
      <textarea id="reply" rows="5" required placeholder="Write your response..."></textarea>
      <button class="btn btn-primary">Send Response</button>
    </form>
  `;

  document.getElementById("replyForm").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await api(`/tickets/${t.id}/messages`, {
        method:"POST",
        body:JSON.stringify({ body:document.getElementById("reply").value })
      });
      location.reload();
    } catch(err) { alert(err.message); }
  });

  if (canManage) {
    document.getElementById("statusSelect").addEventListener("change", async e => {
      try {
        await api(`/tickets/${t.id}`, {
          method:"PATCH",
          body:JSON.stringify({ status:e.target.value })
        });
        location.reload();
      } catch(err) { alert(err.message); }
    });
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c]));
}
