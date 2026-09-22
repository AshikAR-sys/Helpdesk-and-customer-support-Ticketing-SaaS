# 🎫 HelpDesk — Customer Support Ticketing SaaS

<div align="center">

### 🚀 A modern full-stack ticket management platform for customers, support agents, and administrators.

**React + Tailwind CSS • Flask • PostgreSQL • JWT Authentication**

<br/>

![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Style-Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Flask](https://img.shields.io/badge/Backend-Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

<br/>

![Status](https://img.shields.io/badge/Status-Completed-success?style=flat-square)
![License](https://img.shields.io/badge/License-Included-blue?style=flat-square)

</div>

---

## ✨ About the Project

**HelpDesk** is a full-stack **Customer Support Ticketing SaaS** designed to manage support requests from creation to resolution.

The platform provides separate experiences for:

- 👤 **Customers** — create and track support tickets
- 🧑‍💻 **Agents** — manage assigned tickets and communicate with customers
- 🛡️ **Administrators** — monitor tickets, users, agents, workload, and support activity

The system combines a modern React interface with a Flask REST API and PostgreSQL database to provide a complete ticket management workflow.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🔐 **Secure Authentication** | JWT-based login with bcrypt password hashing |
| 👤 **Role-Based Access** | Separate Customer, Agent, and Admin experiences |
| 🎫 **Ticket Management** | Create, view, update, resolve, and close tickets |
| 🤖 **Agent Assignment** | Tickets can be routed according to support category |
| 💬 **Ticket Conversation** | Customers and agents can communicate inside a ticket |
| 📊 **Admin Dashboard** | Centralized statistics and support monitoring |
| 👥 **Agent Management** | View agents and their ticket workload |
| 🔎 **Ticket Search & Filters** | Search and filter tickets by relevant attributes |
| ⚡ **REST API** | Clean API-based communication between frontend and backend |
| 🗄️ **PostgreSQL** | Persistent relational database storage |
| 📱 **Responsive UI** | Modern interface designed for different screen sizes |

---

# 🎯 User Roles & Capabilities

## 👤 Customer

Customers can:

- 🔑 Login to the platform
- ➕ Create a new support ticket
- 🏷️ Select ticket category
- 🚨 Set ticket priority
- 📋 View their submitted tickets
- 🔍 Open complete ticket details
- 💬 View ticket conversations
- ✉️ Reply to support agents
- 📌 Track ticket status

---

## 🧑‍💻 Support Agent

Agents can:

- 🔑 Login securely
- 📥 View assigned tickets
- 🔍 Open ticket details
- 💬 Reply to customers
- 🔄 Update ticket status
- 📊 Monitor assigned workload
- ✅ Resolve support requests
- 🔒 Close completed tickets

---

## 🛡️ Administrator

Administrators can:

- 📊 View platform statistics
- 🎫 Monitor all tickets
- 🔎 Search and filter tickets
- 👥 View support agents
- 📈 Monitor agent workload
- 🧾 Open complete ticket details
- 🔄 Monitor ticket status
- 🏢 Manage overall support operations

---

# 🔄 Ticket Lifecycle

```text
┌───────────────┐
│    Customer   │
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│   Create Ticket   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Category/Priority │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Agent Assignment │
└────────┬──────────┘
         │
         ▼
┌───────────────┐
│     OPEN      │
└───────┬───────┘
        │
        ▼
┌────────────────┐
│  IN_PROGRESS   │
└───────┬────────┘
        │
        ▼
┌───────────────┐
│   RESOLVED    │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│    CLOSED     │
└───────────────┘
```

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────────┐
                    │        CUSTOMER         │
                    │       AGENT / ADMIN     │
                    └────────────┬────────────┘
                                 │
                                 │ Browser
                                 ▼
                    ┌─────────────────────────┐
                    │    React + Tailwind     │
                    │       Frontend          │
                    │     localhost:5173      │
                    └────────────┬────────────┘
                                 │
                                 │ REST API / JSON
                                 ▼
                    ┌─────────────────────────┐
                    │      Flask Backend      │
                    │      JWT Security       │
                    │     localhost:5000      │
                    └────────────┬────────────┘
                                 │
                                 │ SQL
                                 ▼
                    ┌─────────────────────────┐
                    │       PostgreSQL        │
                    │        Database         │
                    └─────────────────────────┘
```

---

# 🧰 Technology Stack

### Frontend

- ⚛️ **React**
- ⚡ **Vite**
- 🎨 **Tailwind CSS**
- 🔗 **Axios**

### Backend

- 🐍 **Python**
- 🌶️ **Flask**
- 🔐 **JWT Authentication**
- 🔒 **bcrypt**
- 🌐 **Flask-CORS**

### Database

- 🐘 **PostgreSQL**
- 🔌 **psycopg2**

### Development

- 💻 VS Code
- 🌿 Git
- 🐙 GitHub
- 🐍 Python Virtual Environment
- 📦 npm

---

# 📁 Project Structure

```text
Helpdesk-and-customer-support-Ticketing-SaaS/
│
├── 📂 backend-flask/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/
│
├── 📂 database/
│   └── PostgreSQL database files/scripts
│
├── 📂 docs/
│   └── project documentation
│
├── 📂 frontend-react/
│   ├── 📂 src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── LICENSE
├── PROJECT_FLOW.md
└── README.md
```

---

# ⚙️ Getting Started

Follow the steps below to run the project locally.

## 1️⃣ Prerequisites

Make sure these are installed:

- Node.js
- npm
- Python 3
- PostgreSQL
- Git

Verify:

```powershell
node --version
npm --version
python --version
psql --version
git --version
```

---

## 2️⃣ Clone the Repository

```powershell
git clone https://github.com/AshikAR-sys/Helpdesk-and-customer-support-Ticketing-SaaS.git
```

Enter the project:

```powershell
cd Helpdesk-and-customer-support-Ticketing-SaaS
```

---

# 🐍 Backend Setup

Open a terminal in the project root.

```powershell
cd backend-flask
```

### Create virtual environment

```powershell
python -m venv venv
```

### Activate virtual environment — Windows

```powershell
.\venv\Scripts\Activate.ps1
```

### Install dependencies

```powershell
pip install -r requirements.txt
```

---

## 🔐 Backend Environment Variables

Create:

```text
backend-flask/.env
```

Example:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```

⚠️ **Never upload your real `.env` file or database password to GitHub.**

---

## ▶️ Start Flask Backend

```powershell
python app.py
```

Backend:

```text
http://127.0.0.1:5000
```

---

# ⚛️ Frontend Setup

Open a **second terminal**.

From the project root:

```powershell
cd frontend-react
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔌 API Overview

### 🔐 Authentication

```http
POST /api/auth/login
GET  /api/auth/me
```

### 🎫 Tickets

```http
POST  /api/tickets
GET   /api/tickets
GET   /api/tickets/<ticket_id>
PATCH /api/tickets/<ticket_id>/status
POST  /api/tickets/<ticket_id>/messages
```

### 🛡️ Administration

```http
GET /api/admin/stats
GET /api/admin/agents
```

### 🗄️ Database Test

```http
GET /api/db-test
```

---

# 🗄️ Database Model

The application uses PostgreSQL with three core entities.

```text
┌──────────────┐
│    USERS     │
├──────────────┤
│ id           │
│ name         │
│ email        │
│ password     │
│ role         │
│ category     │
│ availability │
└──────┬───────┘
       │
       │ creates / assigned
       ▼
┌──────────────────┐
│     TICKETS      │
├──────────────────┤
│ id               │
│ ticket_no        │
│ subject          │
│ description      │
│ category         │
│ priority         │
│ status           │
│ creator_id       │
│ assignee_id      │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         │ has
         ▼
┌──────────────────┐
│ TICKET_MESSAGES  │
├──────────────────┤
│ id               │
│ ticket_id        │
│ author_id        │
│ body             │
│ created_at       │
└──────────────────┘
```

---

# 🚦 Ticket Priority

| Priority | Meaning |
|---|---|
| 🟢 `LOW` | Normal / low urgency |
| 🟡 `MEDIUM` | Standard support request |
| 🟠 `HIGH` | Important issue |
| 🔴 `URGENT` | Critical support request |

---

# 📌 Ticket Status

| Status | Description |
|---|---|
| 🔵 `OPEN` | New ticket awaiting action |
| 🟣 `IN_PROGRESS` | Agent is working on the issue |
| 🟢 `RESOLVED` | Issue has been resolved |
| ⚫ `CLOSED` | Ticket has been completed and closed |

---

# 🔐 Security

The application implements:

- 🔑 JWT authentication
- 🔒 bcrypt password hashing
- 👥 Role-based authorization
- 🛡️ Protected API endpoints
- 🌐 CORS configuration
- 🔐 Environment-based secrets

### Never commit:

```text
.env
Database passwords
JWT secrets
Production credentials
Private API keys
```

Use an `.env.example` file to document required variables without exposing secrets.

---

# 🧪 Testing Checklist

Before the final demonstration, verify the complete workflow:

### Backend

- [ ] Flask server starts successfully
- [ ] PostgreSQL connection works
- [ ] `/api/db-test` returns successfully
- [ ] No backend errors in terminal

### Authentication

- [ ] Customer login works
- [ ] Agent login works
- [ ] Admin login works
- [ ] Invalid credentials are rejected

### Customer Flow

- [ ] Customer can create a ticket
- [ ] Ticket number is generated
- [ ] Category and priority are saved
- [ ] Customer can view the ticket
- [ ] Customer can see status changes
- [ ] Customer can reply

### Agent Flow

- [ ] Agent can view assigned tickets
- [ ] Agent can open ticket details
- [ ] Agent can reply
- [ ] Agent can update status
- [ ] Resolved tickets are displayed correctly

### Admin Flow

- [ ] Admin dashboard loads
- [ ] Statistics are displayed
- [ ] All tickets are visible
- [ ] Ticket filters work
- [ ] Agent information loads
- [ ] Ticket details open correctly

### GitHub

- [ ] `.env` is not committed
- [ ] Repository is up to date
- [ ] README is updated
- [ ] Working tree is clean

---

# 🖥️ Application Screens

> Add your final project screenshots here after taking them from the running application.

### 🔐 Login

```text
screenshots/login.png
```

### 🛡️ Admin Dashboard

```text
screenshots/admin-dashboard.png
```

### 🎫 Ticket Management

```text
screenshots/tickets.png
```

### 👤 Customer Dashboard

```text
screenshots/customer-dashboard.png
```

### 🧑‍💻 Agent Dashboard

```text
screenshots/agent-dashboard.png
```

---

# 📚 Project Documentation

Additional project information:

- 📄 `PROJECT_FLOW.md`
- 📂 `docs/`
- 🗄️ `database/`

These documents can contain the detailed project flow, database documentation, diagrams, and supporting capstone material.

---

# 🎓 Capstone Project Information

| Category | Details |
|---|---|
| **Project Name** | HelpDesk – Customer Support Ticketing SaaS |
| **Project Type** | Full-Stack Web Application |
| **Domain** | Customer Support / SaaS |
| **Frontend** | React + Tailwind CSS |
| **Backend** | Flask |
| **Database** | PostgreSQL |
| **Authentication** | JWT + bcrypt |
| **API Style** | REST API |
| **Version Control** | Git + GitHub |

---

# 💡 Core Concepts Demonstrated

This project demonstrates practical knowledge of:

- Full-stack web application development
- React component architecture
- REST API development
- JWT authentication
- Role-based access control
- Password hashing
- PostgreSQL relational database design
- CRUD operations
- Ticket workflow management
- Agent assignment
- Customer-agent communication
- Dashboard development
- API integration with Axios
- Responsive UI design
- Git and GitHub workflow

---

# 🌱 Future Enhancements

Possible future improvements include:

- 📧 Email notifications
- 🔔 Real-time notifications
- 📎 File attachments
- 🔍 Advanced ticket search
- 📈 More detailed analytics
- 🧑‍💻 Agent availability management
- ⭐ Customer feedback and ticket rating
- 🌐 Production deployment
- 🐳 Docker support
- ☁️ Cloud database and hosting

---

# 🌿 Git Workflow

After making changes:

```powershell
git status
git add .
git commit -m "Update HelpDesk application"
git push origin main
```

Check:

```powershell
git status
```

Expected:

```text
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

---

# 👨‍💻 Author

<div align="center">

### **Ashik AR**

**B.Tech Information Technology**

💻 Full-Stack Development • Cloud • AI & Software Engineering

<br/>

⭐ If you find this project useful, consider giving the repository a star!

</div>

---

# 📜 License

This project is distributed under the license included in this repository.

---

<div align="center">

### 🎫 HelpDesk

**Create • Assign • Communicate • Resolve**

Built as a full-stack customer support ticketing platform.

</div>
