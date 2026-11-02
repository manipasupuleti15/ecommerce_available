// API client using relative URLs for Nginx proxy routing to Spring Boot backend

// Generate or retrieve persistent visitor session ID
function getSessionId() {
  let sessionId = localStorage.getItem('apex_ecommerce_session');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem('apex_ecommerce_session', sessionId);
  }
  return sessionId;
}

const headers = () => ({
  'Content-Type': 'application/json',
  'X-Session-Id': getSessionId(),
});

export const api = {
  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.featured) query.append('featured', params.featured);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`/api/products${queryString}`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
    return res.json();
  },

  async getProduct(id) {
    const res = await fetch(`/api/products/${id}`, { headers: headers() });
    if (!res.ok) throw new Error(`Failed to fetch product ${id}`);
    return res.json();
  },

  async getCategories() {
    const res = await fetch('/api/products/categories', { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Cart
  async getCart() {
    const res = await fetch('/api/cart', { headers: headers() });
    if (!res.ok) throw new Error('Failed to load cart');
    return res.json();
  },

  async addToCart(productId, quantity = 1) {
    const res = await fetch('/api/cart/items', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ productId, quantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to add item to cart');
    }
    return res.json();
  },

  async updateCartItem(itemId, quantity) {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to update item quantity');
    }
    return res.json();
  },

  async removeCartItem(itemId) {
    const res = await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error('Failed to remove item from cart');
    return res.json();
  },

  async clearCart() {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error('Failed to clear cart');
    return true;
  },

  // Orders / Checkout
  async createOrder(checkoutData) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(checkoutData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to place order');
    }
    return res.json();
  },

  async getOrder(orderId) {
    const res = await fetch(`/api/orders/${orderId}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  // Health
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return { status: 'DOWN', database: 'UNKNOWN' };
      return res.json();
    } catch {
      return { status: 'DOWN', database: 'DISCONNECTED' };
    }
  },
};
