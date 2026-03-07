import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OrderPlaced.css";

export default function OrderPlaced() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate("/order-tracking");
    }, 3000);

    const countdownTimer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(countdownTimer);
    };
  }, [navigate]);

  return (
    <div className="order-placed-page">
      <div className="order-placed-card">
        <div className="success-icon" aria-hidden="true">
          <span>&#10003;</span>
        </div>

        <h2>Order Placed Successfully</h2>
        <p className="status-copy">Your order has been sent to the kitchen and is now being processed.</p>

        <div className="status-details">
          <div className="status-row">
            <span>Status</span>
            <strong>Confirmed</strong>
          </div>
          <div className="status-row">
            <span>Next</span>
            <strong>Live tracking</strong>
          </div>
        </div>

        <p className="redirect-copy">Redirecting to order tracking in {secondsLeft}s...</p>
        <button className="track-now-btn" onClick={() => navigate("/order-tracking")}>Track Order Now</button>
      </div>
    </div>
  );
}
