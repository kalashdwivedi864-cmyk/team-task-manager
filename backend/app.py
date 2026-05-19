from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from models import db, User, Project, Task
from dotenv import load_dotenv
import jwt
import datetime
import bcrypt
from functools import wraps
from datetime import date
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

def find_frontend_build_dir():
    candidates = [
        os.path.join(BASE_DIR, "..", "frontend", "build"),
        os.path.join(BASE_DIR, "frontend", "build"),
        os.path.join(BASE_DIR, "build"),
        os.path.join(BASE_DIR, "static"),
    ]

    for candidate in candidates:
        candidate = os.path.abspath(candidate)
        if os.path.exists(candidate) and os.path.isdir(candidate):
            return candidate

    return os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "build"))

BUILD_DIR = find_frontend_build_dir()

if not os.path.exists(BUILD_DIR):
    raise RuntimeError(
        f"React build directory not found. Checked: {BUILD_DIR}. "
        "Make sure the frontend build is present and deployed."
    )

app = Flask(
    __name__,
    static_folder=BUILD_DIR,
    static_url_path="/"
)

# ---------------- CORS ----------------
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ---------------- CONFIG ----------------
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(BASE_DIR, 'taskmanager.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "supersecretkey123456789")
app.config["JSON_SORT_KEYS"] = False
app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "False").lower() in ["1", "true", "yes"]

db.init_app(app)

def parse_due_date(date_str):
    if not date_str:
        return None

    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


# ---------------- AUTH DECORATOR ----------------

# ---------------- AUTH DECORATOR ----------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"message": "Authorization header missing or invalid"}), 401

        token = parts[1]

        try:
            data = jwt.decode(
                token,
                app.config["SECRET_KEY"],
                algorithms=["HS256"]
            )

            current_user = User.query.get(data["user_id"])

            if not current_user:
                return jsonify({"message": "User not found"}), 404

        except Exception as e:
            return jsonify({
                "message": "Invalid token",
                "error": str(e)
            }), 401

        return f(current_user, *args, **kwargs)

    return decorated

# ---------------- SIGNUP ----------------
@app.route("/signup", methods=["POST"])
def signup():

    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "member")

    if not name or not email or not password:
        return jsonify({
            "message": "All fields required"
        }), 400

    if len(password) < 6:
        return jsonify({
            "message": "Password must be at least 6 characters"
        }), 400

    if role not in ["admin", "member"]:
        return jsonify({
            "message": "Invalid role"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "Email already exists"
        }), 400

    hashed_password = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    )

    user = User(
        name=name,
        email=email,
        password=hashed_password,
        role=role
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully"
    }), 201

# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():

    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if not bcrypt.checkpw(
        password.encode("utf-8"),
        user.password
    ):
        return jsonify({
            "message": "Wrong password"
        }), 401

    token = jwt.encode({
        "user_id": user.id,
        "role": user.role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    },
    app.config["SECRET_KEY"],
    algorithm="HS256")

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    })

# ---------------- USERS ----------------
@app.route("/users", methods=["GET"])
@token_required
def get_users(current_user):

    if current_user.role != "admin":
        return jsonify({
            "message": "Admin only"
        }), 403

    users = User.query.all()

    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role
        }
        for u in users
    ])

# ---------------- PROJECTS ----------------
@app.route("/projects", methods=["GET"])
@token_required
def get_projects(current_user):

    projects = Project.query.all()

    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "description": p.description
        }
        for p in projects
    ])

@app.route("/projects", methods=["POST"])
@token_required
def create_project(current_user):

    if current_user.role != "admin":
        return jsonify({
            "message": "Only admin can create project"
        }), 403

    data = request.json

    if not data.get("name"):
        return jsonify({
            "message": "Project name required"
        }), 400

    project = Project(
        name=data.get("name"),
        description=data.get("description"),
        created_by=current_user.id
    )

    db.session.add(project)
    db.session.commit()

    return jsonify({
        "message": "Project created successfully"
    }), 201

# ---------------- TASKS ----------------
@app.route("/tasks", methods=["GET"])
@token_required
def get_tasks(current_user):

    if current_user.role == "admin":
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(
            assigned_to=current_user.id
        ).all()

    return jsonify([
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "due_date": str(t.due_date),
            "project_id": t.project_id,
            "assigned_to": t.assigned_to
        }
        for t in tasks
    ])

@app.route("/tasks", methods=["POST"])
@token_required
def create_task(current_user):

    if current_user.role != "admin":
        return jsonify({
            "message": "Only admin can create task"
        }), 403

    data = request.json

    if (
        not data.get("title")
        or not data.get("project_id")
        or not data.get("assigned_to")
    ):
        return jsonify({
            "message": "Missing required fields"
        }), 400

    task = Task(
        title=data.get("title"),
        description=data.get("description"),
        due_date=data.get("due_date") or None,
        project_id=data.get("project_id"),
        assigned_to=data.get("assigned_to"),
        created_by=current_user.id
    )

    db.session.add(task)
    db.session.commit()

    return jsonify({
        "message": "Task created successfully"
    }), 201

# ---------------- UPDATE TASK STATUS ----------------
@app.route("/tasks/<int:id>/status", methods=["PUT"])
@token_required
def update_status(current_user, id):

    task = Task.query.get(id)

    if not task:
        return jsonify({
            "message": "Task not found"
        }), 404

    if (
        current_user.role != "admin"
        and task.assigned_to != current_user.id
    ):
        return jsonify({
            "message": "Not allowed"
        }), 403

    status = request.json.get("status")

    if status not in [
        "pending",
        "in-progress",
        "completed"
    ]:
        return jsonify({
            "message": "Invalid status"
        }), 400

    task.status = status

    db.session.commit()

    return jsonify({
        "message": "Status updated successfully"
    })

# ---------------- DASHBOARD ----------------
@app.route("/dashboard", methods=["GET"])
@token_required
def dashboard(current_user):

    if current_user.role == "admin":
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(
            assigned_to=current_user.id
        ).all()

    total = len(tasks)

    pending = len([
        t for t in tasks
        if t.status == "pending"
    ])

    in_progress = len([
        t for t in tasks
        if t.status == "in-progress"
    ])

    completed = len([
        t for t in tasks
        if t.status == "completed"
    ])

    overdue = len([
        t for t in tasks
        if (
            t.status != "completed"
            and parse_due_date(t.due_date)
            and parse_due_date(t.due_date) < date.today()
        )
    ])

    return jsonify({
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "completed": completed,
        "overdue": overdue
    })

# ---------------- REACT FRONTEND ROUTES ----------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):

    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")

# ---------------- CREATE DATABASE ----------------
with app.app_context():
    db.create_all()

# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)