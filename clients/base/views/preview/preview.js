({
    plugins: ['ToggleMoreLess'],
    fallbackFieldTemplate: 'detail',
    switching: false,
    hiddenPanelExists: false,
    initialize: function (options) {
        app.view.View.prototype.initialize.call(this, options);
        this.action = 'detail';
        app.events.on('preview:open', this.openPreview, this);
        app.events.on("preview:render", this._renderPreview, this);
        app.events.on("preview:collection:change", this.updateCollection, this);
        app.events.on("preview:close", this.closePreview, this);
        app.events.on("preview:module:update", this.updatePreviewModule, this);
        if (this.layout) {
            this.layout.on("preview:pagination:fire", this.switchPreview, this);
        }
        this.collection = app.data.createBeanCollection(this.module);
    },
    updateCollection: function (collection) {
        if (this.collection) {
            this.collection.reset(collection.models);
            this.showPreviousNextBtnGroup();
        }
    },
    updatePreviewModule: function (module) {
        this.previewModule = module;
    },
    filterCollection: function () {
        this.collection.remove(_.filter(this.collection.models, function (model) {
            return !app.acl.hasAccessToModel("view", model);
        }, this), {silent: true});
    },
    _renderHtml: function () {
        this.showPreviousNextBtnGroup();
        app.view.View.prototype._renderHtml.call(this);
    },
    showPreviousNextBtnGroup: function () {
        if (!this.model || !this.layout || !this.collection) {
            return;
        }
        var collection = this.collection;
        if (!collection.size()) {
            this.layout.hideNextPrevious = true;
        }
        var recordIndex = collection.indexOf(collection.get(this.model.id));
        this.layout.previous = collection.models[recordIndex - 1] ? collection.models[recordIndex - 1] : undefined;
        this.layout.next = collection.models[recordIndex + 1] ? collection.models[recordIndex + 1] : undefined;
        this.layout.hideNextPrevious = _.isUndefined(this.layout.previous) && _.isUndefined(this.layout.next);
        this.layout.trigger("preview:pagination:update");
    },
    _renderPreview: function (model, collection, fetch, previewId) {
        var self = this;
        if (app.drawer && !app.drawer.isActive(this.$el)) {
            return;
        }
        if (this.model && model && (this.model.get("id") == model.get("id") && previewId == this.previewId)) {
            app.events.trigger("list:preview:decorate", false);
            app.events.trigger('preview:close');
            return;
        }
        if (app.metadata.getModule(model.module).isBwcEnabled) {
            return;
        }
        if (model) {
            var viewName = 'preview', previewMeta = app.metadata.getView(model.module, 'preview'), recordMeta = app.metadata.getView(model.module, 'record');
            if (_.isEmpty(previewMeta) || _.isEmpty(previewMeta.panels)) {
                viewName = 'record';
            }
            this.meta = this._previewifyMetadata(_.extend({}, recordMeta, previewMeta));
            if (fetch) {
                model.fetch({
                    showAlerts: true, success: function (model) {
                        self.renderPreview(model, collection);
                    }, view: viewName
                });
            } else {
                this.renderPreview(model, collection);
            }
        }
        this.previewId = previewId;
    },
    bindUpdates: function (sourceModel) {
        if (this.sourceModel) {
            this.stopListening(this.sourceModel);
        }
        this.sourceModel = sourceModel;
        this.listenTo(this.sourceModel, 'sync', function (model) {
            if (!this.model) {
                return;
            }
            this.model = model;
            this.renderPreview(this.model);
        }, this);
        this.listenTo(this.sourceModel, 'change', function () {
            if (!this.model) {
                return;
            }
            this.model.set(this.sourceModel.attributes);
        }, this);
        this.listenTo(this.sourceModel, 'destroy', function (model) {
            if (model && this.model && (this.model.get("id") == model.get("id"))) {
                app.events.trigger("list:preview:decorate", false);
                app.events.trigger('preview:close');
                return;
            }
        }, this);
    },
    renderPreview: function (model, newCollection) {
        if (newCollection) {
            this.collection.reset(newCollection.models);
        }
        if (model) {
            this.bindUpdates(model);
            this.model = app.data.createBean(model.module, model.toJSON());
            this.listenTo(this.model, 'change', function () {
                this.sourceModel.set(this.model.attributes);
            }, this);
            this.render();
            if (this.previewModule && this.previewModule === "Activities") {
                this.layout.hideNextPrevious = true;
                this.layout.trigger("preview:pagination:update");
            }
            app.events.trigger("preview:open", this);
            app.events.trigger("list:preview:decorate", this.model, this);
        }
    },
    _previewifyMetadata: function (meta) {
        this.hiddenPanelExists = false;
        _.each(meta.panels, function (panel) {
            if (panel.header) {
                panel.header = false;
                panel.fields = _.filter(panel.fields, function (field) {
                    return field.type != 'favorite' && field.type != 'follow';
                });
            }
            if (!this.hiddenPanelExists && panel.hide) {
                this.hiddenPanelExists = true;
            }
        }, this);
        return meta;
    },
    switchPreview: function (data, index, id, module) {
        var self = this, currID = id || this.model.get("id"), currIndex = index || _.indexOf(this.collection.models, this.collection.get(currID));
        if (this.switching || this.collection.models.length < 2) {
            return;
        }
        this.switching = true;
        if (data.direction === "left" && (currID === _.first(this.collection.models).get("id")) || data.direction === "right" && (currID === _.last(this.collection.models).get("id"))) {
            this.switching = false;
            return;
        } else {
            data.direction === "left" ? currIndex -= 1 : currIndex += 1;
            var currModule = module || this.collection.models[currIndex].module;
            var moduleMeta = app.metadata.getModule(currModule);
            this.model = app.data.createBean(currModule);
            this.bindUpdates(this.collection.models[currIndex]);
            this.model.set("id", this.collection.models[currIndex].get("id"));
            this.model.fetch({
                showAlerts: true, success: function (model) {
                    model.module = currModule;
                    self.model = null;
                    app.events.trigger("preview:render", model, null, false);
                    self.switching = false;
                }
            });
        }
    },
    openPreview: function () {
        var defaultLayout = this.closestComponent('sidebar');
        if (defaultLayout) {
            defaultLayout.trigger('sidebar:toggle', true);
        }
    },
    closePreview: function () {
        if (_.isUndefined(app.drawer) || app.drawer.isActive(this.$el)) {
            this.switching = false;
            delete this.model;
            this.collection.reset();
            this.$el.empty();
        }
    },
    bindDataChange: function () {
        if (this.collection) {
            this.collection.on("reset", this.filterCollection, this);
            this.collection.on("remove", function (model) {
                if (model && this.model && (this.model.get("id") == model.get("id"))) {
                    app.events.trigger("list:preview:decorate", false);
                    app.events.trigger('preview:close');
                }
            }, this);
        }
    }
})