var keystone = require('keystone');
var Client = keystone.list('Client');
var ClientTest = keystone.list('ClientTest');
var deferred = require('deferred');
var SforceService = require('../../lib/sforce-service');
var SforcePageLoader = require('../../lib/sforce-page-loader');

exports = module.exports = function(req, res) {
    var resp = {success: true};
    var loginResult = null;
    var client = null;

    if(!req.body.page_name && !req.body.test_data) {
        resp.success = false;
        resp.error = 'Please select a test';
        return res.apiResponse(resp);
    }

    var login = function(clientId) {
        var def = deferred();

        Client.model.findById(clientId)
            .exec()
            .then(function(cli) {
                client = cli;
                console.log(client);
                var uname = client.login_username;
                var pass = client.login_password;
                if(client.login_password_token) {
                    pass += client.login_password_token;
                }
                var env = client.org_type;
                console.log('USING PASS: %s', pass);
                var service = new SforceService();
                service.login(uname, pass, env)
                    .then(function(loginRes) {
                        def.resolve(loginRes);
                    })
            }, function(err) {
                console.log(err);
                def.reject(err);
            });

        return def.promise;
    };

    var loadPage = function() {
        var pass = client.login_password +
                    (client.login_password_token ? client.login_password_token : '');
        var sfLoader = new SforcePageLoader({
            instanceUrl: loginResult.instanceUrl,
            accessToken: loginResult.accessToken,
            userName: client.login_username,
            password: pass,
            environment: client.org_type
        });

        sfLoader.getWindow(resp.test.name)
            .then(function(windowRes) {
                resp.sfHtml = windowRes.html;
                return res.apiResponse(resp);
            }, function(err) {
                resp.success = false;
                resp.error = err;
                return res.apiResponse(resp);
            });
    };


    if(req.body.test_data) {
        var testObj = JSON.parse(req.body.test_data);


        login(testObj.client)
            // After login, get client test
            .then(function(loginRes) {
                loginResult = loginRes;
                console.log(loginRes);
                return ClientTest.model.findById(testObj._id).exec()
            })
            .then(function(test) {
                resp.test = test;
            }, function(err) {
                console.log(err);
            })
            // Get resource data
            .then(function getResourceOrPage() {
                var sfService = new SforceService({
                    instanceUrl: loginResult.instanceUrl,
                    accessToken: loginResult.accessToken
                });

                if(resp.test.testType === 'VF Page') {
                    return loadPage();
                }

                var getResource = function(resource) {
                    return sfService.getResourceContent(resource);
                };

                var setResourceData = function(body) {
                    resp.resource = {
                        body: body
                    };
                };

                var sendResponse = function() {
                    res.apiResponse(resp);
                };

                sfService.findResourceByName(resp.test.name)
                    .then(getResource)
                    .then(setResourceData)
                    .then(sendResponse);
            })
            .catch(function(err) {
                console.log(err);
                resp.success = false;
                resp.error = err;
                res.apiResponse(resp);
            });

    }
};
