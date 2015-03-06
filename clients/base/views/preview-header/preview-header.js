({
    className: 'preview-headerbar',
    events: {'click [data-direction]': 'triggerPagination', 'click .preview-headerbar .closeSubdetail': 'triggerClose'},
    initialize: function (options) {
        app.view.View.prototype.initialize.call(this, options);
        if (this.layout) {
            this.layout.off("preview:pagination:update", null, this);
            this.layout.on("preview:pagination:update", this.render, this);
        }
    },
    triggerPagination: function (e) {
        var direction = this.$(e.currentTarget).data();
        this.layout.trigger("preview:pagination:fire", direction);
    },
    triggerClose: function () {
        app.events.trigger("list:preview:decorate", null, this);
        app.events.trigger("preview:close");
    }
})