import Backbone from 'backbone';

const HistoryView = Backbone.View.extend({
  render() {
    this.$el.html(`
      <p class="text-stone-500">History view — fleshed out in a later commit.</p>
    `);
    return this;
  },
});

export default HistoryView;
