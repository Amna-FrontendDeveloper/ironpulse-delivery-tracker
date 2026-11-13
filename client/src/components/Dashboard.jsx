import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const nextStatus = {
  Pending: "Picked Up",
  "Picked Up": "In Transit",
  "In Transit": "Delivered",
};

const statusLabel = (status) => (status === "Picked Up" ? "Picked" : status);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/deliveries");
      setDeliveries(response.data);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        await logout();
        navigate("/login", { replace: true });
        return;
      }
      setError(
        requestError.response?.data?.message ||
          "Unable to load deliveries. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleStatusUpdate = async (delivery) => {
    const status = nextStatus[delivery.status];
    if (!status) return;

    setUpdatingId(delivery._id);
    setError("");
    try {
      const response = await api.patch(
        `/api/deliveries/${delivery._id}`,
        { status }
      );
      setDeliveries((current) =>
        current.map((item) =>
          item._id === delivery._id ? response.data : item
        )
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Status update failed. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
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
        <p>Here are the deliveries assigned to your account.</p>
      </section>

      <section className="deliveries-panel">
        <div className="deliveries-heading">
          <div>
            <p className="eyebrow">YOUR WORK</p>
            <h2>Your deliveries</h2>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={fetchDeliveries}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {loading ? (
          <div className="dashboard-loading" role="status">
            <span className="spinner-border spinner-border-sm me-2" />
            Loading your deliveries...
          </div>
        ) : deliveries.length === 0 ? (
          <p className="empty-state">No deliveries are assigned to you yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle delivery-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Address</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => {
                  const next = nextStatus[delivery.status];
                  return (
                    <tr key={delivery._id}>
                      <td className="delivery-id">
                        {delivery.trackingNumber || delivery._id}
                      </td>
                      <td>{delivery.customerName}</td>
                      <td>{delivery.deliveryAddress}</td>
                      <td>
                        <span className={`status-pill status-${delivery.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {statusLabel(delivery.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!next || updatingId === delivery._id}
                          onClick={() => handleStatusUpdate(delivery)}
                        >
                          {updatingId === delivery._id
                            ? "Updating..."
                            : next
                              ? `Mark ${statusLabel(next)}`
                              : "Completed"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
