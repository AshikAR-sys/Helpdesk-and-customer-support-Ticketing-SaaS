(async () => {
  const user = await requireAuth();
  if (!user) return;

  if (user.role !== "CUSTOMER") {
    window.location.href = "dashboard.html";
    return;
  }

  document.getElementById("ticketForm").addEventListener("submit", async e => {
    e.preventDefault();
    const error = document.getElementById("error");
    error.textContent = "";

    try {
      const ticket = await api("/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: document.getElementById("subject").value,
          description: document.getElementById("description").value,
          category: document.getElementById("category").value,
          priority: document.getElementById("priority").value
        })
      });

      window.location.href = `ticket.html?id=${ticket.id}`;
    } catch (err) {
      error.textContent = err.message;
    }
  });
})();
