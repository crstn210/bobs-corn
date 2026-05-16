import './style.css';
import $ from 'jquery';
import Backbone from 'backbone';
import './api.js';
import { session } from './models/session.js';
import AppView from './views/app.js';
import Router from './router.js';

Backbone.$ = $;

(async () => {
  await session.refresh();
  const app = new AppView();
  new Router({ app });
  Backbone.history.start();
})();
