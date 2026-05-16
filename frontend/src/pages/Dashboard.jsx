import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";

function Dashboard() {
  const [data, setData] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  });

  // ✅ SAFE USER
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
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get("/dashboard");
      setData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />

      <div className="main-content">
        {/* HEADER */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ marginBottom: "5px" }}>Dashboard</h1>
          <p style={{ color: "#94a3b8" }}>
            Overview of your tasks and progress
          </p>
        </div>

        {/* 🔥 WELCOME CARD */}
        <div className="panel">
          <h2 style={{ marginBottom: "10px" }}>
            👋 Welcome, {user?.name || "User"}
          </h2>

          <p style={{ marginBottom: "6px" }}>
            Role: <b>{user?.role}</b>
          </p>

          <p style={{ color: "#94a3b8" }}>
            Stay organized and track your team’s progress effectively.
          </p>
        </div>

        {/* 🔥 STATS CARDS */}
        <div className="cards">
          <div className="card total">
            <h3>Total Tasks</h3>
            <p>{data.total}</p>
          </div>

          <div className="card pending">
            <h3>Pending</h3>
            <p>{data.pending}</p>
          </div>

          <div className="card progress">
            <h3>In Progress</h3>
            <p>{data.in_progress}</p>
          </div>

          <div className="card completed">
            <h3>Completed</h3>
            <p>{data.completed}</p>
          </div>

          <div className="card overdue">
            <h3>Overdue</h3>
            <p>{data.overdue}</p>
          </div>
        </div>

        {/* 🔥 QUICK SUMMARY */}
        <div className="panel" style={{ marginTop: "25px" }}>
          <h3 style={{ marginBottom: "10px" }}>📊 Quick Summary</h3>

          <div style={{ lineHeight: "1.8" }}>
            <p>📌 Total Tasks: {data.total}</p>
            <p>⏳ Pending: {data.pending}</p>
            <p>🚀 In Progress: {data.in_progress}</p>
            <p>✅ Completed: {data.completed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;