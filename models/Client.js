var keystone = require('keystone'),
    Types = keystone.Field.Types;

/**
 * Client Model
 * Contains information about a specific Salesforce client
 * ==========
 */

var Client = new keystone.List('Client');

Client.add({
    name: { type: String, required: true },
    login_username: { type: Types.Email, required: true, initial: true, label: 'Username' },
    login_password: {type: Types.Text, required: true, initial: true, label: 'Password' },
    login_password_token: {type: Types.Text, required: false, initial: true, label: 'Password Token' },
    org_type: { type: Types.Select, options: 'production, sandbox, developer', default: 'sandbox', initial: true, required: true },
    status: { type: Types.Select, options: 'active, inactive', default: 'Active', initial: true, required: true },
    createdBy: { type: Types.Relationship, ref: 'User' },
    createdDate: { type: Date, default: Date.now }
});

Client.defaultColumns = 'name, status';

Client.register();