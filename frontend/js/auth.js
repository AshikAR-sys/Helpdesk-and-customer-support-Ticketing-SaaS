async function requireAuth() {
  try {
    return await api("/auth/me");
  } catch {
    window.location.href = "login.html";
  }
}

function logout() {
  api("/auth/logout", { method: "POST" }).finally(() => {
    window.location.href = "login.html";
  });
}
