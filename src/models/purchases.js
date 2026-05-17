import Backbone from 'backbone';
import Purchase from './purchase.js';

const Purchases = Backbone.Collection.extend({
  model: Purchase,
  url: '/api/purchases',

  parse(response) {
    return response.purchases;
  },

  stats() {
    const purchased = this.length;
    const shipped = this.filter((p) => p.isShipped()).length;
    return { purchased, shipped, pending: purchased - shipped };
  },
});

export default Purchases;
