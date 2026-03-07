import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Menu.css";

const recommended = [
  { id: 1, img: "/images/vadapav.jpg", name: "Vada Pav" },
  { id: 2, img: "/images/Burger.png", name: "Burger" },
  { id: 3, img: "/images/pasta.png", name: "Pasta" }
];

const categories = [
  {
    id: 1,
    name: "South Indian",
    desc: "Dosa, Idli, Uttapam...",
    img: "/images/south indian.jpg",
    rating: 4.1,
    items: [
      { id: 101, name: "Dosa", price: 50, img: "/images/dosa.jpg" },
      { id: 102, name: "Idli", price: 30, img: "/images/idli.jpg" },
      { id: 103, name: "Uttapam", price: 45, img: "/images/uttapam.jpg" }
    ]
  },
  {
    id: 2,
    name: "Parathas",
    desc: "Aloo, Paneer, Mix Veg...",
    img: "/images/parathas.jpg",
    rating: 4.3,
    items: [
      { id: 201, name: "Aloo Paratha", price: 40, img: "/images/aloo-paratha.jpg" },
      { id: 202, name: "Paneer Paratha", price: 60, img: "/images/paneer-Paratha.jpg" }
    ]
  },
  {
    id: 3,
    name: "Snacks",
    desc: "Samosa, Sandwich, Fries...",
    img: "/images/snacks.jpg",
    rating: 4.2,
    items: [
      { id: 301, name: "Samosa", price: 20, img: "/images/samosa.jpg" },
      { id: 302, name: "Sandwich", price: 35, img: "/images/Sandwich.png" },
      { id: 303, name: "Fries", price: 30, img: "/images/fries2.jpg" }
    ]
  },
  {
    id: 4,
    name: "Maggies",
    desc: "Masala Maggi, Cheese Maggi...",
    img: "/images/maggie.jpg",
    rating: 4.7,
    items: [
      { id: 401, name: "Masala Maggi", price: 35, img: "/images/Masala-Maggi.jpg" },
      { id: 402, name: "Cheese Maggi", price: 45, img: "/images/cheese-maggi.jpg" }
    ]
  },
  {
    id: 5,
    name: "Chinese",
    desc: "Noodles, Manchurian...",
    img: "/images/chinnies noodles.jpg",
    rating: 4.0,
    items: [
      { id: 501, name: "Noodles", price: 60, img: "/images/chinnies noodles.jpg" },
      { id: 502, name: "Manchurian", price: 70, img: "/images/machurian.jpg" }
    ]
  },
  {
    id: 6,
    name: "Drinks",
    desc: "Cold Drink, Juice, Coffee...",
    img: "/images/drinks.jpg",
    rating: 4.5,
    items: [
      { id: 601, name: "Cold Drink", price: 20, img: "/images/colddrink.png" },
      { id: 602, name: "Juice", price: 25, img: "/images/juice.jpg" },
      { id: 603, name: "Coffee", price: 30, img: "/images/coffee.jpg" }
    ]
  },
  {
    id: 7,
    name: "Desserts",
    desc: "Ice Cream, Gulab Jamun...",
    img: "/images/dessert.jpg",
    rating: 4.6,
    items: [
      { id: 701, name: "Ice Cream", price: 40, img: "/images/ice-cream.jpg" },
      { id: 702, name: "Gulab Jamun", price: 35, img: "/images/gulab-jamun.jpg" }
    ]
  }
];

