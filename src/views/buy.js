import Backbone from 'backbone';
import { api, RateLimitError } from '../api.js';
import { session } from '../models/session.js';
import { toast } from './toast.js';

const RATE_LIMIT_MS = 60_000;

const BuyView = Backbone.View.extend({
  className: 'text-center max-w-md mx-auto',

  events: {
    'click .js-buy': 'onBuy',
  },

  initialize() {
    this.cooldown = 0;
    const nextBuyAt = session.get('next_buy_at');
    if (nextBuyAt && nextBuyAt > Date.now()) {
      this._initialCooldown = Math.ceil((nextBuyAt - Date.now()) / 1000);
    }
  },

  render() {
    this.$el.html(`
      <div class="text-7xl mb-4 select-none">🌽</div>
      <h1 class="text-2xl font-semibold mb-2">Bob's Corn</h1>
      <p class="text-stone-500 mb-8">Fresh corn, hand-picked by Bob himself.</p>
      <button
        type="button"
        class="js-buy rounded-lg bg-amber-600 px-8 py-3 text-lg font-medium text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
      >Buy 1 corn</button>
      <p class="js-status mt-4 min-h-[1.25rem] text-sm text-stone-500"></p>
    `);
    this.$buy = this.$('.js-buy');
    this.$status = this.$('.js-status');
    if (this._initialCooldown) {
      this.startCooldown(this._initialCooldown);
      this._initialCooldown = null;
    }
    return this;
  },

  async onBuy() {
    this.$buy.prop('disabled', true);
    try {
      await api('POST', '/api/buy');
      session.set('next_buy_at', Date.now() + RATE_LIMIT_MS);
      toast("Sold! That's one corn for you.", { variant: 'success' });
      this.startCooldown(60);
    } catch (err) {
      if (err instanceof RateLimitError) {
        toast('Hold on — Bob can only sell one corn per minute.', { variant: 'error' });
        this.startCooldown(err.retryAfterSeconds);
      } else {
        toast(err.message || 'Something went wrong', { variant: 'error' });
        this.$buy.prop('disabled', false);
      }
    }
  },

  startCooldown(seconds) {
    this.cooldown = seconds;
    this.tick();
    this._interval = setInterval(() => this.tick(), 1000);
  },

  tick() {
    if (this.cooldown <= 0) {
      clearInterval(this._interval);
      this._interval = null;
      this.$buy.prop('disabled', false);
      this.$status.text('');
      return;
    }
    this.$buy.prop('disabled', true);
    this.$status.text(`Next corn available in ${this.cooldown}s`);
    this.cooldown -= 1;
  },

  remove() {
    if (this._interval) clearInterval(this._interval);
    return Backbone.View.prototype.remove.call(this);
  },
});

export default BuyView;
