import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../api";
import "./AnalyticsDashboard.css";

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs ${amount.toFixed(2)}`;
};

const normalize = (value) => String(value || "").toLowerCase();

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("orders");
  const [timeRange, setTimeRange] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/api/admin/orders?timeRange=${timeRange}&date=${selectedDate}`);
      setOrders(res.data?.data || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedDate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/api/admin/users");
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/api/admin/revenue?timeRange=${timeRange}&date=${selectedDate}`);
      setRevenue(res.data?.data || res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch revenue");
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedDate]);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/api/menu");
      setMenuItems(res.data?.data || res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch menu items");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshActiveTab = useCallback(() => {
    if (activeTab === "orders") fetchOrders();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "revenue") fetchRevenue();
    else if (activeTab === "menu") fetchMenuItems();
  }, [activeTab, fetchOrders, fetchUsers, fetchRevenue, fetchMenuItems]);

  useEffect(() => {
    refreshActiveTab();
  }, [refreshActiveTab]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = normalize(searchQuery);
    return orders.filter((order) => {
      const id = normalize(order.id);
      const email = normalize(order.customerEmail || order.email);
      const status = normalize(order.status);
      const table = normalize(order.tableNumber);
      return id.includes(q) || email.includes(q) || status.includes(q) || table.includes(q);
    });
  }, [orders, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = normalize(searchQuery);
    return users.filter((user) => {
      const id = normalize(user.id);
      const name = normalize(user.name);
      const email = normalize(user.email);
      const role = normalize(user.role);
      return id.includes(q) || name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, searchQuery]);

  const filteredMenuItems = useMemo(() => {
    if (!searchQuery.trim()) return menuItems;
    const q = normalize(searchQuery);
    return menuItems.filter((item) => {
      const id = normalize(item.id);
      const name = normalize(item.name);
      const category = normalize(item.category);
      const price = normalize(item.price);
      return id.includes(q) || name.includes(q) || category.includes(q) || price.includes(q);
    });
  }, [menuItems, searchQuery]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => {
      const amount = typeof order.totalAmount === "number" ? order.totalAmount : Number(order.total || 0);
      return sum + amount;
    }, 0);
  }, [orders]);

  const activeCustomers = useMemo(() => {
    const customerSet = new Set(
      orders
        .map((order) => order.customerEmail || order.email)
        .filter(Boolean)
        .map((email) => String(email).toLowerCase())
    );
    return customerSet.size;
  }, [orders]);

  const statCards = [
    { label: "Orders Loaded", value: orders.length, tone: "amber" },
    { label: "Users", value: users.length, tone: "blue" },
    { label: "Revenue (Loaded Orders)", value: formatCurrency(totalRevenue), tone: "green" },
    { label: "Active Customers", value: activeCustomers, tone: "slate" }
  ];

  const titleSuffix = `${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} View`;

  return (
    <div className="admin-dashboard">
      <div className="admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Control Center</p>
            <h1>Admin Dashboard</h1>
            <p className="header-subtitle">Monitor operations, users, and revenue in one place.</p>
          </div>
          <div className="header-actions">
            <button className="ghost-btn" onClick={refreshActiveTab}>Refresh</button>
            <button className="create-user-btn" onClick={() => setActiveTab("createUser")}>+ Create User</button>
            <button className="create-user-btn" onClick={() => setActiveTab("menu")}>+ Add Menu</button>
          </div>
        </div>

        <div className="stats-grid">
          {statCards.map((card) => (
            <div key={card.label} className={`stat-card ${card.tone}`}>
              <p>{card.label}</p>
              <h3>{card.value}</h3>
            </div>
          ))}
        </div>

        <div className="admin-tabs-wrap">
          <div className="admin-tabs">
            <button className={`tab-btn ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}>
              Orders <span className="tab-count">{orders.length}</span>
            </button>
            <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              Users <span className="tab-count">{users.length}</span>
            </button>
            <button className={`tab-btn ${activeTab === "revenue" ? "active" : ""}`} onClick={() => setActiveTab("revenue")}>
              Revenue
            </button>
            <button className={`tab-btn ${activeTab === "menu" ? "active" : ""}`} onClick={() => setActiveTab("menu")}>
              Menu <span className="tab-count">{menuItems.length}</span>
            </button>
          </div>

          {(activeTab === "orders" || activeTab === "users" || activeTab === "menu") && (
            <input
              className="search-input"
              type="text"
              value={searchQuery}
              placeholder={
                activeTab === "orders"
                  ? "Search order id, email, status, table"
                  : activeTab === "users"
                    ? "Search user id, name, email, role"
                    : "Search menu id, name, category, price"
              }
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {(activeTab === "orders" || activeTab === "revenue") && (
          <div className="filter-section">
            <div className="filter-field">
              <label htmlFor="timeRange">Time Range</label>
              <select id="timeRange" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="selectedDate">Date</label>
              <input type="date" id="selectedDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>
        )}

        {loading && <div className="alert alert-info">Loading data...</div>}

        {activeTab === "orders" && !loading && (
          <div className="tab-content">
            <div className="tab-title-row">
              <h2>Orders</h2>
              <span>{titleSuffix}</span>
            </div>
            {filteredOrders.length > 0 ? (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer Email</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Date and Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.customerEmail || order.email || "-"}</td>
                        <td>
                          {Array.isArray(order.items)
                            ? order.items.map((item) => `${item.name} x${item.qty}`).join(", ")
                            : order.itemCount || "-"}
                        </td>
                        <td>{formatCurrency(typeof order.totalAmount === "number" ? order.totalAmount : order.total)}</td>
                        <td>
                          <span className={`status status-${(order.status || "pending").toLowerCase()}`}>
                            {order.status || "PENDING"}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt || order.date || order.orderTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No orders found for this filter.</p>
            )}
          </div>
        )}

        {activeTab === "users" && !loading && (
          <div className="tab-content">
            <div className="tab-title-row">
              <h2>All Users</h2>
              <span>User Directory</span>
            </div>
            {filteredUsers.length > 0 ? (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td>{user.name || "-"}</td>
                        <td>{user.email || "-"}</td>
                        <td>
                          <span className={`role role-${(user.role || "customer").toLowerCase()}`}>
                            {user.role || "CUSTOMER"}
                          </span>
                        </td>
                        <td>{user.totalOrders || 0}</td>
                        <td>{formatCurrency(user.totalSpent)}</td>
                        <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No users found for this search.</p>
            )}
          </div>
        )}

        {activeTab === "revenue" && !loading && (
          <div className="tab-content">
            <div className="tab-title-row">
              <h2>Revenue</h2>
              <span>{titleSuffix}</span>
            </div>
            {revenue ? (
              <div className="revenue-cards">
                <div className="revenue-card">
                  <h3>Total Revenue</h3>
                  <p className="revenue-amount">{formatCurrency(revenue.total)}</p>
                </div>
                <div className="revenue-card">
                  <h3>Total Orders</h3>
                  <p className="revenue-amount">{revenue.orderCount || 0}</p>
                </div>
                <div className="revenue-card">
                  <h3>Average Order Value</h3>
                  <p className="revenue-amount">
                    {revenue.orderCount > 0 ? formatCurrency(revenue.total / revenue.orderCount) : formatCurrency(0)}
                  </p>
                </div>
                <div className="revenue-card">
                  <h3>Top Item</h3>
                  <p className="revenue-amount small">{revenue.topItem || "-"}</p>
                </div>
              </div>
            ) : (
              <p className="no-data">No revenue data available.</p>
            )}

            {revenue?.details && (
              <div className="table-wrapper revenue-details">
                <h3>Daily Breakdown</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(revenue.details) &&
                      revenue.details.map((day, idx) => (
                        <tr key={idx}>
                          <td>{day.date || "-"}</td>
                          <td>{day.orderCount || 0}</td>
                          <td>{formatCurrency(day.revenue)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "createUser" && (
          <AdminCreateUserSection
            onSuccess={() => {
              setActiveTab("users");
              fetchUsers();
            }}
          />
        )}

        {activeTab === "menu" && !loading && (
          <MenuManagementSection
            menuItems={filteredMenuItems}
            onSuccess={fetchMenuItems}
          />
        )}
      </div>
    </div>
  );
}

function AdminCreateUserSection({ onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await API.post("/api/admin/create-user", form);
      setMessage({ type: "success", text: "User created successfully!" });
      setForm({ name: "", email: "", password: "", role: "customer" });
      setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to create user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-section">
      <div className="tab-title-row">
        <h2>Create New User</h2>
        <span>Admin Action</span>
      </div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <form onSubmit={handleSubmit} className="create-user-form">
        <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="customer">Customer</option>
          <option value="kitchen_staff">Kitchen Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}

function MenuManagementSection({ menuItems, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    imageUrl: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      description: form.description.trim() || undefined
    };

    const endpoints = ["/api/admin/menu", "/api/menu"];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        await API.post(endpoint, payload);
        setMessage({ type: "success", text: "Menu item added successfully!" });
        setForm({ name: "", price: "", category: "", imageUrl: "", description: "" });
        onSuccess();
        setLoading(false);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    setMessage({
      type: "error",
      text: lastError?.response?.data?.message || "Failed to add menu item. Check backend menu create endpoint."
    });
    setLoading(false);
  };

  const handleDelete = async (item) => {
    const itemId = item?.id;
    if (!itemId) {
      setMessage({ type: "error", text: "Cannot remove item without ID." });
      return;
    }

    setDeletingId(itemId);
    setMessage(null);

    const endpoints = [`/api/admin/menu/${itemId}`, `/api/menu/${itemId}`];
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        await API.delete(endpoint);
        setMessage({ type: "success", text: "Menu item removed successfully!" });
        onSuccess();
        setDeletingId(null);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    setMessage({
      type: "error",
      text: lastError?.response?.data?.message || "Failed to remove menu item."
    });
    setDeletingId(null);
  };

  return (
    <div className="create-user-section">
      <div className="tab-title-row">
        <h2>Menu Management</h2>
        <span>Admin Action</span>
      </div>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className="create-user-form">
        <input type="text" name="name" placeholder="Item Name" value={form.name} onChange={handleChange} required />
        <input type="number" name="price" placeholder="Price" min="0" step="0.01" value={form.price} onChange={handleChange} required />
        <input type="text" name="category" placeholder="Category (optional)" value={form.category} onChange={handleChange} />
        <input type="text" name="imageUrl" placeholder="Image URL (optional)" value={form.imageUrl} onChange={handleChange} />
        <input type="text" name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Saving..." : "Add Menu Item"}
        </button>
      </form>

      <div className="menu-admin-list">
        <div className="tab-title-row">
          <h2>Current Menu</h2>
          <span>{menuItems.length} items</span>
        </div>
        {menuItems.length > 0 ? (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id || `${item.name}-${item.price}`}>
                    <td>{item.id || "-"}</td>
                    <td>{item.name || "-"}</td>
                    <td>{item.category || "-"}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data">No menu items found.</p>
        )}
      </div>
    </div>
  );
}
