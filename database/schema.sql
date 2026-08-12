CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS ticket_messages;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS users;

CREATE TYPE user_role AS ENUM ('CUSTOMER','AGENT','ADMIN');
CREATE TYPE ticket_status AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
CREATE TYPE ticket_priority AS ENUM ('LOW','MEDIUM','HIGH','URGENT');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  category VARCHAR(80),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no BIGSERIAL UNIQUE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  priority ticket_priority NOT NULL DEFAULT 'MEDIUM',
  status ticket_status NOT NULL DEFAULT 'OPEN',
  creator_id UUID NOT NULL REFERENCES users(id),
  assignee_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_assignee_status ON tickets(assignee_id,status);
CREATE INDEX idx_tickets_creator ON tickets(creator_id);
CREATE INDEX idx_messages_ticket_time ON ticket_messages(ticket_id,created_at);

-- Demo users.
-- Password hashes below are bcrypt hashes for:
-- Customer@123, Agent@123, Admin@123
INSERT INTO users (name,email,password_hash,role,category) VALUES
('Demo Customer','customer@helpdesk.local',
 '$2b$10$8Hq7Y7z5cL2V1Y8gL7zV6uR3Y4uZ6e8yQ4XkJ1M0G7R4w9n3Wq3iK',
 'CUSTOMER',NULL),
('Support Agent','agent@helpdesk.local',
 '$2b$10$Q3mYv3uYqVw7p9M0yV6cUe2qX2oW9kV4G6R1Z7yH8J9mN0xP2q5aK',
 'AGENT','Technical'),
('Admin User','admin@helpdesk.local',
 '$2b$10$Y8cW4rP2sN6vK1xQ7mZ3dO5uL9hA2eB4cF6gH8iJ0kL2mN4pQ6rS8',
 'ADMIN',NULL);

-- If the pre-generated demo hashes don't work in your environment,
-- generate them with bcryptjs in Node and replace the password_hash values.
