import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MapView from "../components/MapView";
import RouteHistory from "../components/RouteHistory";

export default function FleetManagement() {
  const [activeTab, setActiveTab] = useState("map");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <div><p className="eyebrow">IRONPULSE FLEET CONTROL</p><h1>Fleet management</h1><p className="task5-muted">Welcome, {user?.name || "Manager"}</p></div>
        <button className="btn btn-outline-secondary" onClick={handleLogout}>Log out</button>
      </header>
      <nav className="task5-tabs" aria-label="Fleet views">
        <button className={activeTab === "map" ? "active" : ""} onClick={() => setActiveTab("map")}>Live map</button>
        <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Route history</button>
      </nav>
      {activeTab === "map" ? <MapView /> : <RouteHistory />}
    </main>
  );
}
