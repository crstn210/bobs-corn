import './style.css';
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';

Backbone.$ = $;

document.getElementById('app').innerHTML = `
  <main class="min-h-screen flex flex-col items-center justify-center gap-3">
    <h1 class="text-4xl font-semibold text-amber-700">Bob's Corn</h1>
    <p class="text-sm text-stone-500">
      Backbone ${Backbone.VERSION} · Underscore ${_.VERSION} · jQuery ${$.fn.jquery}
    </p>
  </main>
`;
