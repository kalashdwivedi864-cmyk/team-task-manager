import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // ✅ SAFE USER
  let user = null;
  try {
    const u = localStorage.getItem("user");
    if (u && u !== "undefined") user = JSON.parse(u);
  } catch {}

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const createProject = async () => {
    setMessage("");

    if (!name) {
      setMessage("⚠️ Project name required");
      return;
    }

    try {
      await API.post("/projects", { name });

      setMessage("✅ Project created successfully");
      setName("");

      fetchProjects();
    } catch {
      setMessage("❌ Only admin can create project");
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <div className="main-content">
        <h1>Projects</h1>

        {/* 🔥 ADMIN PANEL */}
        {user?.role === "admin" && (
          <div className="panel">
            <h3>Create Project</h3>

            {message && <p>{message}</p>}

            <input
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <button onClick={createProject}>Create Project</button>
          </div>
        )}

        {/* 🔥 PROJECT LIST */}
        {projects.length === 0 ? (
          <p className="empty">No projects available</p>
        ) : (
          <div className="project-grid">
            {projects.map((p) => (
              <div key={p.id} className="project-card">
                <h3>{p.name}</h3>
                <p>Project ID: {p.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Projects;