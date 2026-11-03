import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";

function Home() {
  return (
    <main className="welcome-page">
      <section className="welcome-card">
        <div className="brand-icon" aria-hidden="true">IP</div>
        <p className="eyebrow">DELIVERY MANAGEMENT</p>
        <h1>IronPulse Delivery Tracker</h1>
        <p className="tagline">
          Track deliveries. Stay on schedule. Keep every shipment moving.
        </p>
        <Link className="btn btn-primary mt-4 px-4" to="/login">
          Driver sign in
        </Link>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
