import os
from functools import wraps

import bcrypt
import jwt
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv


# =========================================================
# CONFIG
# =========================================================

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET = os.getenv("JWT_SECRET", "helpdesk_secret_key")


# =========================================================
# DATABASE
# =========================================================

def get_db():
    return psycopg2.connect(DATABASE_URL)


def get_cursor(conn):
    return conn.cursor(cursor_factory=RealDictCursor)


# =========================================================
# AUTH
# =========================================================

def token_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        auth = request.headers.get("Authorization")

        if not auth:
            return jsonify({
                "error": "Authorization token required"
            }), 401

        try:

            token = auth.replace("Bearer ", "", 1)

            decoded = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"]
            )

            request.user = decoded

            request.user_id = str(
                decoded.get("id")
            )

            if not request.user_id:
                return jsonify({
                    "error": "Invalid user token"
                }), 401

        except Exception as e:

            print("AUTH ERROR:", e)

            return jsonify({
                "error": "Invalid or expired token"
            }), 401

        return f(*args, **kwargs)

    return decorated


# =========================================================
# ADMIN ONLY
# =========================================================

def admin_required(f):

    @wraps(f)
    def decorated(*args, **kwargs):

        role = str(
            request.user.get("role", "")
        ).upper()

        if role != "ADMIN":
            return jsonify({
                "error": "Admin access required"
            }), 403

        return f(*args, **kwargs)

    return decorated


# =========================================================
# HOME
# =========================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "HelpDesk Flask Backend Running"
    })


# =========================================================
# DB TEST
# =========================================================

