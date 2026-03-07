import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import "./Kitchen.css";

const STATUS_TABS = ["ALL", "PLACED", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

const toStatusKey = (value) => (value || "PLACED").toUpperCase();
const canAccept = (status) => status === "PLACED" || status === "PENDING";
const canPrepare = (status) => status === "ACCEPTED";
const canReady = (status) => status === "PREPARING";
const canComplete = (status) => status === "READY" || status === "READY_FOR_PICKUP";

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "-";
  }
};

export default function Kitchen({ setOrders }) {
  const [orders, setLocalOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDt, setFromDt] = useState("");
  const [toDt, setToDt] = useState("");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const getToken = () => localStorage.getItem("token");

  const checkAccess = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const res = await API.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      const user = res.data?.data || res.data;
      const role = (user?.role || "").toString().toUpperCase();
      if (!(role === "KITCHEN_STAFF" || role === "ADMIN")) navigate("/", { replace: true });
    } catch (err) {
      console.error("checkAccess error:", err?.response || err);
      if (err?.response?.status === 401) navigate("/login", { replace: true });
      else setError("Unable to verify access.");
    }
  }, [navigate]);

  const fetchOrders = useCallback(async () => {
    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/api/kitchen/orders", { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data?.data || res.data || [];
      const next = Array.isArray(data) ? data : [];
      setLocalOrders(next);
      if (typeof setOrders === "function") setOrders(next);
    } catch (err) {
      console.error("fetchOrders error:", err?.response || err);
      if (err?.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [setOrders, navigate]);

  useEffect(() => {
    checkAccess();
    fetchOrders();
    const iv = setInterval(fetchOrders, 10000);
    return () => clearInterval(iv);
  }, [checkAccess, fetchOrders]);

  const filtered = useMemo(() => {
    const from = fromDt ? new Date(fromDt) : null;
    const to = toDt ? new Date(toDt) : null;

    return orders
      .filter((o) => {
        const status = toStatusKey(o.status);
        const statusOk = statusFilter === "ALL" ? true : status === statusFilter;
        if (!statusOk) return false;

        const text = `${o.user?.name || o.customerName || ""} ${o.customerEmail || ""} ${o.id} ${(o.items || [])
          .map((it) => it.menuItem?.name || it.name || "")
          .join(" ")}`.toLowerCase();
        if (search && !text.includes(search.toLowerCase())) return false;

        if (from || to) {
          const t = new Date(o.orderTime || o.createdAt || null);
          if (from && t < from) return false;
          if (to && t > to) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.orderTime || b.createdAt) - new Date(a.orderTime || a.createdAt));
  }, [orders, statusFilter, fromDt, toDt, search]);

  const metrics = useMemo(() => {
    const counts = {
      total: orders.length,
      placed: 0,
      preparing: 0,
      ready: 0,
      completed: 0
    };

    orders.forEach((o) => {
      const status = toStatusKey(o.status);
      if (status === "PLACED") counts.placed += 1;
      if (status === "PREPARING" || status === "ACCEPTED") counts.preparing += 1;
      if (status === "READY" || status === "READY_FOR_PICKUP") counts.ready += 1;
      if (status === "COMPLETED") counts.completed += 1;
    });

    return counts;
  }, [orders]);

  const updateStatus = async (orderId, newStatus) => {
    const prev = orders.slice();
    const next = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setLocalOrders(next);
    if (typeof setOrders === "function") setOrders(next);

    try {
      const token = getToken();
      await API.patch(`/api/kitchen/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchOrders();
    } catch (err) {
      console.error("updateStatus error:", err?.response || err);
      setLocalOrders(prev);
      if (typeof setOrders === "function") setOrders(prev);
      setError("Failed to update order status");
    }
  };

  const renderItemsSummary = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return "-";
    return items.map((it) => `${it.menuItem?.name || it.name || "Item"} x${it.quantity ?? it.qty ?? 1}`).join(", ");
  };

  return (
    <div className="kitchen-shell">
      <div className="kitchen-container">
        <div className="kitchen-header">
          <div>
            <p className="kitchen-eyebrow">Kitchen Ops</p>
            <h2>Kitchen Dashboard</h2>
            <p className="kitchen-sub">Live order queue and preparation flow</p>
          </div>

          <div className="kitchen-controls">
            <input
              type="text"
              placeholder="Search customer, email, item, order id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="kitchen-search"
            />
            <button onClick={fetchOrders} className="refresh-btn">Refresh</button>
          </div>
        </div>

        <div className="kitchen-metrics">
          <div className="metric-card"><p>Total Orders</p><h3>{metrics.total}</h3></div>
          <div className="metric-card"><p>Placed</p><h3>{metrics.placed}</h3></div>
          <div className="metric-card"><p>In Progress</p><h3>{metrics.preparing}</h3></div>
          <div className="metric-card"><p>Ready</p><h3>{metrics.ready}</h3></div>
          <div className="metric-card"><p>Completed</p><h3>{metrics.completed}</h3></div>
        </div>

        <div className="kitchen-filters">
          <div className="kitchen-tabs">
            {STATUS_TABS.map((s) => (
              <button key={s} className={`tab-btn ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                {s === "ALL" ? "All" : s[0] + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="date-filters">
            <label>
              From
              <input type="datetime-local" value={fromDt} onChange={(e) => setFromDt(e.target.value)} />
            </label>
            <label>
              To
              <input type="datetime-local" value={toDt} onChange={(e) => setToDt(e.target.value)} />
            </label>
            <button onClick={() => { setFromDt(""); setToDt(""); }} className="clear-btn">Clear</button>
          </div>
        </div>

        {error && <div className="kitchen-alert kitchen-alert-error">{error}</div>}
        {loading && <div className="kitchen-alert kitchen-alert-info">Loading orders...</div>}

        <div className="kitchen-table-wrap">
          <table className="kitchen-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Time</th>
                <th>Table</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading ? (
                <tr>
                  <td colSpan="8" className="empty-row">No orders found</td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const status = toStatusKey(order.status);
                  const total = order.totalAmount ?? order.total ?? order.totalPrice ?? "0.00";
                  return (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>
                        <div className="customer-col">
                          <span className="customer-name">{order.user?.name || order.customerName || "Guest"}</span>
                          <span className="customer-email">{order.customerEmail || order.email || "-"}</span>
                        </div>
                      </td>
                      <td className="items-cell" title={renderItemsSummary(order.items)}>{renderItemsSummary(order.items)}</td>
                      <td>{formatDate(order.orderTime || order.createdAt)}</td>
                      <td>{order.tableNumber || "-"}</td>
                      <td><span className={`status-pill status-${status.toLowerCase()}`}>{status}</span></td>
                      <td>Rs {total}</td>
                      <td className="actions-cell">
                        <button onClick={() => updateStatus(order.id, "ACCEPTED")} disabled={!canAccept(status)} className="btn btn-accept">Accept</button>
                        <button onClick={() => updateStatus(order.id, "PREPARING")} disabled={!canPrepare(status)} className="btn btn-prepare">Preparing</button>
                        <button onClick={() => updateStatus(order.id, "READY")} disabled={!canReady(status)} className="btn btn-ready">Ready</button>
                        <button onClick={() => updateStatus(order.id, "COMPLETED")} disabled={!canComplete(status)} className="btn btn-done">Done</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