export default function Menu({ orderItems = [], setOrderItems = () => {} }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleAdd = (item) => {
    setOrderItems([...orderItems, item]);
    navigate("/order");
  };

  const recommendedWithPrice = useMemo(
    () => recommended.map((item) => ({ ...item, price: 40 + (item.id - 1) * 20, category: "Recommended" })),
    []
  );

  const allItems = useMemo(
    () => [
      ...recommendedWithPrice,
      ...categories.flatMap((cat) => cat.items.map((item) => ({ ...item, category: cat.name })))
    ],
    [recommendedWithPrice]
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? allItems.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(normalizedSearch))
    : [];

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value.trim()) setSelectedCat(null);
  };

  const clearSearch = () => setSearchTerm("");

  return (
    <div className="menu-bg">
      <div className="menu-header">
        <div className="menu-search">
          <span className="search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M10 2a8 8 0 1 0 5.3 14l4.35 4.35 1.4-1.4-4.35-4.35A8 8 0 0 0 10 2zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search dish or category"
            onChange={(e) => handleSearchChange(e.target.value)}
            value={searchTerm}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={clearSearch} aria-label="Clear search">
              x
            </button>
          )}
        </div>

        <div className="menu-banner">
          <div>
            <h3>ORDER WITHIN SECONDS VIA<br />UPI PAYMENT</h3>
            <p>Choose your favorite item and complete the order within seconds</p>
            <button>Choose</button>
          </div>
          <img src="/images/banner.png" alt="Banner" />
        </div>
      </div>

      {normalizedSearch && (
        <div className="menu-section">
          <h4>Search Results for "{searchTerm.trim()}"</h4>
          <div className="menu-items-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div className="menu-item-card" key={item.id}>
                  <img src={item.img} alt={item.name} className="item-img" />
                  <span>{item.name} - Rs {item.price}</span>
                  <button onClick={() => handleAdd(item)}>Add</button>
                </div>
              ))
            ) : (
              <p>No items found for "{searchTerm.trim()}".</p>
            )}
          </div>
        </div>
      )}

      {!selectedCat && !normalizedSearch && (
        <>
          <div className="menu-section">
            <h4>Recommended for you</h4>
            <div className="menu-recommended">
              {recommended.map((item) => (
                <div className="menu-reco-card" key={item.id}>
                  <img src={item.img} alt={item.name} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="menu-section">
            <h4>Categories</h4>
            <div className="menu-categories">
              {categories.map((cat) => (
                <div
                  className="menu-cat-card"
                  key={cat.id}
                  onClick={() => setSelectedCat(cat)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={cat.img} alt={cat.name} />
                  <div>
                    <div className="cat-title">{cat.name}</div>
                    <div className="cat-desc">{cat.desc}</div>
                    <div className="cat-rating">* {cat.rating}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedCat && !normalizedSearch && (
        <div className="menu-section">
          <h4>{selectedCat.name} Items</h4>
          <div className="menu-items-list">
            {selectedCat.items.map((item) => (
              <div className="menu-item-card" key={item.id}>
                <img src={item.img} alt={item.name} className="item-img" />
                <span>{item.name} - Rs {item.price}</span>
                <button onClick={() => handleAdd(item)}>Add</button>
              </div>
            ))}
          </div>
          <button className="back-btn" onClick={() => setSelectedCat(null)}>Back to Categories</button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      key: "home",
      path: "/menu",
      label: "Home",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 3 10h2v10h5v-6h4v6h5V10h2z" />
        </svg>
      )
    },
    {
      key: "cart",
      path: "/order",
      label: "Cart",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4h-2l-1 2v2h2l2.7 5.4-1 1.8a1 1 0 0 0 .9 1.5h11v-2H10l.8-1.5h7.4a1 1 0 0 0 .9-.6L22 7H8.2zM10 20a1.5 1.5 0 1 0 0 .01zm8 0a1.5 1.5 0 1 0 0 .01z" />
        </svg>
      )
    },
    {
      key: "track",
      path: "/order-tracking",
      label: "Track Order",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.1 8 12 8 12s8-6.9 8-12a8 8 0 0 0-8-8zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
      )
    },
    {
      key: "profile",
      path: "/profile",
      label: "Profile",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" />
        </svg>
      )
    }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.path)}
          className={`nav-icon-btn ${location.pathname === item.path ? "active" : ""}`}
          aria-label={item.label}
          title={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
        </button>
      ))}
    </nav>
  );
}
