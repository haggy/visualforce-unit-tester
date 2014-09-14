var keystone = require('keystone');
var ClientTest = keystone.list('ClientTest');

var getDefaultTestBody = function() {
    return  "describe('New test suite', function() {\n"  +
        "    before(function(done) {\n" +
        "        // Place any initialization code here\n" +
        "        done();\n" +
        "    });\n\n" +
        "    it('Describes your unit test', function(done) {\n" +
        "        // Good async testers always call done!\n" +
        "        done();\n" +
        "    });\n\n" +
        "    after(function(done) {\n" +
        "        // Place any cleanup code here\n" +
        "        done();\n" +
        "    });\n" +
        "});";
};

function Handler() {}

Handler.get = function(req, res) {
    var response = {success: true};
    var selectFields = '_id name client';

    if(req.params.id === 'all') {
        // Retrieve all
        ClientTest.model.find()
            .select(selectFields)
            .where('status', 'Active')
            .sort('name')
            .exec()
            .then(function(tests) {
                response.tests = tests;
                return res.apiResponse(response);
            }, function(err) {
                response.success = false;
                response.error = err;
                return res.apiResponse(response);
            });
    } else if(req.params.id) {
        selectFields = req.params.select || selectFields;
        // Find by test ID
        ClientTest.model.findById(req.params.id)
            .select(selectFields)
            .where('status', 'Active')
            .sort('name')
            .exec()
            .then(function(test) {
                response.test = test;
                return res.apiResponse(response);
            }, function(err) {
                response.success = false;
                response.error = err;
                return res.apiResponse(response);
            });
    } else if(req.params.client_id) {
        // Find by client ID
        ClientTest.model.find()
            .where('client', req.params.client_id)
            .where('status', 'Active')
            .sort('name')
            .select(selectFields)
            .exec()
            .then(function(tests) {
                response.tests = tests;
                return res.apiResponse(response);
            }, function(err) {
                response.success = false;
                response.error = err;
                return res.apiResponse(response);
            });
    } else {
        response.success = false;
        response.error = 'Invalid request';
        return res.apiResponse(response);
    }
};

Handler.create = function(req, res) {
    var response = {success: true};

    if(!req.body.test_name || !req.body.client_id) {
        response.success = false;
        response.error = 'Invalid request';
        return res.apiResponse(response);
    }

    var newTest = new ClientTest.model({
        name: req.body.test_name,
        client: req.body.client_id,
        source: getDefaultTestBody(),
        testType: req.body.test_type || 'Static Resource'
    });
    newTest.save(function(err) {
        if(err) {
            response.success = false;
            response.error = err;
            return res.apiResponse(response);
        }

        response.test = {
            _id: newTest._id,
            client: newTest.client,
            source: newTest.source
        };
        return res.apiResponse(response);
    });

};

Handler.update = function(req, res) {
    var response = {success: true};

    if(req.body.test_id && req.body.test_source) {
        // Test update
        var query = { _id: req.body.test_id };
        var update = { source: req.body.test_source };
        ClientTest.model.findOneAndUpdate(query, update)
            .exec()
            .then(function() {
                return res.apiResponse(response);
            }, function(err) {
                response.success = false;
                response.error = err;
                return res.apiResponse(response);
            });

    } else {
        response.success = false;
        response.error = 'Invalid request';
        return res.apiResponse(response);
    }
};

module.exports = Handler;





















