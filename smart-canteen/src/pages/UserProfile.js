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
  } catch (error) {
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
    "Campus Bite User";

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
      } catch (error) {
        console.error("Failed to load profile orders", error);
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
      <section className="profile-layout">
        <header className="profile-header">
          <div className="profile-identity">
            <div className="avatar">{displayName.trim().charAt(0).toUpperCase()}</div>
            <div>
              <h1>{displayName}</h1>
              <p>{displayEmail}</p>
            </div>
          </div>
          <div className="profile-meta">
            <span>Role: <strong>{storedRole}</strong></span>
            <span>Status: <strong>{token ? "Signed In" : "Signed Out"}</strong></span>
          </div>
        </header>

        <section className="actions-bar">
          <button className="secondary-btn" onClick={() => navigate("/menu")}>Go to Menu</button>
          <button className="secondary-btn" onClick={() => navigate("/order-tracking")}>Track Order</button>
          <button className="danger-btn" onClick={handleLogout}>Logout</button>
        </section>

        <section className="stats-strip">
          <article className="stat-block"><span>Total Orders</span><strong>{stats.totalOrders}</strong></article>
          <article className="stat-block"><span>Active Orders</span><strong>{stats.activeOrders}</strong></article>
          <article className="stat-block"><span>Completed</span><strong>{stats.completedOrders}</strong></article>
          <article className="stat-block"><span>Cancelled</span><strong>{stats.cancelledOrders}</strong></article>
        </section>

        <section className="orders-layout">
          <article className="panel latest-panel">
            <h2>Latest Order</h2>
            {loading ? (
              <p className="section-placeholder">Loading latest order...</p>
            ) : latestOrder ? (
              <div className="rows">
                <div className="row"><span>Status</span><strong>{normalizeStatus(latestOrder.status)}</strong></div>
                <div className="row"><span>Order Time</span><strong>{formatDateTime(latestOrder.orderTime)}</strong></div>
                <div className="row"><span>Table Number</span><strong>{latestOrder.tableNumber || "-"}</strong></div>
                <div className="row"><span>Total</span><strong>{toCurrency(getOrderTotal(latestOrder))}</strong></div>
              </div>
            ) : (
              <p className="section-placeholder">No orders placed yet.</p>
            )}
          </article>

          <article className="panel recent-panel">
            <h2>Recent Orders</h2>
            {loading ? (
              <p className="section-placeholder">Loading recent orders...</p>
            ) : orders.length === 0 ? (
              <p className="section-placeholder">No order history available.</p>
            ) : (
              <div className="rows list-rows">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id || `${order.orderTime}-${order.status}`} className="list-row">
                    <div>
                      <p className="order-primary">{formatDateTime(order.orderTime)}</p>
                      <p className="order-secondary">Table: {order.tableNumber || "-"}</p>
                    </div>
                    <div className="order-right">
                      <span className={`order-status status-${normalizeStatus(order.status).toLowerCase()}`}>{normalizeStatus(order.status)}</span>
                      <strong>{toCurrency(getOrderTotal(order))}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </section>
    </div>
  );
}
