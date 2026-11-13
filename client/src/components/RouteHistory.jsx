import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import ReactPaginate from "react-paginate";
import api from "../services/api";

const PAGE_SIZE = 10;

export default function RouteHistory() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (pageIndex = page) => {
    setLoading(true);
    setError("");
    try {
      const params = { page: pageIndex + 1, limit: PAGE_SIZE };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get("/api/deliveries/history", { params });
      setItems(response.data.data || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load delivery history.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, startDate, endDate]);

  useEffect(() => { loadHistory(page); }, [loadHistory, page]);

  const applyFilters = (event) => {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setError("Start date must be on or before end date.");
      return;
    }
    setPage(0);
    loadHistory(0);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  return (
    <section className="task5-panel">
      <div className="task5-panel-heading">
        <div><p className="eyebrow">DELIVERY RECORDS</p><h2>Route history</h2></div>
        <span className="history-count">{total} records</span>
      </div>
      <form className="history-filters" onSubmit={applyFilters}>
        <label>From date<input className="form-control" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label>To date<input className="form-control" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} /></label>
        <div className="history-filter-actions">
          <button className="btn btn-primary" type="submit">Apply filters</button>
          <button className="btn btn-outline-secondary" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading ? <p className="task5-muted" role="status">Loading route history...</p> : items.length === 0 ? (
        <p className="task5-muted">No deliveries found for this date range.</p>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle delivery-table">
            <thead><tr><th>Tracking #</th><th>Customer</th><th>Address</th><th>Driver</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>{items.map((item) => (
              <tr key={item._id}>
                <td className="delivery-id">{item.trackingNumber}</td>
                <td>{item.customerName}</td><td>{item.deliveryAddress}</td>
                <td>{item.driverName || "Unassigned"}</td>
                <td><span className={`status-pill status-${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></td>
                <td>{item.createdAt ? format(new Date(item.createdAt), "dd MMM yyyy") : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <ReactPaginate
          previousLabel="Previous"
          nextLabel="Next"
          breakLabel="..."
          pageCount={totalPages}
          forcePage={Math.min(page, Math.max(totalPages - 1, 0))}
          onPageChange={({ selected }) => setPage(selected)}
          containerClassName="task5-pagination"
          pageClassName="page-item"
          pageLinkClassName="page-link"
          previousClassName="page-item"
          previousLinkClassName="page-link"
          nextClassName="page-item"
          nextLinkClassName="page-link"
          breakClassName="page-item"
          breakLinkClassName="page-link"
          activeClassName="active"
          disabledClassName="disabled"
        />
      )}
    </section>
  );
}
