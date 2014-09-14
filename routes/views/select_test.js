var keystone = require('keystone');
var Client = keystone.list('Client');
var ClientTest = keystone.list('ClientTest');


exports = module.exports = function(req, res) {

    var view = new keystone.View(req, res),
        locals = res.locals;

    locals.pages = {};
    locals.resources = {};
    locals.clients = {};

    view.on('get', function(next) {
        Client.model.find()
            .where('status', 'active')
            .sort('name')
            .exec()
            .then(function(clients) {
                locals.clients = clients;
                next();
            }, function(err) {
                req.flash('error', err);
                next();
            });
    });

    // Render the view
    view.render('select_test');

};