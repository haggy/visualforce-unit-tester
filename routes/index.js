/**
 * This file is where you define your application routes and controllers.
 * 
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 * 
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 * 
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 * 
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 * 
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

var _ = require('underscore'),
	keystone = require('keystone'),
	middleware = require('./middleware'),
	importRoutes = keystone.importer(__dirname);

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Import Route Controllers
var routes = {
    api: importRoutes('./api'),
	views: importRoutes('./views')
};

// Setup Route Bindings
exports = module.exports = function(app) {
	
	// Views
	app.get('/', routes.views.index);
	app.all('/contact', routes.views.contact);
	
	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);
	app.all('/select-test', middleware.requireUser, routes.views.select_test);
    app.all('/edit-tests', middleware.requireUser, routes.views.edit_tests);

    // REST services routes
    app.all('/api*', keystone.initAPI);

    app.put('/api/client-tests', middleware.requireUser, routes.api.client_tests.update);
    app.post('/api/client-tests', middleware.requireUser, routes.api.client_tests.create);
    app.get('/api/client-tests/:id', middleware.requireUser, routes.api.client_tests.get);
    app.get('/api/client-tests/:id/select/:select', middleware.requireUser, routes.api.client_tests.get);
    app.get('/api/client-tests/client/:client_id', middleware.requireUser, routes.api.client_tests.get);

    app.all('/api/select-test', middleware.requireUser, routes.api.select_test);
};
