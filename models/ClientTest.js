var keystone = require('keystone'),
    Types = keystone.Field.Types;

/**
 * ClientTest Model
 * Contains information about a specific Salesforce client test
 * ==========
 */

var ClientTest = new keystone.List('ClientTest');

ClientTest.add({
    name: { type: String, required: true },
    status: { type: Types.Select, options: 'Active, Inactive', default: 'Active', initial: true, required: true },
    source: {type: Types.Textarea},
    client: { type: Types.Relationship, ref: 'Client', required: true, initial: true },
    testType: {
        type: Types.Select,
        options: 'Static Resource, VF Page',
        default: 'Static Resource',
        required: true,
        initial: true,
        label: 'Test Type'
    },
    createdBy: { type: Types.Relationship, ref: 'User' },
    createdDate: { type: Date, default: Date.now }
});

ClientTest.defaultColumns = 'name, status, client, testType';

ClientTest.register();
