import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./UserProfile.css";

const ACTIVE_STATUSES = new Set(["PENDING", "PLACED", "ACCEPTED", "PREPARING", "READY", "READY_FOR_PICKUP"]);

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const normalizeStatus = (status) => (status || "PLACED").toUpperCase();

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getOrderTotal = (order) => {
  if (typeof order?.totalAmount === "number") return order.totalAmount;
  if (typeof order?.total === "number") return order.total;
  if (typeof order?.amount === "number") return order.amount;
  if (Array.isArray(order?.items)) {
    return order.items.reduce((sum, item) => {
      const price = Number(item?.price || item?.menuItem?.price || 0);
      const qty = Number(item?.quantity || item?.qty || 0);
      return sum + price * qty;
    }, 0);
  }
  return 0;
};

const toCurrency = (value) => `Rs ${Number(value || 0).toFixed(0)}`;

function StatItem({ label, value, tone }) {
  return (
    <article className={`stat-item ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  const storedEmail = localStorage.getItem("userEmail") || "";
  const storedRole = (localStorage.getItem("role") || "CUSTOMER").toUpperCase();
  const tokenPayload = useMemo(() => decodeJwtPayload(token), [token]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName =
    tokenPayload?.name ||
    tokenPayload?.fullName ||
    tokenPayload?.username ||
    "Canteen Bite User";

  const displayEmail = tokenPayload?.email || tokenPayload?.sub || storedEmail || "Not available";

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/api/orders/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
        const sorted = [...data].sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
        setOrders(sorted);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const latestOrder = orders[0] || null;

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter((order) => ACTIVE_STATUSES.has(normalizeStatus(order.status))).length;
    const completedOrders = orders.filter((order) => normalizeStatus(order.status) === "COMPLETED").length;
    const cancelledOrders = orders.filter((order) => normalizeStatus(order.status) === "CANCELLED").length;
    return { totalOrders, activeOrders, completedOrders, cancelledOrders };
  }, [orders]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <div className="profile-page">
      <section className="profile-card">
        <header className="profile-topbar">
          <button className="icon-btn" onClick={() => navigate("/menu")} type="button" aria-label="Back">
            {"<"}
          </button>
          <h1>Profile</h1>
          <button className="icon-btn power" onClick={handleLogout} type="button" aria-label="Logout">
            {"O"}
          </button>
        </header>

        <section className="identity-row">
          <div className="avatar">{displayName.trim().charAt(0).toUpperCase()}</div>
          <div className="identity-copy">
            <h2>{displayName}</h2>
            <p>{displayEmail}</p>
          </div>
          <div className="identity-tags">
            <span>{storedRole}</span>
            <span>{token ? "Signed In" : "Signed Out"}</span>
          </div>
        </section>

        <section className="quick-actions">
          <button type="button" className="chip-btn" onClick={() => navigate("/menu")}>Menu</button>
          <button type="button" className="chip-btn" onClick={() => navigate("/order-tracking")}>Track Order</button>
          <button type="button" className="chip-btn danger" onClick={handleLogout}>Logout</button>
        </section>

        <section className="stats-grid">
          <StatItem label="Active" value={stats.activeOrders} tone="orange" />
          <StatItem label="Total" value={stats.totalOrders} tone="dark" />
          <StatItem label="Completed" value={stats.completedOrders} tone="green" />
          <StatItem label="Cancelled" value={stats.cancelledOrders} tone="red" />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Latest Order</h3>
          </div>
          {loading ? (
            <p className="empty-row">Loading latest order...</p>
          ) : latestOrder ? (
            <div className="order-rows">
              <div className="order-row"><span>Status</span><strong>{normalizeStatus(latestOrder.status)}</strong></div>
              <div className="order-row"><span>Order Time</span><strong>{formatDateTime(latestOrder.orderTime)}</strong></div>
              <div className="order-row"><span>Table Number</span><strong>{latestOrder.tableNumber || "-"}</strong></div>
              <div className="order-row"><span>Total</span><strong>{toCurrency(getOrderTotal(latestOrder))}</strong></div>
            </div>
          ) : (
            <p className="empty-row">No orders placed yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Recent Orders</h3>
          </div>
          {loading ? (
            <p className="empty-row">Loading recent orders...</p>
          ) : orders.length === 0 ? (
            <p className="empty-row">No order history available.</p>
          ) : (
            <div className="order-rows">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id || `${order.orderTime}-${order.status}`} className="order-row order-list-row">
                  <div>
                    <p className="order-primary">{formatDateTime(order.orderTime)}</p>
                    <p className="order-secondary">Table: {order.tableNumber || "-"}</p>
                  </div>
                  <div className="order-right">
                    <span className={`order-status status-${normalizeStatus(order.status).toLowerCase()}`}>
                      {normalizeStatus(order.status)}
                    </span>
                    <strong>{toCurrency(getOrderTotal(order))}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
