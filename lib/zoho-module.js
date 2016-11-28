'use strict';
var Zoho = require('node-zoho');
var zoho = new Zoho({authToken:'36beb038e36a00d0bf8c22c8befd0c9b'});

function getLeads(callback) {
  zoho.execute('crm', 'Leads', 'getRecords', {},function (err, result) {
    if (err !== null) {
      console.log(err);
    } else if (result.isError()) {
      console.log(result.message);
    } else {
      console.log(result.data);
      callback(result.data)
    }
  });
}

function getContacts(callback) {
  zoho.execute('crm', 'Contacts', 'getRecords', {},function (err, result) {
    if (err !== null) {
      console.log(err);
    } else if (result.isError()) {
      console.log(result.message);
    } else {
      console.log(result.data);
      callback(result.data)
    }
  });
}

module.exports = {
  getLeads : getLeads,
  getContacts : getContacts
};
