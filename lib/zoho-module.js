'use strict';
var Zoho = require('node-zoho');
var zoho = new Zoho({authToken:'36beb038e36a00d0bf8c22c8befd0c9b'});
var request = require('request');
var _ = require('underscore-node');
// var https = require('https');

function testHttps() {
  request('https://crm.zoho.com/crm/private/json/Contacts/getRecords?newFormat=1&authtoken=36beb038e36a00d0bf8c22c8befd0c9b&scope=crmapi&fromIndex=1&toIndex=200', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var response = JSON.parse(body)
      parseResponse(response)
    }
  });
}

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

  // var options = {
  //   host: 'crm.zoho.com',
  //   port: 443,
  //   path: '/crm/private/json/Contacts/getRecords?newFormat=1&authtoken=36beb038e36a00d0bf8c22c8befd0c9b&scope=crmapi&fromIndex=1&toIndex=200',
  //   method: 'GET'
  // };
  //
  // var req = https.request(options, function(res) {
  //   // console.log('STATUS: ' + res.statusCode);
  //   console.log('HEADERS: ' + JSON.stringify(res.headers));
  //   res.setEncoding('utf8');
  //   res.on('data', function (chunk) {
  //     console.log('BODY: ' + chunk);
  //     // console.log('BODY: ' + chunk['response']);
  //   });
  // });
  //
  // req.on('error', function(e) {
  //   console.log('problem with request: ' + e.message);
  // });
  //
  // // write data to request body
  // req.write('data\n');
  // req.write('data\n');
  // req.end();

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
  getContacts : getContacts,
  testHttps: testHttps
};
