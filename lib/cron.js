'use strict';
var cron = require('node-cron'),
  zohoModule = require('./zoho-module.js'),
  uplusModule = require('./u-plus-module.js'),
  _ = require('underscore-node')

// zohoModule.getLeads()
cron.schedule('0 0 * * * *', function(){
  console.log('running a task hour');
  sycnhronize()
});

function sycnhronize() {
  var uplusMatruculados = uplusModule.buscarMatriculados(),
    crmMatriculados = zohoModule.getContacts()

  // Now we have both sides students, lets see if is necessary to add a new one in U+
  _.each(crmMatriculados, function (student) {
    uplusModule.buscarMatriculadoRut(student.rut, function (res) {
      // it doesn't exist
      if (!res) {

      }
    })
  })

}
