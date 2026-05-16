import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  let user = null;

  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <h2>Task Manager</h2>

      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/tasks">Tasks</Link>
      </div>

      {/* USER INFO */}
      {user && (
        <div style={{ marginTop: "20px", fontSize: "14px" }}>
          👤 {user.name}
          <br />
          Role: {user.role}
        </div>
      )}

      <button className="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

export default Navbar;