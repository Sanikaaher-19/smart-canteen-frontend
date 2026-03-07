import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./Pay.css";

export default function Pay({ orderItems = [], setOrderItems = () => { }, orders = [], setOrders = () => { } }) {
  const navigate = useNavigate();
  const [tableNumber, setTableNumber] = useState("");
  const TABLE_MIN = 1;
  const TABLE_MAX = 99;

  const cart = orderItems.reduce((acc, item) => {
    const found = acc.find(i => i.id === item.id);
    if (found) found.qty += 1;
    else acc.push({ ...item, qty: 1 });
    return acc;
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleTableInput = (event) => {
    const numericValue = event.target.value.replace(/\D/g, "");
    setTableNumber(numericValue.slice(0, 2));
  };

  const handlePayment = async () => {
    const parsedTableNumber = Number.parseInt(tableNumber, 10);

    if (
      !tableNumber.trim() ||
      Number.isNaN(parsedTableNumber) ||
      parsedTableNumber < TABLE_MIN ||
      parsedTableNumber > TABLE_MAX
    ) {
      alert(`Please enter a table number between ${TABLE_MIN} and ${TABLE_MAX}`);
      return;
    }

    const payload = {
      tableNumber: String(parsedTableNumber),
      items: cart.map(i => ({ menuItemId: i.id, quantity: i.qty })),
      customerEmail: localStorage.getItem("userEmail") || null
    };

    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      payload.customerEmail = userEmail;
      localStorage.setItem("userEmail", userEmail);
    }

    try {
      const res = await api.post("/api/orders", payload);
      setOrderItems([]);
      setOrders([...orders, res.data]);
      navigate("/order-placed");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Order failed");
    }
  };

  return (
    <div className="pay-container">
      <div className="pay-wrapper">
        <div className="pay-header">
          <h2>Confirm &amp; Pay</h2>
          <p>Review your order and place it securely.</p>
        </div>

        <div className="payment-box">
          <div className="payment-input-card">
            <h3>Table Details</h3>
            <p>Enter your table number to complete this order.</p>

            <label htmlFor="tableNumber" className="table-label">
              Table Number
            </label>
            <input
              id="tableNumber"
              type="number"
              min={TABLE_MIN}
              max={TABLE_MAX}
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder={`Enter ${TABLE_MIN}-${TABLE_MAX}`}
              value={tableNumber}
              onChange={handleTableInput}
              required
            />
            <span className="table-hint">Allowed range: {TABLE_MIN} - {TABLE_MAX}</span>
          </div>

          <div className="payment-summary">
            <h3>Order Summary</h3>
            <div className="payment-summary-row">
              <span className="payment-summary-label">Items ({cart.length})</span>
              <span className="payment-summary-value">&#8377;{subtotal}</span>
            </div>
            <div className="payment-summary-row">
              <span className="payment-summary-label">Tax (5%)</span>
              <span className="payment-summary-value">&#8377;{tax}</span>
            </div>
            <div className="payment-summary-row payment-summary-total">
              <span className="payment-summary-label">Total</span>
              <span className="payment-summary-value">&#8377;{total}</span>
            </div>

            <button className="pay-btn" onClick={handlePayment} disabled={cart.length === 0}>
              Pay &amp; Place Order
            </button>

            <div className="note">
              <strong>Demo Payment</strong>
              No real payment is processed in this flow.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
