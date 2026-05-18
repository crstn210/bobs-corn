import Backbone from 'backbone';
import { api, getToken, setToken, clearToken } from '../api.js';

const Session = Backbone.Model.extend({
  defaults() {
    return { token: getToken(), name: null, next_buy_at: null };
  },

  isLoggedIn() {
    return !!this.get('token');
  },

  async login(name, secret) {
    const { token, name: returnedName, next_buy_at } = await api('POST', '/api/login', { name, secret });
    setToken(token);
    this.set({ token, name: returnedName, next_buy_at });
  },

  async logout() {
    if (!this.isLoggedIn()) return;
    try {
      await api('POST', '/api/logout');
    } catch {
      // token may already be invalid; we still clear locally
    }
    clearToken();
    this.set({ token: null, name: null, next_buy_at: null });
  },

  async refresh() {
    if (!this.isLoggedIn()) return;
    try {
      const { name, next_buy_at } = await api('GET', '/api/me');
      this.set({ name, next_buy_at });
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        this.set({ token: null, name: null, next_buy_at: null });
      } else {
        throw err;
      }
    }
  },
});

export const session = new Session();
export default Session;
