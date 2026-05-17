import Backbone from 'backbone';

const Purchase = Backbone.Model.extend({
  isShipped() {
    return !!this.get('shipped_at');
  },
});

export default Purchase;
