import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [message, setMessage] = useState("");

  // ✅ SAFE USER (IMPROVED)
  const getUser = () => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();

  useEffect(() => {
    fetchTasks();
    fetchProjects();

    if (user?.role === "admin") {
      fetchUsers();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const createTask = async () => {
    setMessage("");

    if (!title || !projectId || !assignedTo) {
      setMessage("⚠️ Please fill all fields");
      return;
    }

    try {
      await API.post("/tasks", {
        title,
        due_date: new Date().toISOString().split("T")[0],
        project_id: Number(projectId),
        assigned_to: Number(assignedTo),
      });

      setMessage("✅ Task created successfully");

      setTitle("");
      setProjectId("");
      setAssignedTo("");

      fetchTasks();
    } catch {
      setMessage("❌ Error creating task");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/tasks/${id}/status`, { status });
      fetchTasks();
    } catch {
      alert("Error updating status");
    }
  };

  // 🎨 Status class (CSS based instead of inline)
  const getStatusClass = (status) => {
    if (status === "completed") return "badge completed";
    if (status === "in-progress") return "badge in-progress";
    return "badge pending";
  };

  return (
    <div className="app-layout">
      <Navbar />

      <div className="main-content">
        <h1>Tasks</h1>

        {/* 🔥 ADMIN PANEL */}
        {user?.role === "admin" && (
          <div className="panel">
            <h3>Create & Assign Task</h3>

            {message && <p>{message}</p>}

            <div className="task-form">
              <input
                placeholder="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Assign User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <button onClick={createTask}>Create Task</button>
            </div>
          </div>
        )}

        {/* 🔥 EMPTY STATE */}
        {tasks.length === 0 ? (
          <p className="empty">No tasks available</p>
        ) : (
          <div className="task-grid">
            {tasks.map((t) => (
              <div key={t.id} className="task-card">
                <div className="task-header">
                  <h3>{t.title}</h3>
                  <span className={getStatusClass(t.status)}>
                    {t.status}
                  </span>
                </div>

                <p>📁 Project ID: {t.project_id}</p>
                <p>📅 Due: {t.due_date}</p>

                <div className="task-actions">
                  <button onClick={() => updateStatus(t.id, "pending")}>
                    Pending
                  </button>

                  <button onClick={() => updateStatus(t.id, "in-progress")}>
                    In Progress
                  </button>

                  <button onClick={() => updateStatus(t.id, "completed")}>
                    Done
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}