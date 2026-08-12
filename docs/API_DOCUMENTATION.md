# HelpDesk API

Base URL:
http://localhost:5000/api

## Authentication

POST /auth/login

Body:
{
  "email": "customer@helpdesk.local",
  "password": "Customer@123"
}

GET /auth/me

POST /auth/logout

## Tickets

GET /tickets
Returns tickets relevant to the logged-in user's role.

POST /tickets
Customer only.

Body:
{
  "subject": "Unable to login",
  "description": "I cannot access my account.",
  "category": "Account",
  "priority": "HIGH"
}

GET /tickets/:id

POST /tickets/:id/messages

Body:
{
  "body": "We are investigating the issue."
}

PATCH /tickets/:id

Body:
{
  "status": "RESOLVED"
}

## Dashboard

GET /dashboard

Returns:
- total
- open
- inProgress
- resolved
- ticket list
