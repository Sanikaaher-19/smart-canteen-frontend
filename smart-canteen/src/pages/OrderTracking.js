import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./OrderTracking.css";

const TRACKING_STEPS = [
  { key: "PLACED", label: "Order Placed", subLabel: "We received your order" },
  { key: "ACCEPTED", label: "Order Accepted", subLabel: "Kitchen accepted your order" },
  { key: "PREPARING", label: "Preparing", subLabel: "Your food is being prepared" },
  { key: "READY", label: "Ready", subLabel: "Your order is ready for pickup" }
];

const STATUS_STEP_MAP = {
  PENDING: 0,
  PLACED: 0,
  ACCEPTED: 1,
  PREPARING: 2,
  READY: 3,
  READY_FOR_PICKUP: 3,
  COMPLETED: 3,
  CANCELLED: 0
};

const POLL_INTERVAL_MS = 5000;
const CANCEL_WINDOW_MS = 5 * 60 * 1000;

const normalizeStatus = (status) => (status || "PLACED").toUpperCase();

const toTrackingMessage = (status) => {
  switch (status) {
    case "CANCELLED":
      return "This order has been cancelled.";
    case "PLACED":
    case "PENDING":
      return "Your order is placed and waiting for kitchen confirmation.";
    case "ACCEPTED":
      return "Kitchen accepted your order and will start preparing shortly.";
    case "PREPARING":
      return "Your food is currently being prepared.";
    case "READY":
    case "READY_FOR_PICKUP":
      return "Your order is ready for pickup.";
    case "COMPLETED":
      return "Order completed successfully.";
    default:
      return "Your order status is being updated.";
  }
};

const getCanCancelState = (order) => {
  if (!order?.orderTime) {
    return { canCancel: false, timeLeft: 0 };
  }

  const now = new Date();
  const orderTime = new Date(order.orderTime);
  const elapsedMs = now - orderTime;
  const status = normalizeStatus(order.status);
  const statusAllowsCancel = status === "PENDING" || status === "PREPARING";
  const withinWindow = elapsedMs <= CANCEL_WINDOW_MS;
  const canCancel = statusAllowsCancel && withinWindow;
  const timeLeft = canCancel ? Math.max(0, Math.floor((CANCEL_WINDOW_MS - elapsedMs) / 1000)) : 0;

  return { canCancel, timeLeft };
};

const OrderTracking = ({ orders, setOrders }) => {
  const navigate = useNavigate();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [canCancel, setCanCancel] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [noOrders, setNoOrders] = useState(false);

  const fetchLatestOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userEmail = localStorage.getItem("userEmail");

      if (!token) {
        alert("Please login to view your orders");
        navigate("/");
        return;
      }

      if (!userEmail) {
        alert("User email not found. Please login again.");
        navigate("/");
        return;
      }

      const res = await api.get("/api/orders/user", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userOrders = Array.isArray(res.data) ? res.data : [res.data];

      if (Array.isArray(userOrders) && userOrders.length > 0) {
        const sortedOrders = [...userOrders].sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
        let order = sortedOrders[0];
        if (Array.isArray(order)) order = order[0];

        if (!order || !order.orderTime || !order.status) {
          setCurrentOrder(null);
          setCanCancel(false);
          setTimeLeft(0);
          setNoOrders(true);
          return;
        }

        setNoOrders(false);
        setCurrentOrder(order);

        const cancelState = getCanCancelState(order);
        setCanCancel(cancelState.canCancel);
        setTimeLeft(cancelState.timeLeft);
      } else {
        setNoOrders(true);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
      alert("Failed to load order details. Please try logging in again.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    fetchLatestOrder();

    const pollTimer = setInterval(() => {
      fetchLatestOrder();
    }, POLL_INTERVAL_MS);

    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanCancel(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(countdownTimer);
    };
  }, [fetchLatestOrder]);

  const handleCancel = async () => {
    if (!currentOrder || !currentOrder.id) {
      alert("Order not found or invalid");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to cancel order");
        return;
      }

      await api.put(`/api/orders/${currentOrder.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentOrder({ ...currentOrder, status: "CANCELLED" });
      setCanCancel(false);
      alert("Order cancelled successfully!");
      navigate("/menu");
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err?.response?.data?.message || "Cancellation failed");
    }
  };

  const orderStatus = normalizeStatus(currentOrder?.status);
  const activeStepIndex = STATUS_STEP_MAP[orderStatus] ?? 0;
  const isReadyOrCompleted =
    orderStatus === "READY" ||
    orderStatus === "READY_FOR_PICKUP" ||
    orderStatus === "COMPLETED";

  const formattedTimeLeft = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  const handleDone = () => {
    if (!isReadyOrCompleted) {
      navigate("/menu");
    }
  };

  const doneButtonText = isReadyOrCompleted ? "Done" : "Back to Menu";

  if (noOrders) {
    return (
      <div className="order-tracking-shell">
        <div className="tracking-card no-order-card">
          <h2>No orders found</h2>
          <p>Please place an order first to see live tracking updates.</p>
          <button className="primary-btn" onClick={() => navigate("/menu")}>Go to Menu</button>
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="order-tracking-shell">
        <div className="tracking-card loading-card">Loading your latest order...</div>
      </div>
    );
  }

  return (
    <div className="order-tracking-shell">
      <div className="tracking-card">
        <div className="tracking-head">
          <div>
            <h2>Order Tracking</h2>
            <p>{toTrackingMessage(orderStatus)}</p>
          </div>
          <span className={`status-pill status-${orderStatus.toLowerCase()}`}>{orderStatus}</span>
        </div>

        <div className="progress-wrap" aria-live="polite">
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = index <= activeStepIndex && orderStatus !== "CANCELLED";
            const isCurrent = index === activeStepIndex && orderStatus !== "CANCELLED";

            return (
              <div key={step.key} className={`progress-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                <div className="step-bullet">{isCompleted ? "\u2713" : index + 1}</div>
                <div className="step-content">
                  <p className="step-title">{step.label}</p>
                  <p className="step-subtitle">{step.subLabel}</p>
                </div>
              </div>
            );
          })}
        </div>

        {canCancel && (
          <div className="cancel-card">
            <p className="cancel-time">Time left to cancel: {formattedTimeLeft}</p>
            <p className="cancel-note">You can cancel only within 5 minutes of placing the order.</p>
            <button onClick={handleCancel} className="cancel-btn">Cancel Order</button>
          </div>
        )}

        <div className="tracking-actions">
          <button className="done-btn" onClick={handleDone}>{doneButtonText}</button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
