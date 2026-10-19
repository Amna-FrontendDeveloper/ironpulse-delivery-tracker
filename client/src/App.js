
import "./App.css";

function App() {
  return (
    <main className="welcome-page">
      <section className="welcome-card">
        <div className="brand-icon" aria-hidden="true">
          IP
        </div>

        <p className="eyebrow">DELIVERY MANAGEMENT</p>

        <h1>IronPulse Delivery Tracker</h1>

        <p className="tagline">
          Track deliveries. Stay on schedule.
          Keep every shipment moving.
        </p>

        <div className="status">
          <span className="status-dot"></span>
          Your delivery journey starts here
        </div>
      </section>
    </main>
  );
}

export default App;
