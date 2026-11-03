import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <div>
          <p className="eyebrow">IRONPULSE FITNESS</p>
          <h1>Driver Dashboard</h1>
        </div>
        <button className="btn btn-outline-secondary" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <section className="dashboard-welcome">
        <h2>Welcome, {user?.name || "Driver"}</h2>
        <p>Your secure driver workspace is ready.</p>
      </section>

      <section className="dashboard-placeholder">
        <h3>Your deliveries</h3>
        <p>The delivery table and status controls are the next Task 4 step.</p>
      </section>
    </main>
  );
}
