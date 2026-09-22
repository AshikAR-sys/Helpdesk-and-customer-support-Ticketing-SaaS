import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API,
});

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLogin={login} />;
  }

  if (user.role === "ADMIN") {
    return (
      <AdminDashboard
        user={user}
        token={token}
        logout={logout}
      />
    );
  }

  if (user.role === "AGENT") {
    return (
      <AgentDashboard
        user={user}
        token={token}
        logout={logout}
      />
    );
  }

  return (
    <CustomerDashboard
      user={user}
      token={token}
      logout={logout}
    />
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post(
        "/api/auth/login",
        {
          email,
          password,
        }
      );

      onLogin(response.data);
    } catch (error) {
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg shadow-blue-600/30">
            H
          </div>

          <h1 className="text-3xl font-bold text-white mt-5">
            HelpDesk
          </h1>

          <p className="text-slate-400 mt-2">
            Customer Support Ticketing SaaS
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl"
        >
          <h2 className="text-xl font-semibold text-white mb-6">
            Sign in
          </h2>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <label className="text-sm text-slate-300">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="you@example.com"
            className="mt-2 mb-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            required
          />

          <label className="text-sm text-slate-300">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="••••••••"
            className="mt-2 mb-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            required
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({
  user,
  token,
  logout,
}) {
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [activePage, setActivePage] =
    useState("overview");

  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadDashboard = async () => {
    try {
      setRefreshing(true);

      const [
        statsResponse,
        agentsResponse,
        ticketsResponse,
      ] = await Promise.all([
        api.get(
          "/api/admin/stats",
          config
        ),
        api.get(
          "/api/admin/agents",
          config
        ),
        api.get(
          "/api/tickets",
          config
        ),
      ]);

      setStats(statsResponse.data);

      setAgents(
        agentsResponse.data?.agents ||
        agentsResponse.data ||
        []
      );

      setTickets(
        ticketsResponse.data?.tickets ||
        ticketsResponse.data ||
        []
      );
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openTicket = async (ticket) => {
    try {
      const response = await api.get(
        `/api/tickets/${ticket.id}`,
        config
      );

      setSelectedTicket(
        response.data?.ticket ||
        response.data
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* SIDEBAR */}

      <aside className="hidden lg:flex w-72 shrink-0 border-r border-slate-800 bg-slate-900/80 flex-col">

        <div className="p-6 border-b border-slate-800">

          <div className="flex items-center gap-3">

            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
              H
            </div>

            <div>
              <h1 className="font-bold text-lg">
                HelpDesk
              </h1>

              <p className="text-xs text-slate-500">
                Admin Console
              </p>
            </div>

          </div>
        </div>

        <nav className="p-4 space-y-2">

          <AdminNavButton
            active={
              activePage === "overview"
            }
            onClick={() =>
              setActivePage("overview")
            }
            icon="▦"
          >
            Overview
          </AdminNavButton>

          <AdminNavButton
            active={
              activePage === "tickets"
            }
            onClick={() =>
              setActivePage("tickets")
            }
            icon="🎫"
          >
            All Tickets
          </AdminNavButton>

          <AdminNavButton
            active={
              activePage === "agents"
            }
            onClick={() =>
              setActivePage("agents")
            }
            icon="👨‍💻"
          >
            Agents
          </AdminNavButton>

        </nav>

        <div className="mt-auto p-4 border-t border-slate-800">

          <div className="rounded-2xl bg-slate-950 p-4 mb-3">

            <p className="text-xs text-slate-500">
              Signed in as
            </p>

            <p className="font-medium text-sm mt-1">
              {user.name || user.email}
            </p>

            <span className="inline-block mt-2 text-xs rounded-full bg-purple-500/10 text-purple-300 px-2 py-1">
              ADMIN
            </span>

          </div>

          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN */}

      <main className="flex-1 min-w-0">

        <header className="h-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-5 lg:px-8">

          <div>
            <h2 className="text-xl font-bold">
              {activePage === "overview"
                ? "Admin Dashboard"
                : activePage === "tickets"
                  ? "All Tickets"
                  : "Agent Management"}
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Manage your HelpDesk platform
            </p>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">
                {user.name ||
                  "Administrator"}
              </p>

              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>

          </div>

        </header>

        <div className="p-5 lg:p-8">

          {loading ? (
            <Loading />
          ) : activePage === "overview" ? (
            <AdminOverview
              stats={stats}
              agents={agents}
              tickets={tickets}
              onTicketClick={openTicket}
            />
          ) : activePage === "tickets" ? (
            <AdminTickets
              tickets={tickets}
              onTicketClick={openTicket}
            />
          ) : (
            <AdminAgents
              agents={agents}
            />
          )}

        </div>
      </main>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          token={token}
          user={user}
          onClose={() =>
            setSelectedTicket(null)
          }
          onUpdated={() => {
            setSelectedTicket(null);
            loadDashboard();
          }}
        />
      )}

    </div>
  );
}

/* =========================================================
   ADMIN OVERVIEW
========================================================= */

function AdminOverview({
  stats,
  agents,
  tickets,
  onTicketClick,
}) {
  const totalTickets =
    stats?.total_tickets ??
    stats?.totalTickets ??
    tickets.length;

  const totalUsers =
    stats?.total_users ??
    stats?.totalUsers ??
    0;

  const totalAgents =
    stats?.total_agents ??
    stats?.totalAgents ??
    agents.length;

  const totalCustomers =
    stats?.total_customers ??
    stats?.totalCustomers ??
    0;

  const open =
    stats?.open ??
    stats?.open_tickets ??
    0;

  const inProgress =
    stats?.in_progress ??
    stats?.in_progress_tickets ??
    0;

  const resolved =
    stats?.resolved ??
    stats?.resolved_tickets ??
    0;

  const closed =
    stats?.closed ??
    stats?.closed_tickets ??
    0;

  const priorityData =
    getPriorityData(
      stats,
      tickets
    );

  const categoryData =
    getCategoryData(
      stats,
      tickets
    );

  return (
    <div className="space-y-7">

      {/* WELCOME */}

      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-600/20 via-slate-900 to-purple-600/10 p-7">

        <p className="text-blue-300 text-sm font-medium">
          Control Center
        </p>

        <h1 className="text-3xl font-bold mt-2">
          Welcome back, Admin 👋
        </h1>

        <p className="text-slate-400 mt-2 max-w-2xl">
          Monitor tickets, agents, workloads
          and support operations from one place.
        </p>

      </div>

      {/* MAIN STATS */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Total Users"
          value={totalUsers}
          icon="👥"
          color="blue"
        />

        <StatCard
          title="Total Agents"
          value={totalAgents}
          icon="👨‍💻"
          color="purple"
        />

        <StatCard
          title="Customers"
          value={totalCustomers}
          icon="👤"
          color="cyan"
        />

        <StatCard
          title="Total Tickets"
          value={totalTickets}
          icon="🎫"
          color="emerald"
        />

      </div>

      {/* STATUS */}

      <div>

        <h3 className="text-lg font-semibold mb-4">
          Ticket Status
        </h3>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

          <MiniStat
            label="Open"
            value={open}
            className="text-blue-400"
          />

          <MiniStat
            label="In Progress"
            value={inProgress}
            className="text-yellow-400"
          />

          <MiniStat
            label="Resolved"
            value={resolved}
            className="text-emerald-400"
          />

          <MiniStat
            label="Closed"
            value={closed}
            className="text-slate-400"
          />

        </div>
      </div>

      {/* ANALYTICS */}

      <div className="grid xl:grid-cols-2 gap-5">

        <AnalyticsCard
          title="Priority Distribution"
          data={priorityData}
        />

        <AnalyticsCard
          title="Category Distribution"
          data={categoryData}
        />

      </div>

      {/* AGENT WORKLOAD */}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h3 className="font-semibold text-lg">
            Agent Workload
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Current support team workload
          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="text-left text-slate-500 border-b border-slate-800">

                <th className="px-6 py-4">
                  Agent
                </th>

                <th className="px-6 py-4">
                  Category
                </th>

                <th className="px-6 py-4">
                  Availability
                </th>

                <th className="px-6 py-4">
                  Active
                </th>

                <th className="px-6 py-4">
                  Total
                </th>

              </tr>

            </thead>

            <tbody>

              {agents.map((agent) => (

                <tr
                  key={agent.id}
                  className="border-b border-slate-800/70 hover:bg-slate-800/30"
                >

                  <td className="px-6 py-4">

                    <p className="font-medium">
                      {agent.name ||
                        "Agent"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {agent.email}
                    </p>

                  </td>

                  <td className="px-6 py-4 text-slate-300">
                    {agent.category ||
                      "General"}
                  </td>

                  <td className="px-6 py-4">

                    <AvailabilityBadge
                      available={
                        agent.is_available ??
                        agent.isAvailable ??
                        false
                      }
                    />

                  </td>

                  <td className="px-6 py-4">
                    {agent.active_tickets ??
                      agent.activeTickets ??
                      0}
                  </td>

                  <td className="px-6 py-4">
                    {agent.total_tickets ??
                      agent.totalTickets ??
                      0}
                  </td>

                </tr>

              ))}

              {agents.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No agents found
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* RECENT TICKETS */}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">

        <div className="p-6 border-b border-slate-800">

          <h3 className="font-semibold text-lg">
            Recent Tickets
          </h3>

        </div>

        <div className="divide-y divide-slate-800">

          {tickets.map((ticket) => (

            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() =>
                onTicketClick(ticket)
              }
            />

          ))}

          {tickets.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No tickets found
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   ADMIN TICKETS
========================================================= */

function AdminTickets({
  tickets,
  onTicketClick,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [agent, setAgent] = useState("ALL");

  const categories = [
    ...new Set(
      tickets.map((ticket) => ticket.category).filter(Boolean)
    ),
  ];

  const agents = [
    ...new Set(
      tickets
        .map(
          (ticket) =>
            ticket.agent_name || ticket.assignee_name || "Unassigned"
        )
        .filter(Boolean)
    ),
  ];

  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => String(t.status).toUpperCase() === "OPEN").length,
    progress: tickets.filter((t) => String(t.status).toUpperCase() === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => String(t.status).toUpperCase() === "RESOLVED").length,
    urgent: tickets.filter((t) => String(t.priority).toUpperCase() === "URGENT").length,
  }), [tickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const text = [
        ticket.ticket_no,
        ticket.subject,
        ticket.customer_name,
        ticket.creator_name,
        ticket.customer_email,
        ticket.agent_name,
        ticket.assignee_name,
        ticket.category,
        ticket.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesStatus =
        status === "ALL" || String(ticket.status || "").toUpperCase() === status;
      const matchesPriority =
        priority === "ALL" || String(ticket.priority || "").toUpperCase() === priority;
      const matchesCategory =
        category === "ALL" || String(ticket.category || "") === category;
      const ticketAgent =
        ticket.agent_name || ticket.assignee_name || "Unassigned";
      const matchesAgent = agent === "ALL" || ticketAgent === agent;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesAgent
      );
    });
  }, [tickets, search, status, priority, category, agent]);

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPriority("ALL");
    setCategory("ALL");
    setAgent("ALL");
  };

  const hasFilters =
    search ||
    status !== "ALL" ||
    priority !== "ALL" ||
    category !== "ALL" ||
    agent !== "ALL";

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">
              🎫
            </div>
            <div>
              <h1 className="text-2xl font-bold">All Tickets</h1>
              <p className="text-slate-500 mt-1">
                Monitor, filter and manage every support ticket
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm">
          <span className="text-slate-500">Showing </span>
          <span className="font-bold text-white">{filtered.length}</span>
          <span className="text-slate-500"> of </span>
          <span className="font-bold text-white">{tickets.length}</span>
          <span className="text-slate-500"> tickets</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <TicketSummaryCard label="Total" value={counts.total} icon="🎫" />
        <TicketSummaryCard label="Open" value={counts.open} icon="🔵" />
        <TicketSummaryCard label="In Progress" value={counts.progress} icon="🟡" />
        <TicketSummaryCard label="Resolved" value={counts.resolved} icon="🟢" />
        <TicketSummaryCard label="Urgent" value={counts.urgent} icon="🔴" />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, subject, customer, agent..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
          <FilterSelect value={status} onChange={setStatus}>
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </FilterSelect>

          <FilterSelect value={priority} onChange={setPriority}>
            <option value="ALL">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </FilterSelect>

          <FilterSelect value={category} onChange={setCategory}>
            <option value="ALL">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={agent} onChange={setAgent}>
            <option value="ALL">All Agents</option>
            <option value="Unassigned">Unassigned</option>
            {agents.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </FilterSelect>
        </div>

        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="hidden md:block rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-500">
                <th className="px-5 py-4">Ticket</th>
                <th className="px-5 py-4">Subject</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Agent</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onTicketClick(ticket)}
                  className="border-b border-slate-800/70 hover:bg-blue-500/5 cursor-pointer transition"
                >
                  <td className="px-5 py-4">
                    <span className="font-semibold text-blue-400">
                      #{ticket.ticket_no || ticket.id?.slice(0, 8)}
                    </span>
                    <p className="text-[11px] text-slate-600 mt-1">{formatDate(ticket.created_at)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-xs truncate font-medium text-white">{ticket.subject || "No subject"}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {ticket.customer_name || ticket.creator_name || ticket.customer_email || "-"}
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {ticket.agent_name || ticket.assignee_name || "Unassigned"}
                  </td>
                  <td className="px-5 py-4 text-slate-300">{ticket.category || "-"}</td>
                  <td className="px-5 py-4"><PriorityBadge priority={ticket.priority} /></td>
                  <td className="px-5 py-4"><StatusBadge status={ticket.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <EmptyTickets hasFilters={hasFilters} onClear={clearFilters} />}
      </div>

      <div className="md:hidden space-y-3">
        {filtered.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => onTicketClick(ticket)}
            className="w-full text-left rounded-3xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500/40 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-400">
                  #{ticket.ticket_no || ticket.id?.slice(0, 8)}
                </p>
                <h3 className="font-semibold mt-1 truncate">
                  {ticket.subject || "No subject"}
                </h3>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <p className="text-sm text-slate-400 mt-3 truncate">
              {ticket.customer_name || ticket.creator_name || ticket.customer_email || "Customer"}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <PriorityBadge priority={ticket.priority} />
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">
                {ticket.category || "General"}
              </span>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-400">
                👤 {ticket.agent_name || ticket.assignee_name || "Unassigned"}
              </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-600">{formatDate(ticket.created_at)}</span>
              <span className="text-xs text-blue-400">View ticket →</span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && <EmptyTickets hasFilters={hasFilters} onClear={clearFilters} />}
      </div>
    </div>
  );
}

function TicketSummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-600">Tickets</span>
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
    >
      {children}
    </select>
  );
}

function EmptyTickets({ hasFilters, onClear }) {
  return (
    <div className="p-12 text-center">
      <div className="text-4xl mb-3">🎫</div>
      <p className="text-slate-300 font-medium">No tickets found</p>
      <p className="text-sm text-slate-500 mt-1">
        {hasFilters ? "Try changing your filters." : "There are no tickets yet."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

/* =========================================================
   ADMIN AGENTS
========================================================= */

function AdminAgents({
  agents,
}) {
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const categories = [
    ...new Set(
      agents
        .map((agent) => agent.category || "General")
        .filter(Boolean)
    ),
  ];

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const name = agent.name || "Agent";
      const email = agent.email || "";
      const agentCategory = agent.category || "General";
      const available = Boolean(
        agent.is_available ?? agent.isAvailable ?? false
      );

      const matchesSearch = `${name} ${email} ${agentCategory}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesAvailability =
        availability === "ALL" ||
        (availability === "AVAILABLE" && available) ||
        (availability === "OFFLINE" && !available);

      const matchesCategory =
        category === "ALL" || agentCategory === category;

      return (
        matchesSearch &&
        matchesAvailability &&
        matchesCategory
      );
    });
  }, [agents, search, availability, category]);

  const availableCount = agents.filter((agent) =>
    Boolean(agent.is_available ?? agent.isAvailable ?? false)
  ).length;

  const totalActive = agents.reduce(
    (sum, agent) =>
      sum + Number(agent.active_tickets ?? agent.activeTickets ?? 0),
    0
  );

  const totalAssigned = agents.reduce(
    (sum, agent) =>
      sum + Number(agent.total_tickets ?? agent.totalTickets ?? 0),
    0
  );

  const clearFilters = () => {
    setSearch("");
    setAvailability("ALL");
    setCategory("ALL");
  };

  const hasFilters =
    search || availability !== "ALL" || category !== "ALL";

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-300 flex items-center justify-center text-xl">
              👨‍💻
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Agent Management
              </h1>
              <p className="text-slate-500 mt-1">
                Monitor availability, categories and ticket workload
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full xl:w-auto">
          <AgentSummaryCard label="Agents" value={agents.length} />
          <AgentSummaryCard label="Available" value={availableCount} />
          <AgentSummaryCard label="Active Tickets" value={totalActive} />
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent name or email..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="OFFLINE">Offline</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="text-white font-semibold">{filteredAgents.length}</span> of {agents.length} agents
          </p>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* AGENT CARDS */}
      {filteredAgents.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => {
            const active = Number(
              agent.active_tickets ?? agent.activeTickets ?? 0
            );
            const total = Number(
              agent.total_tickets ?? agent.totalTickets ?? 0
            );
            const available = Boolean(
              agent.is_available ?? agent.isAvailable ?? false
            );
            const workload = Math.min(
              Math.round((active / Math.max(total, 1)) * 100),
              100
            );
            const name = agent.name || "Agent";
            const initials = name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part.charAt(0).toUpperCase())
              .join("") || "A";

            return (
              <div
                key={agent.id}
                className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-5 hover:border-blue-500/40 hover:bg-slate-900 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/20 border border-blue-500/20 text-blue-200 flex items-center justify-center font-bold">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold truncate text-white">
                        {name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {agent.email || "No email available"}
                      </p>
                    </div>
                  </div>

                  <AvailabilityBadge available={available} />
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Agent ID
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1 truncate max-w-[170px]">
                      {agent.id || "-"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-600">ID</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="text-2xl font-bold mt-1 text-white">
                      {active}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-bold mt-1 text-white">
                      {total}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">
                      Active workload
                    </span>
                    <span className="text-xs font-medium text-slate-300">
                      {workload}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${workload}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Category
                    </p>
                    <span className="inline-flex mt-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/10 px-3 py-1 text-xs">
                      {agent.category || "General"}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">
                      Assigned
                    </p>
                    <p className="text-sm font-semibold text-slate-300 mt-1">
                      {totalAssigned > 0 ? "Tickets" : "No tickets"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
          <div className="text-4xl mb-3">👨‍💻</div>
          <p className="text-slate-300 font-medium">
            No agents found
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Try changing your search or filters.
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AgentSummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-600 truncate">
        {label}
      </p>
      <p className="text-xl font-bold text-white mt-1">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   TICKET MODAL
========================================================= */

function TicketModal({
  ticket,
  token,
  user,
  onClose,
  onUpdated,
}) {
  const [messages, setMessages] =
    useState(ticket.messages || []);

  const [reply, setReply] =
    useState("");

  const [sending, setSending] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const loadDetails = async () => {
    try {
      const response = await api.get(
        `/api/tickets/${ticket.id}`,
        config
      );

      const data =
        response.data?.ticket ||
        response.data;

      setMessages(
        data.messages || []
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDetails();
  }, []);

  const sendReply = async () => {
    if (!reply.trim()) return;

    try {
      setSending(true);

      await api.post(
        `/api/tickets/${ticket.id}/messages`,
        {
          body: reply,
        },
        config
      );

      setReply("");

      await loadDetails();

    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Failed to send reply"
      );
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (
    status
  ) => {
    try {
      setUpdating(true);

      await api.patch(
        `/api/tickets/${ticket.id}/status`,
        {
          status,
        },
        config
      );

      onUpdated();

    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Failed to update status"
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">

        {/* HEADER */}

        <div className="flex items-center justify-between p-5 border-b border-slate-800">

          <div>

            <p className="text-xs text-blue-400 font-medium">
              #
              {ticket.ticket_no ||
                ticket.id?.slice(
                  0,
                  8
                )}
            </p>

            <h2 className="text-xl font-bold mt-1">
              {ticket.subject ||
                "Ticket Details"}
            </h2>

          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            ✕
          </button>

        </div>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* DETAILS */}

          <div className="grid md:grid-cols-4 gap-3">

            <InfoBox
              label="Customer"
              value={
                ticket.customer_name ||
                ticket.creator_name ||
                ticket.customer_email ||
                "-"
              }
            />

            <InfoBox
              label="Agent"
              value={
                ticket.agent_name ||
                ticket.assignee_name ||
                "Unassigned"
              }
            />

            <InfoBox
              label="Category"
              value={
                ticket.category || "-"
              }
            />

            <InfoBox
              label="Priority"
              value={
                ticket.priority || "-"
              }
            />

          </div>

          {/* STATUS */}

          <div className="flex flex-wrap items-center gap-3">

            <StatusBadge
              status={ticket.status}
            />

            <div className="flex flex-wrap gap-2 ml-auto">

              <button
                disabled={updating}
                onClick={() =>
                  changeStatus("OPEN")
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800"
              >
                Open
              </button>

              <button
                disabled={updating}
                onClick={() =>
                  changeStatus(
                    "IN_PROGRESS"
                  )
                }
                className="rounded-lg border border-yellow-500/30 text-yellow-300 px-3 py-2 text-xs hover:bg-yellow-500/10"
              >
                In Progress
              </button>

              <button
                disabled={updating}
                onClick={() =>
                  changeStatus(
                    "RESOLVED"
                  )
                }
                className="rounded-lg border border-emerald-500/30 text-emerald-300 px-3 py-2 text-xs hover:bg-emerald-500/10"
              >
                Resolve
              </button>

              <button
                disabled={updating}
                onClick={() =>
                  changeStatus(
                    "CLOSED"
                  )
                }
                className="rounded-lg bg-slate-800 px-3 py-2 text-xs hover:bg-slate-700"
              >
                Close
              </button>

            </div>

          </div>

          {/* ORIGINAL ISSUE */}

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5">

            <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
              Original Issue
            </p>

            <p className="text-sm leading-6 text-slate-300 whitespace-pre-wrap">
              {ticket.description ||
                ticket.issue ||
                "No description provided."}
            </p>

          </div>

          {/* CONVERSATION */}

          <div>

            <h3 className="font-semibold mb-4">
              Conversation
            </h3>

            <div className="space-y-3">

              {messages.length === 0 ? (

                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 text-sm text-slate-500">
                  No messages yet.
                </div>

              ) : (

                messages.map(
                  (
                    message,
                    index
                  ) => {

                    const mine =
                      message.author_id ===
                      user.id;

                    return (
                      <div
                        key={
                          message.id ||
                          index
                        }
                        className={`flex ${mine
                          ? "justify-end"
                          : "justify-start"
                          }`}
                      >

                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${mine
                            ? "bg-blue-600"
                            : "bg-slate-800"
                            }`}
                        >

                          <div className="text-xs opacity-70 mb-1">
                            {message.author_name ||
                              message.name ||
                              (mine
                                ? "You"
                                : "User")}
                          </div>

                          <p className="text-sm whitespace-pre-wrap">
                            {message.body}
                          </p>

                          {message.created_at && (
                            <div className="text-[10px] opacity-50 mt-2">
                              {formatDate(
                                message.created_at
                              )}
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>

        </div>

        {/* REPLY */}

        <div className="border-t border-slate-800 p-4">

          <div className="flex gap-3">

            <textarea
              value={reply}
              onChange={(e) =>
                setReply(
                  e.target.value
                )
              }
              placeholder="Write a reply..."
              rows="2"
              className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
            />

            <button
              onClick={sendReply}
              disabled={
                sending ||
                !reply.trim()
              }
              className="self-end rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-40"
            >
              {sending
                ? "Sending..."
                : "Send"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   AGENT DASHBOARD
========================================================= */

function AgentDashboard({
  user,
  token,
  logout,
}) {
  const [tickets, setTickets] =
    useState([]);

  const [selected, setSelected] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const load = async () => {
    try {
      const response =
        await api.get(
          "/api/tickets",
          config
        );

      setTickets(
        response.data?.tickets ||
        response.data ||
        []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openTicket = async (
    ticket
  ) => {
    try {
      const response =
        await api.get(
          `/api/tickets/${ticket.id}`,
          config
        );

      setSelected(
        response.data?.ticket ||
        response.data
      );
    } catch (error) {
      console.error(error);
    }
  };

  const counts = {
    total: tickets.length,

    open: tickets.filter(
      (ticket) =>
        ticket.status === "OPEN"
    ).length,

    progress: tickets.filter(
      (ticket) =>
        ticket.status ===
        "IN_PROGRESS"
    ).length,

    resolved: tickets.filter(
      (ticket) =>
        ticket.status === "RESOLVED"
    ).length,
  };

  return (
    <SimpleDashboard
      title="Agent Dashboard"
      subtitle="Manage your assigned support tickets"
      user={user}
      logout={logout}
      loading={loading}
      stats={[
        ["Assigned", counts.total],
        ["Open", counts.open],
        [
          "In Progress",
          counts.progress,
        ],
        [
          "Resolved",
          counts.resolved,
        ],
      ]}
      tickets={tickets}
      onTicketClick={openTicket}
    >

      {selected && (
        <TicketModal
          ticket={selected}
          token={token}
          user={user}
          onClose={() =>
            setSelected(null)
          }
          onUpdated={() => {
            setSelected(null);
            load();
          }}
        />
      )}

    </SimpleDashboard>
  );
}

/* =========================================================
   CUSTOMER DASHBOARD
========================================================= */

function CustomerDashboard({
  user,
  token,
  logout,
}) {
  const [tickets, setTickets] =
    useState([]);

  const [selected, setSelected] =
    useState(null);

  const [showCreate, setShowCreate] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const load = async () => {
    try {
      const response =
        await api.get(
          "/api/tickets",
          config
        );

      setTickets(
        response.data?.tickets ||
        response.data ||
        []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openTicket = async (
    ticket
  ) => {
    try {
      const response =
        await api.get(
          `/api/tickets/${ticket.id}`,
          config
        );

      setSelected(
        response.data?.ticket ||
        response.data
      );
    } catch (error) {
      console.error(error);
    }
  };

  const counts = {
    total: tickets.length,

    open: tickets.filter(
      (ticket) =>
        ticket.status === "OPEN"
    ).length,

    progress: tickets.filter(
      (ticket) =>
        ticket.status ===
        "IN_PROGRESS"
    ).length,

    resolved: tickets.filter(
      (ticket) =>
        ticket.status === "RESOLVED"
    ).length,
  };

  return (
    <>
      <SimpleDashboard
        title="Customer Dashboard"
        subtitle="Track and manage your support requests"
        user={user}
        logout={logout}
        loading={loading}
        stats={[
          ["My Tickets", counts.total],
          ["Open", counts.open],
          [
            "In Progress",
            counts.progress,
          ],
          [
            "Resolved",
            counts.resolved,
          ],
        ]}
        tickets={tickets}
        onTicketClick={openTicket}
        createButton={
          <button
            onClick={() =>
              setShowCreate(true)
            }
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
          >
            + New Ticket
          </button>
        }
      />

      {selected && (
        <TicketModal
          ticket={selected}
          token={token}
          user={user}
          onClose={() =>
            setSelected(null)
          }
          onUpdated={() => {
            setSelected(null);
            load();
          }}
        />
      )}

      {showCreate && (
        <CreateTicketModal
          token={token}
          onClose={() =>
            setShowCreate(false)
          }
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </>
  );
}

/* =========================================================
   SIMPLE DASHBOARD
========================================================= */

function SimpleDashboard({
  title,
  subtitle,
  user,
  logout,
  loading,
  stats,
  tickets,
  onTicketClick,
  createButton,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="border-b border-slate-800 bg-slate-900/70">

        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-5 flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold">
              {title}
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>

          </div>

          <div className="flex items-center gap-3">

            {createButton}

            <div className="hidden md:block text-right">

              <p className="text-sm font-medium">
                {user.name ||
                  user.email}
              </p>

              <p className="text-xs text-slate-500">
                {user.role}
              </p>

            </div>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">

          {stats.map(
            ([label, value]) => (
              <StatCard
                key={label}
                title={label}
                value={value}
                icon="•"
                color="blue"
              />
            )
          )}

        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">

          <div className="p-6 border-b border-slate-800">

            <h2 className="font-semibold text-lg">
              Tickets
            </h2>

          </div>

          {loading ? (
            <Loading />
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No tickets found.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">

              {tickets.map(
                (ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() =>
                      onTicketClick(
                        ticket
                      )
                    }
                  />
                )
              )}

            </div>
          )}

        </div>

      </main>

      {children}

    </div>
  );
}

/* =========================================================
   CREATE TICKET
========================================================= */

function CreateTicketModal({
  token,
  onClose,
  onCreated,
}) {
  const [subject, setSubject] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("GENERAL");

  const [priority, setPriority] =
    useState("MEDIUM");

  const [loading, setLoading] =
    useState(false);

  const submit = async () => {
    if (
      !subject.trim() ||
      !description.trim()
    ) {
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/api/tickets",
        {
          subject,
          description,
          category,
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onCreated();

    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Failed to create ticket"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-xl font-bold">
            Create New Ticket
          </h2>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-slate-800"
          >
            ✕
          </button>

        </div>

        <div className="space-y-4">

          <input
            value={subject}
            onChange={(e) =>
              setSubject(
                e.target.value
              )
            }
            placeholder="Ticket subject"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows="5"
            placeholder="Describe your issue..."
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <div className="grid grid-cols-2 gap-3">

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
            >
              <option value="GENERAL">
                General
              </option>

              <option value="TECHNICAL">
                Technical
              </option>

              <option value="BILLING">
                Billing
              </option>

              <option value="ACCOUNT">
                Account
              </option>
            </select>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"
            >
              <option value="LOW">
                Low
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="URGENT">
                Urgent
              </option>
            </select>

          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Ticket"}
          </button>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function AdminNavButton({
  active,
  onClick,
  icon,
  children,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${active
        ? "bg-blue-600 text-white"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span>{icon}</span>
      {children}
    </button>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}) {
  const colors = {
    blue:
      "bg-blue-500/10 text-blue-300",
    purple:
      "bg-purple-500/10 text-purple-300",
    cyan:
      "bg-cyan-500/10 text-cyan-300",
    emerald:
      "bg-emerald-500/10 text-emerald-300",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

      <div className="flex items-center justify-between">

        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${colors[color] ||
            colors.blue
            }`}
        >
          {icon}
        </div>

        <span className="text-xs text-slate-500">
          Platform
        </span>

      </div>

      <p className="text-2xl font-bold mt-5">
        {value}
      </p>

      <p className="text-sm text-slate-500 mt-1">
        {title}
      </p>

    </div>
  );
}

function MiniStat({
  label,
  value,
  className,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p
        className={`text-3xl font-bold mt-2 ${className}`}
      >
        {value}
      </p>

    </div>
  );
}

function AnalyticsCard({
  title,
  data,
}) {
  const max = Math.max(
    ...data.map(
      (item) => item.value
    ),
    1
  );

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">

      <h3 className="font-semibold">
        {title}
      </h3>

      <div className="mt-6 space-y-5">

        {data.length === 0 ? (
          <p className="text-sm text-slate-500">
            No data available
          </p>
        ) : (
          data.map((item) => (
            <div key={item.label}>

              <div className="flex justify-between text-xs mb-2">

                <span className="text-slate-400">
                  {item.label}
                </span>

                <span className="text-slate-300">
                  {item.value}
                </span>

              </div>

              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">

                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.max(
                      (item.value /
                        max) *
                      100,
                      item.value > 0
                        ? 5
                        : 0
                    )}%`,
                  }}
                />

              </div>

            </div>
          ))
        )}

      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-5 hover:bg-slate-800/40 transition"
    >

      <div className="flex flex-col md:flex-row md:items-center gap-4">

        <div className="md:w-32">

          <p className="text-xs text-blue-400 font-semibold">
            #
            {ticket.ticket_no ||
              ticket.id?.slice(
                0,
                8
              )}
          </p>

          <p className="text-xs text-slate-600 mt-1">
            {formatDate(
              ticket.created_at
            )}
          </p>

        </div>

        <div className="flex-1 min-w-0">

          <p className="font-medium truncate">
            {ticket.subject ||
              "No subject"}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {ticket.customer_name ||
              ticket.creator_name ||
              ticket.customer_email ||
              "Customer"}
          </p>

        </div>

        <PriorityBadge
          priority={
            ticket.priority
          }
        />

        <StatusBadge
          status={ticket.status}
        />

      </div>

    </button>
  );
}

function StatusBadge({
  status,
}) {
  const value = String(
    status || "UNKNOWN"
  ).toUpperCase();

  const styles = {
    OPEN:
      "bg-blue-500/10 text-blue-300 border-blue-500/20",

    IN_PROGRESS:
      "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",

    RESOLVED:
      "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",

    CLOSED:
      "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[value] ||
        styles.CLOSED
        }`}
    >
      {value.replace(
        "_",
        " "
      )}
    </span>
  );
}

function PriorityBadge({
  priority,
}) {
  const value = String(
    priority || "MEDIUM"
  ).toUpperCase();

  const styles = {
    LOW:
      "bg-slate-500/10 text-slate-300",

    MEDIUM:
      "bg-blue-500/10 text-blue-300",

    HIGH:
      "bg-orange-500/10 text-orange-300",

    URGENT:
      "bg-red-500/10 text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[value] ||
        styles.MEDIUM
        }`}
    >
      {value}
    </span>
  );
}

function AvailabilityBadge({
  available,
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] ${available
        ? "bg-emerald-500/10 text-emerald-300"
        : "bg-slate-500/10 text-slate-400"
        }`}
    >
      {available
        ? "Available"
        : "Offline"}
    </span>
  );
}

function InfoBox({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">

      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="text-sm font-medium mt-2 truncate">
        {value}
      </p>

    </div>
  );
}

function Loading() {
  return (
    <div className="p-12 text-center text-slate-500">
      Loading...
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) return "";

  try {
    return new Date(
      date
    ).toLocaleString();
  } catch {
    return "";
  }
}

function getPriorityData(
  stats,
  tickets
) {
  const source =
    stats?.priority_counts ||
    stats?.priorityCounts ||
    stats?.priorities;

  if (
    source &&
    !Array.isArray(source)
  ) {
    return Object.entries(
      source
    ).map(
      ([label, value]) => ({
        label,
        value:
          Number(value) || 0,
      })
    );
  }

  const values = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
  ];

  return values.map(
    (label) => ({
      label,
      value: tickets.filter(
        (ticket) =>
          String(
            ticket.priority
          ).toUpperCase() ===
          label
      ).length,
    })
  );
}

function getCategoryData(
  stats,
  tickets
) {
  const source =
    stats?.category_counts ||
    stats?.categoryCounts ||
    stats?.categories;

  if (
    source &&
    !Array.isArray(source)
  ) {
    return Object.entries(
      source
    ).map(
      ([label, value]) => ({
        label,
        value:
          Number(value) || 0,
      })
    );
  }

  const map = {};

  tickets.forEach(
    (ticket) => {
      const category =
        ticket.category ||
        "GENERAL";

      map[category] =
        (map[category] || 0) +
        1;
    }
  );

  return Object.entries(
    map
  ).map(
    ([label, value]) => ({
      label,
      value,
    })
  );
}

/* =========================================================
   IMPORTANT
========================================================= */

export default App;