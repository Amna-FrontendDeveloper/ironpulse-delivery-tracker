import { useCallback, useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";
import api from "../services/api";

// CRA does not automatically resolve Leaflet's marker image URLs.
const vehicleIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const DEFAULT_CENTER = [33.6844, 73.0479];

export default function MapView() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = useCallback(async () => {
    try {
      const response = await api.get("/api/vehicles/locations");
      setLocations(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load vehicle locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
    const timer = window.setInterval(loadLocations, 15000);
    return () => window.clearInterval(timer);
  }, [loadLocations]);

  const firstValid = locations.find((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const center = firstValid ? [firstValid.lat, firstValid.lng] : DEFAULT_CENTER;

  return (
    <section className="task5-panel">
      <div className="task5-panel-heading">
        <div><p className="eyebrow">LIVE FLEET</p><h2>Vehicle locations</h2></div>
        <button className="btn btn-outline-primary btn-sm" onClick={loadLocations} disabled={loading}>Refresh</button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? <p className="task5-muted">Loading map locations...</p> : (
        <>
          <div className="map-status-row"><span>{locations.length} vehicle(s) reporting</span><span>Auto-refresh: 15 seconds</span></div>
          <MapContainer center={center} zoom={11} scrollWheelZoom className="vehicle-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)).map((item) => (
              <Marker key={item.vehicleId} position={[item.lat, item.lng]} icon={vehicleIcon}>
                <Popup>
                  <strong>Vehicle:</strong> {item.vehicleId}<br />
                  <strong>Last update:</strong> {item.updatedAt ? format(new Date(item.updatedAt), "dd MMM yyyy, hh:mm a") : "Unknown"}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {!locations.length && <p className="task5-muted">No GPS locations found. Run the vehicle location seed script first.</p>}
        </>
      )}
    </section>
  );
}
