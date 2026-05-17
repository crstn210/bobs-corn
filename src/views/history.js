import Backbone from 'backbone';
import _ from 'underscore';
import Purchases from '../models/purchases.js';
import { toast } from './toast.js';

const HistoryView = Backbone.View.extend({
  className: 'space-y-6',

  initialize() {
    this.collection = new Purchases();
    this.loaded = false;
    this.listenTo(this.collection, 'sync', this.onLoaded);
    this.listenTo(this.collection, 'error', this.onError);
    this.collection.fetch();
  },

  onLoaded() {
    this.loaded = true;
    this.render();
  },

  onError(_collection, err) {
    this.loaded = true;
    toast(err?.message || 'Could not load history', { variant: 'error' });
    this.render();
  },

  render() {
    if (!this.loaded) {
      this.$el.html('<p class="text-stone-500">Loading your corn…</p>');
      return this;
    }
    if (this.collection.length === 0) {
      this.$el.html(`
        <h1 class="text-2xl font-semibold">Your corn</h1>
        <p class="text-stone-500">You haven't bought any corn yet. Bob is waiting.</p>
      `);
      return this;
    }
    const { purchased, shipped, pending } = this.collection.stats();
    this.$el.html(`
      <h1 class="text-2xl font-semibold">Your corn</h1>
      <div class="grid grid-cols-3 gap-4">
        ${this.statCard('Purchased', purchased, 'text-stone-700')}
        ${this.statCard('Shipped', shipped, 'text-emerald-700')}
        ${this.statCard('Pending', pending, 'text-amber-700')}
      </div>
      <div class="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table class="min-w-full text-sm">
          <thead class="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th class="px-4 py-2">#</th>
              <th class="px-4 py-2">Bought</th>
              <th class="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            ${this.collection.map((p) => this.rowTemplate(p)).join('')}
          </tbody>
        </table>
      </div>
    `);
    return this;
  },

  statCard(label, value, color) {
    return `
      <div class="rounded-lg border border-stone-200 bg-white px-4 py-3 text-center">
        <div class="text-xs uppercase tracking-wide text-stone-500">${label}</div>
        <div class="text-2xl font-semibold ${color}">${value}</div>
      </div>
    `;
  },

  rowTemplate(purchase) {
    const status = purchase.isShipped()
      ? `<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Shipped ${this.formatDate(purchase.get('shipped_at'))}</span>`
      : `<span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>`;
    return `
      <tr class="border-t border-stone-100">
        <td class="px-4 py-3 text-stone-500">#${purchase.get('id')}</td>
        <td class="px-4 py-3">${this.formatDate(purchase.get('bought_at'))}</td>
        <td class="px-4 py-3">${status}</td>
      </tr>
    `;
  },

  formatDate(ms) {
    if (!ms) return '';
    return _.escape(new Date(ms).toLocaleString());
  },
});

export default HistoryView;