@app.route("/api/db-test", methods=["GET"])
def db_test():

    conn = None
    cur = None

    try:

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            "SELECT NOW() AS current_time"
        )

        row = cur.fetchone()

        return jsonify({
            "message": "PostgreSQL Connected Successfully",
            "time": str(
                row.get("current_time")
            )
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# LOGIN
# =========================================================

@app.route("/api/auth/login", methods=["POST"])
def login():

    conn = None
    cur = None

    try:

        data = request.get_json() or {}

        email = str(
            data.get("email", "")
        ).strip().lower()

        password = str(
            data.get("password", "")
        )

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                id,
                name,
                email,
                password_hash,
                role,
                category,
                is_available
            FROM users
            WHERE LOWER(email) = LOWER(%s)
            LIMIT 1
            """,
            (email,)
        )

        user = cur.fetchone()

        if not user:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        password_hash = user.get(
            "password_hash"
        )

        if isinstance(password_hash, str):
            password_hash = password_hash.encode()

        if not bcrypt.checkpw(
            password.encode(),
            password_hash
        ):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        user_id = str(
            user.get("id")
        )

        token = jwt.encode(
            {
                "id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role")
            },
            JWT_SECRET,
            algorithm="HS256"
        )

        return jsonify({

            "message": "Login successful",

            "token": token,

            "user": {
                "id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role"),
                "category": user.get("category"),
                "is_available": user.get("is_available")
            }

        }), 200

    except Exception as e:

        print("LOGIN ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# CURRENT USER
# =========================================================

@app.route("/api/auth/me", methods=["GET"])
@token_required
def current_user():

    conn = None
    cur = None

    try:

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                id,
                name,
                email,
                role,
                category,
                is_available
            FROM users
            WHERE id = %s::uuid
            """,
            (request.user_id,)
        )

        user = cur.fetchone()

        if not user:
            return jsonify({
                "error": "User not found"
            }), 404

        return jsonify({
            "user": {
                "id": str(user.get("id")),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": user.get("role"),
                "category": user.get("category"),
                "is_available": user.get("is_available")
            }
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# SMART ROUTING
# =========================================================

def find_agent(category, conn):

    cur = None

    try:

        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                u.id AS agent_id,
                u.name AS agent_name,
                u.email AS agent_email,
                u.category AS agent_category,
                COUNT(t.id) AS active_tickets

            FROM users u

            LEFT JOIN tickets t
                ON t.assignee_id = u.id
                AND t.status IN (
                    'OPEN'::ticket_status,
                    'IN_PROGRESS'::ticket_status
                )

            WHERE
                u.role = 'AGENT'::user_role
                AND u.is_available = TRUE
                AND (
                    u.category = %s
                    OR u.category IS NULL
                    OR u.category = 'General'
                )

            GROUP BY
                u.id,
                u.name,
                u.email,
                u.category

            ORDER BY
                CASE
                    WHEN u.category = %s THEN 0
                    WHEN u.category = 'General' THEN 1
                    ELSE 2
                END,
                COUNT(t.id) ASC

            LIMIT 1
            """,
            (
                category,
                category
            )
        )

        return cur.fetchone()

    finally:

        if cur:
            cur.close()


# =========================================================
# CREATE TICKET
# =========================================================

@app.route("/api/tickets", methods=["POST"])
@token_required
def create_ticket():

    conn = None
    cur = None

    try:

        data = request.get_json() or {}

        subject = str(
            data.get("subject", "")
        ).strip()

        description = str(
            data.get("description", "")
        ).strip()

        category = str(
            data.get("category", "General")
        ).strip()

        priority = str(
            data.get("priority", "LOW")
        ).upper().strip()

        if not subject:
            return jsonify({
                "error": "Subject is required"
            }), 400

        if not description:
            return jsonify({
                "error": "Description is required"
            }), 400

        if category not in [
            "Technical",
            "Billing",
            "Account",
            "General"
        ]:
            return jsonify({
                "error": "Invalid category"
            }), 400

        if priority not in [
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
        ]:
            return jsonify({
                "error": "Invalid priority"
            }), 400

        conn = get_db()

        agent = find_agent(
            category,
            conn
        )

        assignee_id = None

        if agent:
            assignee_id = agent.get(
                "agent_id"
            )

        cur = get_cursor(conn)

        cur.execute(
            """
            INSERT INTO tickets
            (
                subject,
                description,
                category,
                priority,
                status,
                creator_id,
                assignee_id
            )

            VALUES
            (
                %s,
                %s,
                %s,
                %s::ticket_priority,
                'OPEN'::ticket_status,
                %s::uuid,
                %s::uuid
            )

            RETURNING
                id,
                ticket_no,
                subject,
                description,
                category,
                priority,
                status,
                creator_id,
                assignee_id,
                created_at,
                updated_at
            """,
            (
                subject,
                description,
                category,
                priority,
                request.user_id,
                str(assignee_id)
                if assignee_id
                else None
            )
        )

        ticket = cur.fetchone()

        if not ticket:
            raise Exception(
                "Ticket creation failed"
            )

        ticket_id = ticket.get("id")

        cur.execute(
            """
            INSERT INTO ticket_messages
            (
                ticket_id,
                author_id,
                body
            )

            VALUES
            (
                %s::uuid,
                %s::uuid,
                %s
            )
            """,
            (
                str(ticket_id),
                request.user_id,
                description
            )
        )

        conn.commit()

        return jsonify({

            "message":
                "Ticket created successfully",

            "ticket": {
                "id":
                    str(ticket.get("id")),

                "ticket_no":
                    ticket.get("ticket_no"),

                "subject":
                    ticket.get("subject"),

                "description":
                    ticket.get("description"),

                "category":
                    ticket.get("category"),

                "priority":
                    ticket.get("priority"),

                "status":
                    ticket.get("status"),

                "creator_id":
                    str(ticket.get("creator_id")),

                "assignee_id":
                    str(ticket.get("assignee_id"))
                    if ticket.get("assignee_id")
                    else None,

                "created_at":
                    str(ticket.get("created_at"))
            },

            "assigned_agent":
                {
                    "id":
                        str(agent.get("agent_id")),

                    "name":
                        agent.get("agent_name"),

                    "email":
                        agent.get("agent_email"),

                    "category":
                        agent.get("agent_category"),

                    "active_tickets":
                        int(
                            agent.get(
                                "active_tickets",
                                0
                            )
                        )
                }
                if agent else None

        }), 201

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "CREATE TICKET ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# GET TICKETS
# CUSTOMER / AGENT / ADMIN
# =========================================================

@app.route("/api/tickets", methods=["GET"])
@token_required
def get_tickets():

    conn = None
    cur = None

    try:

        conn = get_db()
        cur = get_cursor(conn)

        role = str(
            request.user.get("role", "")
        ).upper()

        if role == "ADMIN":

            cur.execute(
                """
                SELECT
                    t.id,
                    t.ticket_no,
                    t.subject,
                    t.description,
                    t.category,
                    t.priority,
                    t.status,
                    t.creator_id,
                    t.assignee_id,
                    t.created_at,
                    t.updated_at,
                    t.resolved_at,

                    c.name AS customer_name,
                    c.email AS customer_email,

                    a.name AS assignee_name,
                    a.email AS assignee_email

                FROM tickets t

                LEFT JOIN users c
                    ON c.id = t.creator_id

                LEFT JOIN users a
                    ON a.id = t.assignee_id

                ORDER BY
                    t.created_at DESC
                """
            )

        elif role == "AGENT":

            cur.execute(
                """
                SELECT
                    t.id,
                    t.ticket_no,
                    t.subject,
                    t.description,
                    t.category,
                    t.priority,
                    t.status,
                    t.creator_id,
                    t.assignee_id,
                    t.created_at,
                    t.updated_at,
                    t.resolved_at,

                    c.name AS customer_name,
                    c.email AS customer_email

                FROM tickets t

                LEFT JOIN users c
                    ON c.id = t.creator_id

                WHERE
                    t.assignee_id = %s::uuid

                ORDER BY
                    t.created_at DESC
                """,
                (request.user_id,)
            )

        else:

            cur.execute(
                """
                SELECT
                    t.id,
                    t.ticket_no,
                    t.subject,
                    t.description,
                    t.category,
                    t.priority,
                    t.status,
                    t.creator_id,
                    t.assignee_id,
                    t.created_at,
                    t.updated_at,
                    t.resolved_at,

                    a.name AS assignee_name

                FROM tickets t

                LEFT JOIN users a
                    ON a.id = t.assignee_id

                WHERE
                    t.creator_id = %s::uuid

                ORDER BY
                    t.created_at DESC
                """,
                (request.user_id,)
            )

        rows = cur.fetchall()

        tickets = []

        for row in rows:

            ticket = {

                "id":
                    str(row.get("id")),

                "ticket_no":
                    row.get("ticket_no"),

                "subject":
                    row.get("subject"),

                "description":
                    row.get("description"),

                "category":
                    row.get("category"),

                "priority":
                    row.get("priority"),

                "status":
                    row.get("status"),

                "creator_id":
                    str(row.get("creator_id")),

                "assignee_id":
                    str(row.get("assignee_id"))
                    if row.get("assignee_id")
                    else None,

                "created_at":
                    str(row.get("created_at")),

                "updated_at":
                    str(row.get("updated_at")),

                "resolved_at":
                    str(row.get("resolved_at"))
                    if row.get("resolved_at")
                    else None,

                "customer_name":
                    row.get("customer_name"),

                "customer_email":
                    row.get("customer_email"),

                "assignee_name":
                    row.get("assignee_name"),

                "assignee_email":
                    row.get("assignee_email")
            }

            tickets.append(ticket)

        return jsonify({
            "tickets": tickets
        }), 200

    except Exception as e:

        print(
            "GET TICKETS ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# ADMIN DASHBOARD STATS
# =========================================================

@app.route(
    "/api/admin/stats",
    methods=["GET"]
)
@token_required
@admin_required
def admin_stats():

    conn = None
    cur = None

    try:

        conn = get_db()
        cur = get_cursor(conn)

        # USERS

        cur.execute(
            """
            SELECT
                COUNT(*) AS total_users,
                COUNT(*) FILTER (
                    WHERE role = 'AGENT'::user_role
                ) AS total_agents,
                COUNT(*) FILTER (
                    WHERE role = 'CUSTOMER'::user_role
                ) AS total_customers,
                COUNT(*) FILTER (
                    WHERE role = 'ADMIN'::user_role
                ) AS total_admins
            FROM users
            """
        )

        users = cur.fetchone()

        # TICKETS

        cur.execute(
            """
            SELECT
                COUNT(*) AS total_tickets,

                COUNT(*) FILTER (
                    WHERE status =
                    'OPEN'::ticket_status
                ) AS open_tickets,

                COUNT(*) FILTER (
                    WHERE status =
                    'IN_PROGRESS'::ticket_status
                ) AS in_progress_tickets,

                COUNT(*) FILTER (
                    WHERE status =
                    'RESOLVED'::ticket_status
                ) AS resolved_tickets,

                COUNT(*) FILTER (
                    WHERE status =
                    'CLOSED'::ticket_status
                ) AS closed_tickets

            FROM tickets
            """
        )

        tickets = cur.fetchone()

        # PRIORITY

        cur.execute(
            """
            SELECT
                priority,
                COUNT(*) AS count
            FROM tickets
            GROUP BY priority
            ORDER BY count DESC
            """
        )

        priorities = cur.fetchall()

        # CATEGORY

        cur.execute(
            """
            SELECT
                category,
                COUNT(*) AS count
            FROM tickets
            GROUP BY category
            ORDER BY count DESC
            """
        )

        categories = cur.fetchall()

        return jsonify({

            "users": {
                "total":
                    int(
                        users.get(
                            "total_users", 0
                        )
                    ),

                "agents":
                    int(
                        users.get(
                            "total_agents", 0
                        )
                    ),

                "customers":
                    int(
                        users.get(
                            "total_customers", 0
                        )
                    ),

                "admins":
                    int(
                        users.get(
                            "total_admins", 0
                        )
                    )
            },

            "tickets": {
                "total":
                    int(
                        tickets.get(
                            "total_tickets", 0
                        )
                    ),

                "open":
                    int(
                        tickets.get(
                            "open_tickets", 0
                        )
                    ),

                "in_progress":
                    int(
                        tickets.get(
                            "in_progress_tickets",
                            0
                        )
                    ),

                "resolved":
                    int(
                        tickets.get(
                            "resolved_tickets", 0
                        )
                    ),

                "closed":
                    int(
                        tickets.get(
                            "closed_tickets", 0
                        )
                    )
            },

            "priority": [
                {
                    "name":
                        row.get("priority"),

                    "count":
                        int(
                            row.get("count", 0)
                        )
                }
                for row in priorities
            ],

            "categories": [
                {
                    "name":
                        row.get("category"),

                    "count":
                        int(
                            row.get("count", 0)
                        )
                }
                for row in categories
            ]

        }), 200

    except Exception as e:

        print(
            "ADMIN STATS ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# ADMIN AGENTS
# =========================================================

@app.route(
    "/api/admin/agents",
    methods=["GET"]
)
@token_required
@admin_required
def admin_agents():

    conn = None
    cur = None

    try:

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                u.id,
                u.name,
                u.email,
                u.category,
                u.is_available,

                COUNT(
                    t.id
                ) FILTER (
                    WHERE t.status IN (
                        'OPEN'::ticket_status,
                        'IN_PROGRESS'::ticket_status
                    )
                ) AS active_tickets,

                COUNT(
                    t.id
                ) AS total_tickets

            FROM users u

            LEFT JOIN tickets t
                ON t.assignee_id = u.id

            WHERE
                u.role = 'AGENT'::user_role

            GROUP BY
                u.id,
                u.name,
                u.email,
                u.category,
                u.is_available

            ORDER BY
                active_tickets DESC,
                u.name ASC
            """
        )

        rows = cur.fetchall()

        agents = []

        for row in rows:

            agents.append({

                "id":
                    str(row.get("id")),

                "name":
                    row.get("name"),

                "email":
                    row.get("email"),

                "category":
                    row.get("category"),

                "is_available":
                    row.get("is_available"),

                "active_tickets":
                    int(
                        row.get(
                            "active_tickets",
                            0
                        )
                    ),

                "total_tickets":
                    int(
                        row.get(
                            "total_tickets",
                            0
                        )
                    )
            })

        return jsonify({
            "agents": agents
        }), 200

    except Exception as e:

        print(
            "ADMIN AGENTS ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# SINGLE TICKET
# =========================================================

@app.route(
    "/api/tickets/<ticket_id>",
    methods=["GET"]
)
@token_required
def get_single_ticket(ticket_id):

    conn = None
    cur = None

    try:

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                t.id,
                t.ticket_no,
                t.subject,
                t.description,
                t.category,
                t.priority,
                t.status,
                t.creator_id,
                t.assignee_id,
                t.created_at,
                t.updated_at,
                t.resolved_at,

                c.name AS customer_name,
                c.email AS customer_email,

                a.name AS assignee_name,
                a.email AS assignee_email

            FROM tickets t

            LEFT JOIN users c
                ON c.id = t.creator_id

            LEFT JOIN users a
                ON a.id = t.assignee_id

            WHERE
                t.id = %s::uuid
            """,
            (ticket_id,)
        )

        ticket = cur.fetchone()

        if not ticket:
            return jsonify({
                "error": "Ticket not found"
            }), 404

        role = str(
            request.user.get("role", "")
        ).upper()

        if role == "CUSTOMER":

            if str(
                ticket.get("creator_id")
            ) != str(request.user_id):

                return jsonify({
                    "error":
                        "You are not allowed to view this ticket"
                }), 403

        elif role == "AGENT":

            if (
                not ticket.get(
                    "assignee_id"
                )
                or
                str(
                    ticket.get(
                        "assignee_id"
                    )
                ) != str(request.user_id)
            ):

                return jsonify({
                    "error":
                        "This ticket is not assigned to you"
                }), 403

        cur.execute(
            """
            SELECT
                tm.id,
                tm.ticket_id,
                tm.author_id,
                tm.body,
                tm.created_at,
                u.name AS author_name,
                u.role AS author_role

            FROM ticket_messages tm

            LEFT JOIN users u
                ON u.id = tm.author_id

            WHERE
                tm.ticket_id = %s::uuid

            ORDER BY
                tm.created_at ASC
            """,
            (ticket_id,)
        )

        messages = cur.fetchall()

        return jsonify({

            "ticket": {

                "id":
                    str(ticket.get("id")),

                "ticket_no":
                    ticket.get("ticket_no"),

                "subject":
                    ticket.get("subject"),

                "description":
                    ticket.get("description"),

                "category":
                    ticket.get("category"),

                "priority":
                    ticket.get("priority"),

                "status":
                    ticket.get("status"),

                "creator_id":
                    str(
                        ticket.get(
                            "creator_id"
                        )
                    ),

                "assignee_id":
                    str(
                        ticket.get(
                            "assignee_id"
                        )
                    )
                    if ticket.get(
                        "assignee_id"
                    )
                    else None,

                "customer_name":
                    ticket.get(
                        "customer_name"
                    ),

                "customer_email":
                    ticket.get(
                        "customer_email"
                    ),

                "assignee_name":
                    ticket.get(
                        "assignee_name"
                    ),

                "assignee_email":
                    ticket.get(
                        "assignee_email"
                    ),

                "created_at":
                    str(
                        ticket.get(
                            "created_at"
                        )
                    ),

                "updated_at":
                    str(
                        ticket.get(
                            "updated_at"
                        )
                    ),

                "resolved_at":
                    str(
                        ticket.get(
                            "resolved_at"
                        )
                    )
                    if ticket.get(
                        "resolved_at"
                    )
                    else None
            },

            "messages": [
                {
                    "id":
                        str(
                            msg.get("id")
                        ),

                    "ticket_id":
                        str(
                            msg.get(
                                "ticket_id"
                            )
                        ),

                    "author_id":
                        str(
                            msg.get(
                                "author_id"
                            )
                        ),

                    "body":
                        msg.get("body"),

                    "created_at":
                        str(
                            msg.get(
                                "created_at"
                            )
                        ),

                    "author_name":
                        msg.get(
                            "author_name"
                        ),

                    "author_role":
                        msg.get(
                            "author_role"
                        )
                }
                for msg in messages
            ]

        }), 200

    except Exception as e:

        print(
            "SINGLE TICKET ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# ADD MESSAGE
# =========================================================

@app.route(
    "/api/tickets/<ticket_id>/messages",
    methods=["POST"]
)
@token_required
def add_message(ticket_id):

    conn = None
    cur = None

    try:

        data = request.get_json() or {}

        body = str(
            data.get("body", "")
        ).strip()

        if not body:
            return jsonify({
                "error": "Message is required"
            }), 400

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                id,
                creator_id,
                assignee_id,
                status
            FROM tickets
            WHERE id = %s::uuid
            """,
            (ticket_id,)
        )

        ticket = cur.fetchone()

        if not ticket:
            return jsonify({
                "error": "Ticket not found"
            }), 404

        role = str(
            request.user.get("role", "")
        ).upper()

        if role == "ADMIN":

            allowed = True

        elif role == "AGENT":

            allowed = (
                ticket.get(
                    "assignee_id"
                )
                and
                str(
                    ticket.get(
                        "assignee_id"
                    )
                ) ==
                str(request.user_id)
            )

        else:

            allowed = (
                str(
                    ticket.get(
                        "creator_id"
                    )
                ) ==
                str(request.user_id)
            )

        if not allowed:

            return jsonify({
                "error":
                    "You are not allowed to reply"
            }), 403

        cur.execute(
            """
            INSERT INTO ticket_messages
            (
                ticket_id,
                author_id,
                body
            )

            VALUES
            (
                %s::uuid,
                %s::uuid,
                %s
            )

            RETURNING
                id,
                ticket_id,
                author_id,
                body,
                created_at
            """,
            (
                ticket_id,
                request.user_id,
                body
            )
        )

        message = cur.fetchone()

        if role == "AGENT":

            cur.execute(
                """
                UPDATE tickets

                SET
                    status =
                        'IN_PROGRESS'::ticket_status,

                    updated_at = NOW()

                WHERE id = %s::uuid
                """,
                (ticket_id,)
            )

        else:

            cur.execute(
                """
                UPDATE tickets

                SET
                    updated_at = NOW()

                WHERE id = %s::uuid
                """,
                (ticket_id,)
            )

        conn.commit()

        return jsonify({

            "message":
                "Reply sent successfully",

            "data": {

                "id":
                    str(
                        message.get("id")
                    ),

                "ticket_id":
                    str(
                        message.get(
                            "ticket_id"
                        )
                    ),

                "author_id":
                    str(
                        message.get(
                            "author_id"
                        )
                    ),

                "body":
                    message.get("body"),

                "created_at":
                    str(
                        message.get(
                            "created_at"
                        )
                    )
            }

        }), 201

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "MESSAGE ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# UPDATE STATUS
# =========================================================

@app.route(
    "/api/tickets/<ticket_id>/status",
    methods=["PATCH"]
)
@token_required
def update_status(ticket_id):

    conn = None
    cur = None

    try:

        data = request.get_json() or {}

        status = str(
            data.get("status", "")
        ).upper().strip()

        if status not in [
            "OPEN",
            "IN_PROGRESS",
            "RESOLVED",
            "CLOSED"
        ]:

            return jsonify({
                "error": "Invalid status"
            }), 400

        conn = get_db()
        cur = get_cursor(conn)

        cur.execute(
            """
            SELECT
                id,
                creator_id,
                assignee_id

            FROM tickets

            WHERE id = %s::uuid
            """,
            (ticket_id,)
        )

        ticket = cur.fetchone()

        if not ticket:
            return jsonify({
                "error": "Ticket not found"
            }), 404

        role = str(
            request.user.get("role", "")
        ).upper()

        if role == "ADMIN":

            allowed = True

        elif role == "AGENT":

            allowed = (
                ticket.get(
                    "assignee_id"
                )
                and
                str(
                    ticket.get(
                        "assignee_id"
                    )
                ) ==
                str(request.user_id)
            )

        else:

            allowed = (
                str(
                    ticket.get(
                        "creator_id"
                    )
                ) ==
                str(request.user_id)
            )

        if not allowed:

            return jsonify({
                "error":
                    "You are not allowed"
            }), 403

        if status in [
            "RESOLVED",
            "CLOSED"
        ]:

            cur.execute(
                """
                UPDATE tickets

                SET
                    status =
                        %s::ticket_status,

                    resolved_at = NOW(),

                    updated_at = NOW()

                WHERE
                    id = %s::uuid

                RETURNING
                    id,
                    ticket_no,
                    status,
                    updated_at,
                    resolved_at
                """,
                (
                    status,
                    ticket_id
                )
            )

        else:

            cur.execute(
                """
                UPDATE tickets

                SET
                    status =
                        %s::ticket_status,

                    resolved_at = NULL,

                    updated_at = NOW()

                WHERE
                    id = %s::uuid

                RETURNING
                    id,
                    ticket_no,
                    status,
                    updated_at,
                    resolved_at
                """,
                (
                    status,
                    ticket_id
                )
            )

        updated = cur.fetchone()

        conn.commit()

        return jsonify({

            "message":
                "Ticket status updated",

            "ticket": {

                "id":
                    str(
                        updated.get("id")
                    ),

                "ticket_no":
                    updated.get(
                        "ticket_no"
                    ),

                "status":
                    updated.get(
                        "status"
                    ),

                "updated_at":
                    str(
                        updated.get(
                            "updated_at"
                        )
                    ),

                "resolved_at":
                    str(
                        updated.get(
                            "resolved_at"
                        )
                    )
                    if updated.get(
                        "resolved_at"
                    )
                    else None
            }

        }), 200

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "STATUS ERROR:",
            e
        )

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cur:
            cur.close()

        if conn:
            conn.close()


# =========================================================
# START
# =========================================================

if __name__ == "__main__":

    print("")
    print("==========================================")
    print("       HELPDESK FLASK BACKEND")
    print("==========================================")
    print("URL: http://127.0.0.1:5000")
    print("Admin API: ENABLED")
    print("==========================================")
    print("")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )