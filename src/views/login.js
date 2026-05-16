import Backbone from 'backbone';
import { session } from '../models/session.js';

const LoginView = Backbone.View.extend({
  className: 'max-w-sm mx-auto',

  events: {
    'submit form': 'onSubmit',
  },

  render() {
    this.$el.html(`
      <h1 class="text-2xl font-semibold mb-2">Sign in</h1>
      <p class="text-sm text-stone-500 mb-6">Enter your name and secret to buy corn.</p>
      <form class="space-y-3" novalidate>
        <input
          name="name"
          autocomplete="off"
          placeholder="Name"
          class="w-full rounded border border-stone-300 bg-white px-3 py-2 focus:border-amber-500 focus:outline-none"
          required
        />
        <input
          name="secret"
          type="password"
          autocomplete="current-password"
          placeholder="Secret"
          class="w-full rounded border border-stone-300 bg-white px-3 py-2 focus:border-amber-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          class="w-full rounded bg-amber-600 px-3 py-2 font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >Sign in</button>
        <p class="js-error text-sm text-red-600 min-h-[1.25rem]"></p>
      </form>
    `);
    return this;
  },

  async onSubmit(e) {
    e.preventDefault();
    const $err = this.$('.js-error').text('');
    const $btn = this.$('button[type=submit]').prop('disabled', true);
    const name = this.$('input[name=name]').val().trim();
    const secret = this.$('input[name=secret]').val();
    try {
      await session.login(name, secret);
      Backbone.history.navigate('', { trigger: true });
    } catch (err) {
      $err.text(err.status === 401 ? 'Invalid name or secret' : err.message);
      $btn.prop('disabled', false);
    }
  },
});

export default LoginView;
