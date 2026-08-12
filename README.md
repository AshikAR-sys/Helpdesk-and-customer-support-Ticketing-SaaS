# HelpDesk SaaS — Separated Full-Stack Project

This version is intentionally separated into folders so it is easy to understand and present:

helpdesk-saas/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── ticket.html
│   ├── create-ticket.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── login.js
│       ├── dashboard.js
│       ├── ticket.js
│       └── create-ticket.js
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── ticketRoutes.js
│   │   └── dashboardRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── ticketController.js
│   │   └── dashboardController.js
│   └── services/
│       └── ticketRouter.js
│
├── database/
│   └── schema.sql
│
└── docs/
    ├── PROJECT_FLOW.md
    └── API_DOCUMENTATION.md

## Technologies

Frontend:
- HTML5
- CSS3
- Vanilla JavaScript

Backend:
- Node.js
- Express.js
- JWT
- bcrypt
- PostgreSQL

Specialization:
Build HelpDesk system with scalable ticket routing and response management.

## Run

### Database

Create a PostgreSQL database called `helpdesk`.

Run:

database/schema.sql

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm start
```

The API runs on http://localhost:5000

### Frontend

Open `frontend/index.html` using VS Code Live Server.

Frontend expects the backend at:

http://localhost:5000/api

## Demo login

After inserting the demo accounts from the SQL file:

Customer:
customer@helpdesk.local
Customer@123

Agent:
agent@helpdesk.local
Agent@123

Admin:
admin@helpdesk.local
Admin@123

## Project flow

Customer -> Create Ticket -> Backend -> Routing Engine -> Agent
Agent -> Reply -> Backend -> Database -> Customer
Admin -> Dashboard -> Monitor -> Manage

## Cloud deployment

Frontend:
- Netlify / Vercel / S3 + CloudFront

Backend:
- AWS EC2 / ECS / Render / Railway / Azure App Service

Database:
- AWS RDS PostgreSQL / Supabase / Neon

Future scalable components:
- Redis
- BullMQ
- S3
- Email service
- Load balancer
- Monitoring
