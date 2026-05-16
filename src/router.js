import Backbone from 'backbone';
import { session } from './models/session.js';
import LoginView from './views/login.js';
import BuyView from './views/buy.js';
import HistoryView from './views/history.js';

const Router = Backbone.Router.extend({
  routes: {
    '': 'home',
    'login': 'login',
    'history': 'history',
  },

  initialize({ app }) {
    this.app = app;
  },

  home() {
    if (!session.isLoggedIn()) return this.navigate('login', { trigger: true, replace: true });
    this.app.show(new BuyView());
  },

  login() {
    if (session.isLoggedIn()) return this.navigate('', { trigger: true, replace: true });
    this.app.show(new LoginView());
  },

  history() {
    if (!session.isLoggedIn()) return this.navigate('login', { trigger: true, replace: true });
    this.app.show(new HistoryView());
  },
});

export default Router;
