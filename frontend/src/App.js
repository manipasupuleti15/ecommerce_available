import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import './App.css';

export default function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [loading, setLoading] = useState(true);
  const [apiHealth, setApiHealth] = useState({ status: 'CHECKING', database: 'UNKNOWN' });

  // Modals & Panels
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState(null);

  // Cart state
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    tax: 0,
    shippingFee: 0,
    total: 0,
    totalItems: 0,
  });

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    city: '',
    postalCode: '',
    country: 'United States',
    cardNumber: '4242 •••• •••• 4242',
    cardExp: '12/28',
    cardCvv: '123',
    paymentMethod: 'Credit Card (Simulated)',
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Check health and load categories
  useEffect(() => {
    api.checkHealth()
      .then((health) => setApiHealth(health))
      .catch(() => setApiHealth({ status: 'DOWN', database: 'DISCONNECTED' }));

    api.getCategories()
      .then((cats) => setCategories(['All', ...cats]))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch cart
  const refreshCart = useCallback(async () => {
    try {
      const cartData = await api.getCart();
      setCart(cartData);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Fetch products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({
        category: selectedCategory,
        search: searchTerm,
      });

      // Sort products
      let sorted = [...data];
      if (sortBy === 'price-low') {
        sorted.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high') {
        sorted.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === 'featured') {
        sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }

      setProducts(sorted);
    } catch (err) {
      showToast('Could not load products. Please check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timeout);
  }, [loadProducts]);

  // Cart operations
  const handleAddToCart = async (product, quantity = 1) => {
    try {
      const updatedCart = await api.addToCart(product.id, quantity);
      setCart(updatedCart);
      showToast(`Added "${product.name}" to your cart!`);
      if (selectedProduct) setSelectedProduct(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateQty = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    try {
      const updatedCart = await api.updateCartItem(itemId, newQty);
      setCart(updatedCart);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRemoveCartItem = async (itemId, name) => {
    try {
      const updatedCart = await api.removeCartItem(itemId);
      setCart(updatedCart);
      showToast(`Removed "${name}" from cart.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleClearCart = async () => {
    try {
      await api.clearCart();
      refreshCart();
      showToast('Cart cleared.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Checkout submit
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!checkoutForm.customerName || !checkoutForm.customerEmail || !checkoutForm.shippingAddress) {
      showToast('Please fill in all required shipping fields', 'error');
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await api.createOrder({
        customerName: checkoutForm.customerName,
        customerEmail: checkoutForm.customerEmail,
        shippingAddress: checkoutForm.shippingAddress,
        city: checkoutForm.city,
        postalCode: checkoutForm.postalCode,
        country: checkoutForm.country,
        paymentMethod: checkoutForm.paymentMethod,
      });

      setOrderConfirmation(order);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      refreshCart();
      showToast(`Order #${order.orderNumber} placed successfully!`);
    } catch (err) {
      showToast(err.message || 'Order failed to process.', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const freeShippingThreshold = 50.0;
  const freeShippingPct = Math.min(100, (cart.subtotal / freeShippingThreshold) * 100);

  return (
    <div className="app-container">
      {/* Top Banner */}
      <div className="announcement-bar">
        <span>⚡ Free Express Shipping on orders over $50</span>
        <span>•</span>
        <span>🛡️ 30-Day Money Back Guarantee</span>
        <span>•</span>
        <span>🔒 Secure Multi-Container Cloud Architecture</span>
      </div>

      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand" onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}>
            <div className="brand-icon">A</div>
            <div className="brand-title">Apex<span>Store</span></div>
          </div>

          <div className="search-container">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search products, gear, audio, devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="nav-actions">
            <div className={`status-pill ${apiHealth.status === 'UP' ? 'up' : ''}`} title={`Backend: ${apiHealth.status} | MySQL: ${apiHealth.database}`}>
              <div className="status-dot"></div>
              <span>{apiHealth.status === 'UP' ? 'API Ready' : 'Connecting...'}</span>
            </div>

            <button className="cart-button" onClick={() => setIsCartOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span>Cart</span>
              {cart.totalItems > 0 && <span className="cart-badge">{cart.totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <span className="hero-tag">Production Demo Platform</span>
            <h1 className="hero-title">Next-Gen Tech & Everyday Essentials.</h1>
            <p className="hero-desc">
              Engineered with React, Java Spring Boot REST API, and MySQL 8.4 in an isolated, secure Docker network.
            </p>
            <div className="hero-features">
              <div className="hero-feature-item">
                <span className="hero-feature-icon">✓</span> Free Shipping over $50
              </div>
              <div className="hero-feature-item">
                <span className="hero-feature-icon">✓</span> Spring Data JPA & MySQL 8.4
              </div>
              <div className="hero-feature-item">
                <span className="hero-feature-icon">✓</span> Zero Exposed Database Ports
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Sorting Bar */}
        <section className="filter-bar">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing {products.length} {products.length === 1 ? 'item' : 'items'}
            </span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="featured">Featured First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </section>

        {/* Product Grid */}
        {loading ? (
          <div className="empty-state">
            <p>Loading products from Spring Boot API...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3>No products found</h3>
            <p>Try clearing your search or switching to another category.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div
                  className="product-image-wrap"
                  onClick={() => {
                    setSelectedProduct(product);
                    setModalQty(1);
                  }}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                  />
                  <div className="product-badges">
                    {product.featured && <span className="badge-featured">Featured</span>}
                    <span className="badge-category">{product.category}</span>
                  </div>
                </div>

                <div className="product-body">
                  <div className="product-rating">
                    <span>★</span>
                    <strong>{product.rating || 4.5}</strong>
                    <span className="review-count">({product.reviewCount || 120} reviews)</span>
                  </div>

                  <h3
                    className="product-title"
                    onClick={() => {
                      setSelectedProduct(product);
                      setModalQty(1);
                    }}
                  >
                    {product.name}
                  </h3>

                  <p className="product-desc">{product.description}</p>

                  <div className="product-footer">
                    <div>
                      <div className="product-price">${Number(product.price).toFixed(2)}</div>
                      <div style={{ fontSize: '0.75rem', color: product.stock > 5 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
                      </div>
                    </div>

                    <button
                      className="btn-add-cart"
                      disabled={product.stock <= 0}
                      onClick={() => handleAddToCart(product, 1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedProduct(null)}>✕</button>
            <div className="product-modal-grid">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="product-modal-img"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="badge-category" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                  {selectedProduct.category}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
                  {selectedProduct.name}
                </h2>
                <div className="product-rating" style={{ marginBottom: '16px' }}>
                  <span>★</span>
                  <strong>{selectedProduct.rating || 4.5}</strong>
                  <span className="review-count">({selectedProduct.reviewCount || 100} reviews)</span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
                  ${Number(selectedProduct.price).toFixed(2)}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  {selectedProduct.description}
                </p>

                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Quantity:</span>
                    <div className="quantity-picker">
                      <button
                        className="qty-btn"
                        onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      >
                        -
                      </button>
                      <span className="qty-count">{modalQty}</span>
                      <button
                        className="qty-btn"
                        onClick={() => setModalQty(Math.min(selectedProduct.stock, modalQty + 1))}
                      >
                        +
                      </button>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      ({selectedProduct.stock} available in stock)
                    </span>
                  </div>

                  <button
                    className="btn-primary"
                    disabled={selectedProduct.stock <= 0}
                    onClick={() => handleAddToCart(selectedProduct, modalQty)}
                  >
                    Add {modalQty} to Cart • ${(selectedProduct.price * modalQty).toFixed(2)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Shopping Cart ({cart.totalItems})</h3>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            {cart.items.length === 0 ? (
              <div className="empty-state" style={{ margin: 'auto' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h3>Your cart is empty</h3>
                <p>Discover our catalog and add items to your cart.</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.items.map((item) => (
                    <div key={item.id} className="cart-item">
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="cart-item-thumb"
                      />
                      <div className="cart-item-info">
                        <div className="cart-item-title">{item.productName}</div>
                        <div className="cart-item-price">${Number(item.unitPrice).toFixed(2)}</div>
                        <div className="cart-item-controls">
                          <div className="quantity-picker">
                            <button
                              className="qty-btn"
                              onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                            >
                              -
                            </button>
                            <span className="qty-count">{item.quantity}</span>
                            <button
                              className="qty-btn"
                              disabled={item.quantity >= item.stockAvailable}
                              onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="delete-btn"
                            onClick={() => handleRemoveCartItem(item.id, item.productName)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="free-shipping-progress">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>
                        {cart.subtotal >= freeShippingThreshold
                          ? '🎉 You unlocked Free Shipping!'
                          : `Add $${(freeShippingThreshold - cart.subtotal).toFixed(2)} more for Free Shipping`}
                      </span>
                      <span>{Math.round(freeShippingPct)}%</span>
                    </div>
                    <div className="shipping-bar-track">
                      <div className="shipping-bar-fill" style={{ width: `${freeShippingPct}%` }}></div>
                    </div>
                  </div>

                  <div className="price-row">
                    <span>Subtotal</span>
                    <span>${Number(cart.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Estimated Tax (8%)</span>
                    <span>${Number(cart.tax).toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span>Shipping</span>
                    <span>{Number(cart.shippingFee) === 0 ? 'FREE' : `$${Number(cart.shippingFee).toFixed(2)}`}</span>
                  </div>
                  <div className="price-row total">
                    <span>Total</span>
                    <span>${Number(cart.total).toFixed(2)}</span>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ marginTop: '16px' }}
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                  >
                    Proceed to Checkout (${Number(cart.total).toFixed(2)})
                  </button>

                  <button
                    style={{ width: '100%', marginTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}
                    onClick={handleClearCart}
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsCheckoutOpen(false)}>✕</button>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Complete Your Order</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
              Enter your shipping details below to place your order.
            </p>

            <div className="simulated-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span><strong>Simulated Sandbox Checkout:</strong> No real payment charges will occur.</span>
            </div>

            <form onSubmit={handleCheckoutSubmit}>
              <div className="checkout-grid">
                <div className="form-group full">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Alex Morgan"
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="alex@example.com"
                    value={checkoutForm.customerEmail}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerEmail: e.target.value })}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Shipping Street Address *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="742 Evergreen Terrace"
                    value={checkoutForm.shippingAddress}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, shippingAddress: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Springfield"
                    value={checkoutForm.city}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Postal / ZIP Code *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="97477"
                    value={checkoutForm.postalCode}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value })}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Country</label>
                  <input
                    type="text"
                    className="form-input"
                    value={checkoutForm.country}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, country: e.target.value })}
                  />
                </div>

                <div className="form-group full" style={{ marginTop: '10px' }}>
                  <label className="form-label">Simulated Card Details (Auto-filled)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      disabled
                      className="form-input"
                      style={{ flex: 2, background: '#f8fafc' }}
                      value={checkoutForm.cardNumber}
                    />
                    <input
                      type="text"
                      disabled
                      className="form-input"
                      style={{ flex: 1, background: '#f8fafc' }}
                      value={checkoutForm.cardExp}
                    />
                    <input
                      type="text"
                      disabled
                      className="form-input"
                      style={{ flex: 1, background: '#f8fafc' }}
                      value={checkoutForm.cardCvv}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                <div className="price-row">
                  <span>Subtotal ({cart.totalItems} items)</span>
                  <span>${Number(cart.subtotal).toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Estimated Tax (8%)</span>
                  <span>${Number(cart.tax).toFixed(2)}</span>
                </div>
                <div className="price-row">
                  <span>Shipping</span>
                  <span>{Number(cart.shippingFee) === 0 ? 'FREE' : `$${Number(cart.shippingFee).toFixed(2)}`}</span>
                </div>
                <div className="price-row total">
                  <span>Total Due</span>
                  <span>${Number(cart.total).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  style={{ padding: '12px 20px', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
                  onClick={() => setIsCheckoutOpen(false)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submittingOrder}
                >
                  {submittingOrder ? 'Processing Order...' : `Pay $${Number(cart.total).toFixed(2)} & Complete Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmation Screen */}
      {orderConfirmation && (
        <div className="modal-overlay" onClick={() => setOrderConfirmation(null)}>
          <div className="confirmation-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-wrap">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Order Confirmed!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
              Thank you, <strong>{orderConfirmation.customerName}</strong>. A confirmation email has been sent to{' '}
              <strong>{orderConfirmation.customerEmail}</strong>.
            </p>

            <div className="order-badge-pill">
              {orderConfirmation.orderNumber}
            </div>

            <div style={{ textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Shipping Destination:</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                {orderConfirmation.shippingAddress}, {orderConfirmation.city}, {orderConfirmation.postalCode}, {orderConfirmation.country}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontWeight: 700 }}>
                <span>Total Amount Paid:</span>
                <span>${Number(orderConfirmation.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setOrderConfirmation(null)}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Alerts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
