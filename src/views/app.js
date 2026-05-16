import Backbone from 'backbone';
import _ from 'underscore';
import { session } from '../models/session.js';

const AppView = Backbone.View.extend({
  el: '#app',

  events: {
    'click .js-logout': 'onLogout',
  },

  initialize() {
    this.listenTo(session, 'change', this.renderShell);
    this.renderShell();
  },

  renderShell() {
    const loggedIn = session.isLoggedIn();
    const name = session.get('name');
    this.$el.html(`
      <div class="min-h-screen flex flex-col bg-amber-50 text-stone-900">
        ${loggedIn ? this.navTemplate(name) : ''}
        <main id="content" class="flex-1 w-full max-w-3xl mx-auto px-6 py-10"></main>
      </div>
    `);
    if (this.currentView) {
      this.$('#content').empty().append(this.currentView.el);
    }
    return this;
  },

  navTemplate(name) {
    return `
      <header class="border-b border-amber-200 bg-white/80 backdrop-blur">
        <div class="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="#" class="font-semibold text-amber-700">Bob's Corn</a>
          <nav class="flex items-center gap-5 text-sm">
            <a href="#" class="hover:text-amber-700">Buy</a>
            <a href="#history" class="hover:text-amber-700">History</a>
            <span class="text-stone-300">|</span>
            <span class="text-stone-600">${_.escape(name || '')}</span>
            <button class="js-logout text-stone-500 hover:text-red-600">Logout</button>
          </nav>
        </div>
      </header>
    `;
  },

  show(view) {
    this.currentView?.remove();
    this.currentView = view;
    this.$('#content').empty().append(view.el);
    view.render();
  },

  async onLogout() {
    await session.logout();
    Backbone.history.navigate('login', { trigger: true });
  },
});

export default AppView;
