import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await API.post("/login", {
        email,
        password,
      });

      if (!res.data.user || !res.data.token) {
        setMessage("Invalid login response");
        return;
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      navigate("/dashboard");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Login failed"
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "14px",
          width: "360px",
          boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Login
        </h2>

        {message && (
          <p
            style={{
              color: "#ef4444",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "none",
              outline: "none",
            }}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "none",
              outline: "none",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "#38bdf8",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>

        {/* 🔥 SIGNUP LINK */}
        <p
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "15px",
          }}
        >
          Don&apos;t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{
              color: "#38bdf8",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}