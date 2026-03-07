import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Auth from "./pages/Auth";
import Menu from "./pages/Menu";
import Order from "./pages/Order";
import Pay from "./pages/Pay";
import OrderPlaced from "./pages/OrderPlaced";
import OrderTracking from "./pages/OrderTracking";
import UserProfile from "./pages/UserProfile";
import AdminCreateUser from "./pages/AdminCreateUser";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

import Kitchen from "./pages/Kitchen";

function AppContent({ orderItems, setOrderItems, orders, setOrders, inventory, setInventory, role, setRole }) {
  const normalizedRole = role?.toUpperCase();

  return (
    <>
      <Routes>
        <Route path="/" element={<Auth onLogin={setRole} />} />
        <Route
          path="/menu"
          element={
            <Menu
              orderItems={orderItems}
              setOrderItems={setOrderItems}
              inventory={inventory}
              setInventory={setInventory}
            />
          }
        />
        <Route path="/order" element={<Order orderItems={orderItems} setOrderItems={setOrderItems} />} />
        <Route path="/pay" element={<Pay orderItems={orderItems} setOrderItems={setOrderItems} orders={orders} setOrders={setOrders} />} />
        <Route path="/order-placed" element={<OrderPlaced />} />
        <Route path="/order-tracking" element={<OrderTracking orders={orders} setOrders={setOrders} />} />
        <Route path="/profile" element={<UserProfile />} />

        
        <Route path="/admin/create-user" element={<AdminCreateUser />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />

        {normalizedRole === "KITCHEN_STAFF" && (
          <Route path="/kitchen" element={<Kitchen />} />
        )}
      </Routes>
    </>
  );
}

function App() {
  const [orderItems, setOrderItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([
    { id: 1, name: "Veg Burger", stock: 10 },
    { id: 2, name: "Pizza", stock: 10 },
    { id: 3, name: "Pasta", stock: 10 },
    { id: 4, name: "Sandwich", stock: 10 },
    { id: 5, name: "Fries", stock: 10 },
    { id: 6, name: "Cold Drink", stock: 10 },
  ]);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) setRole(storedRole.toUpperCase());
  }, []);

  return (
    <Router>
      <AppContent
        orderItems={orderItems}
        setOrderItems={setOrderItems}
        orders={orders}
        setOrders={setOrders}
        inventory={inventory}
        setInventory={setInventory}
        role={role}
        setRole={setRole}
      />
    </Router>
  );
}

export default App;
