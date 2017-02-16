'use strict';
var Zoho = require('node-zoho');
var zoho = new Zoho({authToken:'36beb038e36a00d0bf8c22c8befd0c9b'});
var request = require('request');
var _ = require('underscore-node');

function parseResponse(response) {
  var studentList = [];
  var list = response['response']['result']['Contacts']['row'];
  _.each(list, function (item) {
    console.log(item['FL']);
    var student = {};
    _.each(item['FL'], function (attr) {
      student[attr.val] = attr.content;
      console.log(student);
    })
    studentList.push(student);
  })
  return studentList;
}

function getLeads(callback) {
  zoho.execute('crm', 'Leads', 'getRecords',  {'fromIndex': '1', 'toIndex': '200'},function (err, result) {
    if (err !== null) {
      console.log(err);
    } else if (result.isError()) {
      console.log(result.message);
    } else {
      callback(result.data)
    }
  });
}

function getContacts(callback) {
  zoho.execute('crm', 'Contacts', 'getRecords', {}, function (err, result) {
    if (err !== null) {
      console.log(err);
    } else if (result.isError()) {
      console.log(result.message);
    } else {

      console.log("CANTIDAD DE REGISTROS CRM => ", result.data.length);
      callback(result.data)
    }
  });
}

module.exports = {
  getLeads : getLeads,
  getContacts : getContacts
};
