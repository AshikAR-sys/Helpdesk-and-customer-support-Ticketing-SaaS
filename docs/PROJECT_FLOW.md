# Project Flow

## Customer flow

1. Customer opens HelpDesk.
2. Customer logs in.
3. Dashboard displays current tickets.
4. Customer clicks New Ticket.
5. Subject, description, category and priority are submitted.
6. Backend validates the request.
7. Routing service finds an available matching agent.
8. Ticket is stored in PostgreSQL.
9. Customer sees the assigned agent and ticket conversation.

## Agent flow

1. Agent logs in.
2. Dashboard shows assigned workload.
3. Agent opens a ticket.
4. Agent sends a response.
5. Ticket automatically becomes IN_PROGRESS.
6. Agent can mark the ticket RESOLVED/CLOSED.

## Routing specialization

Current algorithm:

Ticket category
   ↓
Available agents
   ↓
Category/skill matching
   ↓
Count active tickets
   ↓
Least-loaded agent
   ↓
Assign ticket

Future high-scale architecture:

API
 ↓
Ticket Queue
 ↓
Redis/BullMQ
 ↓
Routing Worker
 ↓
Agent workload store
 ↓
PostgreSQL

This allows routing to run asynchronously and scale horizontally.
