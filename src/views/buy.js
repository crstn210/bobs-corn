import Backbone from 'backbone';

const BuyView = Backbone.View.extend({
  render() {
    this.$el.html(`
      <p class="text-stone-500">Buy view — fleshed out in the next commit.</p>
    `);
    return this;
  },
});

export default BuyView;
