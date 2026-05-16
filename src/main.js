import './style.css';
import $ from 'jquery';
import Backbone from 'backbone';
import './api.js';
import { session } from './models/session.js';

Backbone.$ = $;

session.refresh().finally(() => {
  document.getElementById('app').innerHTML = `
    <main class="min-h-screen flex flex-col items-center justify-center gap-3">
      <h1 class="text-4xl font-semibold text-amber-700">Bob's Corn</h1>
      <p class="text-sm text-stone-500">
        ${session.isLoggedIn() ? `Signed in as ${session.get('name')}` : 'Not signed in'}
      </p>
    </main>
  `;
});

