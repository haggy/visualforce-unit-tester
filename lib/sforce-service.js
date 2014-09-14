var sf = require('node-salesforce');
var deferred = require('deferred');

var envToUrlMap = {
    production: 'https://login.salesforce.com',
    developer: 'https://login.salesforce.com',
    sandbox: 'https://test.salesforce.com'
};

var SforceService = module.exports = function(config) {
    config = config || {};
    this.token = config.accessToken || null;
    this.instanceUrl = config.instanceUrl || null;
    this.userId = null;
    this.orgId = null;

};

SforceService.getUrlForEnvironment = function(env) {
    return envToUrlMap[env];
};

SforceService.prototype.isLoggedIn = function() {
    return (this.token && this.instanceUrl);
};

SforceService.prototype.getConnection = function() {
    if(!this.isLoggedIn()) {
        return null;
    }

    return new sf.Connection({
        accessToken: this.token,
        instanceUrl: this.instanceUrl
    });
};

SforceService.prototype.login = function(uname, pass, env) {
    var self = this;
    var conn = new sf.Connection({
        loginUrl : envToUrlMap[env]
    });

    var def = deferred();
    conn.login(uname, pass, function(err, userInfo) {
        if (err) {
            console.error(err);
            def.reject(new Error(err));
        }

        self.token = conn.accessToken;
        self.instanceUrl = conn.instanceUrl;
        self.userId = userInfo.id;
        self.orgId = userInfo.organizationId;

        def.resolve({
            accessToken: self.token,
            instanceUrl: self.instanceUrl,
            userId: self.userId,
            orgId: self.orgId
        });
    });

    return def.promise;
};

SforceService.prototype.fetchVfPages = function() {
    var self = this;
    var def = deferred();

    var fetchPages = function(connection) {
        connection.query(
            "SELECT Id, Name FROM ApexPage where NamespacePrefix = NULL order by Name", function(err, result) {
            if (err) {
                def.reject(new Error(err));
                return;
            }
            console.log("total : " + result.totalSize);
            console.log("fetched : " + result.records.length);
            def.resolve(result.records);
        });
    };

    var conn = self.getConnection();
    if(!conn) {
        throw new Error('You must be logged in to perform this operation!');
    }

    fetchPages(conn);
    return def.promise;
};

SforceService.prototype.fetchStaticResources = function() {
    var self = this;
    var def = deferred();

    var fetchResources = function(connection) {
        var query = "select Id, ContentType, Body, Name" +
                    " from StaticResource" +
                    " where ContentType IN ('application/x-javascript', 'text/javascript')" +
                    " and NamespacePrefix = NULL" +
                    " order by Name";

        connection.query(query, function(err, result) {
                if (err) {
                    def.reject(new Error(err));
                    return;
                }
                console.log("total : " + result.totalSize);
                console.log("fetched : " + result.records.length);

                // Add stringifyed version to each record
                result.records.forEach(function(rec, idx) {
                    rec.json = JSON.stringify(rec);
                });
                def.resolve(result.records);
            });
    };

    var conn = self.getConnection();
    if(!conn) {
        throw new Error('You must be logged in to perform this operation!');
    }

    fetchResources(conn);
    return def.promise;
};

SforceService.prototype.findResourceByName = function(name) {
    var conn = this.getConnection();
    if(!conn) {
        throw new Error('You must be logged in to perform this operation!');
    }

    var def = deferred();

    var query = "select Id, Name" +
                " from StaticResource" +
                " where Name = '" + name + "'" +
                " limit 1";
    conn.query(query, function(err, response) {
        if (err) {
            def.reject(new Error(err));
            return;
        } else if(response.records.length === 0) {
            def.reject(new Error('No resources found with name "' + name + '"'));
            return;
        }

        def.resolve(response.records[0]);
    });

    return def.promise;
};

SforceService.prototype.getResourceContent = function(res) {
    var conn = this.getConnection();
    if(!conn) {
        throw new Error('You must be logged in to perform this operation!');
    }

    var def = deferred();

    conn.sobject("StaticResource").retrieve(res.Id + '/Body', function(err, resource) {
        if (err) {
            console.error(err);
            def.reject(err);
        }
        def.resolve(resource);
    });

    return def.promise;
};

SforceService.prototype.getOrgInfo = function(orgId) {
    var conn = this.getConnection();
    if(!conn) {
        throw new Error('You must be logged in to perform this operation!');
    }

    var def = deferred();

    conn.sobject("Organization").retrieve(orgId, function(err, org) {
        if (err) {
            console.error(err);
            def.reject(err);
        }
        def.resolve(org);
    });

    return def.promise;
};

SforceService.prototype.getUserInfo = function(userId) {
    var conn = this.getConnection();
    if(!conn) {
        throw new Error('You must be logged in to perform this operation!');
    }

    var def = deferred();

    conn.sobject("User").retrieve(userId, function(err, user) {
        if (err) {
            console.error(err);
            def.reject(err);
        }
        def.resolve(user);
    });

    return def.promise;
};

















