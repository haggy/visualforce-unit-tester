var deferred = require('deferred');
var https = require('https');
var jsdom = require('jsdom');
var parseUrl = require('url');
var request = require('request');
var cookieJar = request.jar();
var SforceService = require('./sforce-service');


// JSDOM config
//jsdom.defaultDocumentFeatures = {
//    FetchExternalResources   : ['script'],
//    ProcessExternalResources : ['script'],
//    MutationEvents           : '2.0'
//};

var SforcePageLoader = module.exports = function(config) {
    config = config || {};

    var _sid = config.sessionId || null;
    var _instanceUrl = config.instanceUrl || null;
    var _env = config.environment || null;
    var _username = config.userName || null;
    var _password = config.password || null;

    this.getSessionId = function() {
        return _sid;
    };

    this.getInstanceUrl = function() {
        return _instanceUrl;
    };

    this.getUserName = function() {
        return _username;
    };

    this.getPassword = function() {
        return _password;
    };

    this.getEnvironment = function() {
        return _env;
    };

    this.setSessionId = function(newSid) {
        if(!newSid) return;
        _sid = newSid;
    };
};

SforcePageLoader.prototype.getWindow = function(pageName) {
    var self = this;
    var def = deferred();
    var uri = this.getInstanceUrl() + '/apex/' + pageName;
console.log(uri);

    var loadWindow = function(htmlBody) {
        self.load(uri)
            .then(function(wind) {
                def.resolve(wind);
            })
            .catch(function(err) {
                console.log(err);
                def.reject(new Error(err));
            });
    };

    this.loginFrontend()
        .then(loadWindow)
        .catch(function(err) {
            console.log(err);
            def.reject(new Error(err));
        });

    return def.promise;
};

SforcePageLoader.prototype.loginFrontend = function() {
    var self = this;
    var url = SforceService.getUrlForEnvironment(self.getEnvironment());
    url += '?un=' + encodeURIComponent(self.getUserName());
    url += '&pw=' + encodeURIComponent(self.getPassword());

    var def = deferred();
    this.load3(url)
        .then(function(body) {
            def.resolve(body);
        })
        .catch(function(err) {
            console.log(err);
            def.reject(new Error(err));
        });

    return def.promise;
};

SforcePageLoader.prototype.load3 = function(url) {
    var self = this;
    var getDefaultHeaders = function() {
        return {
            'User-Agent': 'SforceJSTest'
        };
    };

    var makeRequest = function() {
        var def = deferred();
        var urlParts = parseUrl.parse(url, true);
        var options = {
            uri: url,
            jar: cookieJar,
            headers: getDefaultHeaders(),
            followRedirect: function(response) {
                console.log(response);
                return true;
            }
        };

        request(options, function(err, response, body) {
            if (!err && response.statusCode === 200) {
                def.resolve(body);
            } else {
                console.log('ERROR IN REQUEST: %s', err);
                def.reject(new Error(err));
            }
        });

        return def.promise;
    };

    var retDef = deferred();
    var handleResponse = function(data) {
        retDef.resolve(data);
    };

    var handleError = function(err) {
        console.log(err);
        retDef.reject(new Error(err));
    };

    makeRequest()
        .then(handleResponse, handleError)
        .catch(console.log);

    return retDef.promise;
};

SforcePageLoader.prototype.load = function(url) {
    var self = this;
    var getDefaultCookies = function() {
        return 'sid=' + self.getSessionId();
    };

    var retDef = deferred();
    var handleResponse = function(window) {
        console.log('IN RESPONSE');
        retDef.resolve(window);
    };

    var loadJsdom2 = function(html) {
        var def = deferred();
        var config = {
            html: html,
            document: {
                cookieDomain: 'na15.salesforce.com',
                cookie: getDefaultCookies()
            },
            scripts: [
                'http://code.jquery.com/jquery.js'
            ],
            FetchExternalResources   : ['script'],
            ProcessExternalResources : ['script'],
            done: function(errs, window) {
                if(errs) {
                    console.log("JSDOM ERROR");
                    console.log(errs);
                    def.reject(new Error('JSDOM Error'));
                    return;
                }
                def.resolve(window);
            }
        };
        //console.log(config);

        //jsdom.env(config);
        var doc   = jsdom.jsdom(fs.readFileSync("a.html"), null, {
            features: {
                FetchExternalResources   : ['script'],
                ProcessExternalResources : ['script'],
                MutationEvents           : '2.0',
            }
        });

        var window = doc.createWindow();
        return def.promise;
    };

    var loadJsdom = function(html) {
        var def = deferred();
        var urlParts = parseUrl.parse(url, true);
        var config = {
            url: urlParts.host,
            document: {
                cookieDomain: 'na15.salesforce.com',
                cookie: getDefaultCookies()
            },
            features: {
                FetchExternalResources : ['script', 'img', 'css', 'input', 'link'],
                ProcessExternalResources: ['script'],
                QuerySelector : false
            }
        };

        var doc = jsdom.jsdom(html, {}, null);
        var window = doc.parentWindow.window;
        window.addEventListener('load', function() {
            console.log('LOADED!');
            def.resolve({wind: window, html: html});
        });

        return def.promise;
    };

    this.load3(url)
        .then(loadJsdom)
        .then(handleResponse)
        .catch(console.log);
    return retDef.promise;
};
