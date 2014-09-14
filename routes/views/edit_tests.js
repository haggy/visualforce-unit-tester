var keystone = require('keystone');
var Client = keystone.list('Client');

exports = module.exports = function(req, res) {
    var resp = {success: true};
    var view = new keystone.View(req, res);
    var locals = res.locals;

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
    view.render('edit_tests');
};
