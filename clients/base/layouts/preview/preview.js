
({
    events: {"click .closeSubdetail": "hidePreviewPanel"}, initialize: function (opts) {
        app.view.Layout.prototype.initialize.call(this, opts);
        app.events.on("preview:open", this.showPreviewPanel, this);
        app.events.on("preview:close", this.hidePreviewPanel, this);
        app.events.on("preview:pagination:hide", this.hidePagination, this);
    }, showPreviewPanel: function (event) {
        if (_.isUndefined(app.drawer) || app.drawer.isActive(this.$el)) {
            var layout = this.$el.parents(".sidebar-content");
            layout.find(".side-pane").removeClass("active");
            layout.find(".dashboard-pane").hide();
            layout.find(".preview-pane").addClass("active");
            var defaultLayout = this.closestComponent('sidebar');
            if (defaultLayout) {
                defaultLayout.trigger('sidebar:toggle', true);
            }
        }
    }, hidePreviewPanel: function (event) {
        if (_.isUndefined(app.drawer) || app.drawer.isActive(this.$el)) {
            var layout = this.$el.parents(".sidebar-content");
            layout.find(".side-pane").addClass("active");
            layout.find(".dashboard-pane").show();
            layout.find(".preview-pane").removeClass("active");
        }
    }, hidePagination: function () {
        if (_.isUndefined(app.drawer) || app.drawer.isActive(this.$el)) {
            this.hideNextPrevious = true;
            this.trigger('preview:pagination:update');
        }
    }
})