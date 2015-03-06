(function (app) {
    app.events.on("app:init", function () {
        var routes, homeOptions = {dashboard: 'dashboard', activities: 'activities'}, getLastHomeKey = function () {
            return app.user.lastState.buildKey('last-home', 'app-header');
        };
        routes = [{name: "index", route: ""}, {name: "logout", route: "logout/?clear=:clear"}, {
            name: "logout",
            route: "logout"
        }, {
            name: "forgotpassword", route: "forgotpassword", callback: function () {
                app.controller.loadView({module: "Forgotpassword", layout: "forgotpassword", create: true});
            }
        }, {
            name: "home", route: "Home", callback: function () {
                var lastHomeKey = getLastHomeKey(), lastHome = app.user.lastState.get(lastHomeKey);
                if (lastHome === homeOptions.dashboard) {
                    app.router.list("Home");
                } else if (lastHome === homeOptions.activities) {
                    app.router.redirect('#activities');
                }
            }
        }, {
            name: 'about', route: 'about', callback: function () {
                app.controller.loadView({layout: 'about', module: 'Home', skipFetch: true});
            }
        }, {
            name: "activities", route: "activities", callback: function () {
                var lastHomeKey = getLastHomeKey();
                app.user.lastState.set(lastHomeKey, homeOptions.activities);
                app.controller.loadView({layout: "activities", module: "Activities", skipFetch: true});
            }
        }, {
            name: "bwc", route: "bwc/*url", callback: function (url) {
                app.logger.debug("BWC: " + url);
                var frame = $('#bwc-frame');
                if (frame.length === 1 && app.utils.rmIframeMark('index.php' + frame.get(0).contentWindow.location.search) === url) {
                    return;
                }
                if (url === 'index.php') {
                    app.router.navigate('#Home', {trigger: true});
                    return;
                }
                var params = {layout: 'bwc', url: url};
                var module = /module=([^&]*)/.exec(url);
                if (!_.isNull(module) && !_.isEmpty(module[1])) {
                    params.module = module[1];
                    if (module[1] === 'Import') {
                        module = /import_module=([^&]*)/.exec(url);
                        if (!_.isNull(module) && !_.isEmpty(module[1])) {
                            params.module = module[1];
                        }
                    }
                }
                app.controller.loadView(params);
            }
        }, {
            name: "sg_index", route: "Styleguide", callback: function () {
                app.controller.loadView({module: "Styleguide", layout: "styleguide", page_name: "home"});
            }
        }, {
            name: "sg_module", route: "Styleguide/:layout/:resource", callback: function (layout, resource) {
                var page = '', field = '';
                if (layout === 'field') {
                    page = 'field';
                    field = resource;
                } else if (layout === 'view') {
                    page = 'layouts_' + resource;
                } else if (layout === 'docs') {
                    page = resource;
                } else if (layout === 'layout') {
                    layout = resource;
                    page = 'module';
                }
                app.controller.loadView({
                    module: "Styleguide",
                    layout: layout,
                    page_name: page,
                    field_type: field,
                    skipFetch: true
                });
            }
        }, {name: "list", route: ":module"}, {
            name: "create", route: ":module/create", callback: function (module) {
                if (module === "Home") {
                    app.controller.loadView({module: module, layout: "record"});
                    return;
                }
                if (!app.router._moduleExists(module)) {
                    return;
                }
                var previousModule = app.controller.context.get("module"), previousLayout = app.controller.context.get("layout");
                if (!(previousModule === module && previousLayout === "records")) {
                    app.controller.loadView({module: module, layout: "records"});
                }
                app.drawer.open({layout: 'create-actions', context: {create: true}}, _.bind(function (context, model) {
                    var module = context.get("module") || model.module, route = app.router.buildRoute(module);
                    app.router.navigate(route, {trigger: (model instanceof Backbone.Model)});
                }, this));
            }
        }, {
            name: "vcardImport", route: ":module/vcard-import", callback: function (module) {
                if (!app.router._moduleExists(module)) {
                    return;
                }
                app.controller.loadView({module: module, layout: "records"});
                app.drawer.open({layout: 'vcard-import'}, _.bind(function () {
                    var route = app.router.buildRoute(module);
                    app.router.navigate(route, {replace: true});
                }, this));
            }
        }, {name: "layout", route: ":module/layout/:view"}, {
            name: 'config', route: ':module/config', callback: function (module) {
                if (!app.router._moduleExists(module)) {
                    return;
                }
                var previousModule = app.controller.context.get("module"), previousLayout = app.controller.context.get("layout");
                if (!(previousModule === module && previousLayout === "records")) {
                    app.controller.loadView({module: module, layout: "records"});
                }
                app.drawer.open({
                    layout: 'config',
                    context: {module: module, create: true}
                }, _.bind(function (context, model) {
                    var module = context.get("module") || model.module, route = app.router.buildRoute(module);
                    app.router.navigate(route, {trigger: (model instanceof Backbone.Model)});
                }, this));
            }
        }, {
            name: "homeRecord", route: "Home/:id", callback: function (id) {
                var lastHomeKey = getLastHomeKey();
                app.user.lastState.set(lastHomeKey, homeOptions.dashboard);
                app.router.record("Home", id);
            }
        }, {name: "record", route: ":module/:id"}, {name: "record", route: ":module/:id/:action"}, {
            name: "record_layout", route: ":module/:id/layout/:view", callback: function (module, id, view) {
                if (!app.router._moduleExists(module)) {
                    return;
                }
                app.router.record(module, id, null, view);
            }
        }, {
            name: "record_layout_action",
            route: ":module/:id/layout/:view/:action",
            callback: function (module, id, layout, action) {
                if (!app.router._moduleExists(module)) {
                    return;
                }
                app.router.record(module, id, action, layout);
            }
        }];
        app.routing.setRoutes(routes);
    });
    app.routing.before('route', function (options) {
        var hasAccess = app.router.hasAccessToModule(options) !== false, isBwcRedirect = app.router.bwcRedirect(options) !== false;
        return hasAccess && isBwcRedirect;
    });
    var titles = {
        'records': 'TPL_BROWSER_SUGAR7_RECORDS_TITLE',
        'record': 'TPL_BROWSER_SUGAR7_RECORD_TITLE',
        'about': 'TPL_BROWSER_SUGAR7_ABOUT_TITLE'
    };
    var getTitle = function (model) {
        var context = app.controller.context, module = context.get('module'), template = Handlebars.compile(app.lang.get(titles[context.get('layout')], module) || ''), moduleString = app.lang.getAppListStrings('moduleList'), title;
        title = template(_.extend({
            module: moduleString[module],
            appId: app.config.appId
        }, model ? model.attributes : {}));
        return $('<span/>').html(title).text();
    };
    var setTitle = function (model) {
        var title = getTitle(model);
        document.title = title || document.title;
    };
    var prevModel;
    app.events.on("app:view:change", function () {
        var context = app.controller.context, module = context.get("module"), metadata = app.metadata.getModule(module), title;
        if (prevModel) {
            prevModel.off("change", setTitle);
        }
        if (_.isEmpty(metadata) || metadata.isBwcEnabled) {
            title = $('#bwc-frame').get(0) ? $('#bwc-frame').get(0).contentWindow.document.title : getTitle();
        } else {
            title = getTitle();
            if (!_.isEmpty(context.get("model"))) {
                var currModel = context.get("model");
                currModel.on("change", setTitle, this);
                app.controller.layout.once("dispose", function () {
                    currModel.off("change", setTitle);
                });
                prevModel = currModel;
            }
        }
        document.title = title || document.title;
    }, this);
    var refreshExternalLogin = function () {
        var config = app.metadata.getConfig();
        app.api.setExternalLogin(config && config['externalLogin']);
    };
    app.events.on("app:sync:complete", refreshExternalLogin, this);
    app.events.on("app:init", refreshExternalLogin, this);
    app.Router = app.Router.extend({
        bwcRedirect: function (options) {
            if (options && _.isArray(options.args) && options.args[0]) {
                var module = options.args[0], id = options.args[1], action = id ? 'DetailView' : 'index', meta = app.metadata.getModule(module);
                if (meta && meta.isBwcEnabled) {
                    var sidecarAction = options.args[2] || options.route, bwcAction = app.bwc.getAction(sidecarAction);
                    if (bwcAction !== sidecarAction) {
                        action = bwcAction;
                    }
                    var redirect = 'bwc/index.php?module=' + module + '&action=' + action;
                    if (id) {
                        redirect += '&record=' + id;
                    }
                    app.router.navigate(redirect, {trigger: true, replace: true});
                    return false;
                }
            }
            return true;
        }, hasAccessToModule: function (options) {
            options = options || {};
            var checkAccessRoutes = {
                'record': 'view',
                'create': 'create',
                'vcardImport': 'create'
            }, route = options.route || '', args = options.args || [], module = args[0], accessCheck = checkAccessRoutes[route];
            if (accessCheck && !app.acl.hasAccess(accessCheck, module)) {
                app.controller.loadView({layout: 'access-denied'});
                return false;
            }
            var showWizard = false;
            if (app.user && app.user.has('show_wizard')) {
                showWizard = app.user.get('show_wizard');
                if (showWizard) {
                    var system_config = app.metadata.getConfig();
                    if (system_config.system_status && system_config.system_status.level && system_config.system_status.level === 'admin_only') {
                        showWizard = false;
                    }
                }
            }
            if (showWizard) {
                var callbacks = {
                    complete: function () {
                        var module = app.utils.getWindowLocationParameterByName('module', window.location.search), action = app.utils.getWindowLocationParameterByName('action', window.location.search);
                        if (_.isString(module) && _.isString(action) && module.toLowerCase() === 'users' && action.toLowerCase() === 'authenticate') {
                            window.location = window.location.pathname;
                        } else {
                            window.location.reload();
                        }
                    }
                };
                app.controller.loadView({
                    layout: 'first-login-wizard',
                    module: 'Users',
                    modelId: app.user.get('id'),
                    callbacks: callbacks,
                    wizardName: app.user.get('type')
                });
                $('#header').hide();
                return false;
            }
            var passwordExpired = false;
            if (route && route !== 'logout' && app.user && app.user.has('is_password_expired')) {
                passwordExpired = app.user.get('is_password_expired');
                if (passwordExpired) {
                    app.controller.loadView({
                        layout: 'password-expired',
                        module: 'Users',
                        callbacks: {
                            complete: function () {
                                window.location.reload();
                            }
                        },
                        modelId: app.user.get('id')
                    });
                    return false;
                }
            }
            var subroute;
            if (module) {
                var qpos = module.indexOf('?');
                subroute = qpos > -1 ? module.substring(0, module.indexOf('?')) : module;
            }
            var viewId = options.route + (subroute ? '/' + subroute : '');
            app.analytics.currentViewId = viewId;
            app.analytics.trackPageView(app.analytics.currentViewId);
            return true;
        }
    });
    app.augment("progress", _.extend({
        init: function () {
            NProgress.configure({template: '<div class="loading gate">' + '    <div class="progress progress-danger">' + '        <div role="bar" class="bar"></div>' + '    </div>' + '</div>'});
            NProgress.start();
            NProgress.set(0.25);
        }, hide: function () {
            $("#nprogress").hide();
        }
    }, NProgress), false);
    app.events.on("app:logout:success", function (data) {
        if (app.config && app.config.externalLogin && data && data.url) {
            if (!$('#logoutframe').length) {
                $("#sugarcrm").append('<iframe id="logoutframe" />');
                $('#logoutframe').hide();
            }
            $('#logoutframe').load(function () {
                $('#logoutframe').off('load');
                $('#logoutframe').attr('src', '');
            });
            $('#logoutframe').attr('src', data.url);
        }
    });
})(SUGAR.App);