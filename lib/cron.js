'use strict';
var cron = require('node-cron'),
  zohoModule = require('./zoho-module.js'),
  uplusModule = require('./u-plus-module.js'),
  _ = require('underscore-node'),
  clock = require('node-schedule'),
  request = require('request');

function schedule() {
  var rule = new clock.RecurrenceRule()
  rule.second = 30
  clock.scheduleJob(rule, function(){
    synchronize()
  });
}
schedule()

function startCron() {
  if (cronTask) {
    console.log("A task is already running. Stop and Desroy first.");
  } else {
    console.log("STARTING?");
    var cronTask = cron.schedule('0 0 * * * *', synchronize(), false);
  }
}

function stopCron() {
  if (cronTask) {
    cronTask.stop()
    console.log("Stoped...");
  } else {
    console.log("Nothing to Stop.");
  }
}

function destroyCron() {
  if (cronTask) {
    cronTask.destroy()
    console.log("Destroyed...");
  } else {
    console.log("Nothing to be Destroyed.");
  }
}

function parseResponse(response) {
  var studentList = [];
  var list = response['response']['result']['Contacts']['row'];
  _.each(list, function (item) {
    var student = {};
    _.each(item['FL'], function (attr) {
      student[attr.val] = attr.content;
    })
    studentList.push(student);
  })
  return studentList;
}

function synchronize() {
  var inserts = 0
  request('https://crm.zoho.com/crm/private/json/Contacts/getRecords?newFormat=1&authtoken=36beb038e36a00d0bf8c22c8befd0c9b&scope=crmapi&fromIndex=1&toIndex=200', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var response = JSON.parse(body)
      var studentList = parseResponse(response)
      _.each(studentList, function (student) {
        // console.log("STUDENT FROM CRM => " + student['RUT'] + " - " + student['First Name'] + " " + student['Last Name']);
        var addRut = student['RUT'].split('-')[0]
        uplusModule.buscarMatriculadoRut({'ADD_RUT' : addRut}, function (umasStudent) {
          // If the register doesn't exist, then insert it to umas
          console.log("STUDENT FOUND? =>", umasStudent);
          // Update the data. Otherwise, insert as new register.
          if (umasStudent) {
            uplusModule.actualizarPostulante(insertStudentJson(student), function (res) {
              console.log('************************************************************ UPDATE ************************************************************');
              console.log(JSON.stringify(res));
            })
          } else {
            inserts += 1
            uplusModule.insertarPostulante(insertStudentJson(student), function (res) {
              console.log('************************************************************ INSERT ************************************************************');
              console.log(JSON.stringify(res));
            })
          }
        })
      })

    }
  });
}

function insertStudentJson(student) {
  return {
    'ADD_RUT' : student['RUT'].split('-')[0],
    'ADD_DIGITOVERIFICADOR' : student['RUT'].split('-')[1],
    'FIRSTNAME' : student['First Name'],
    'LASTNAME' : student['Last Name'].split(' ')[0] || student['Last Name'],
    'ADD_APELLIDOMATERNO' : student['Last Name'].split(' ')[1] || '',
    'ADD_SEXO2' : 'M', // NO VIENE DE ZOHO
    'ADD_BIRTHDATE' : '01-01-1970', // NO VIENE DE ZOHO
    'MOBILEPHONE' : student['Phone'],
    'TELEPHONE1' : student['Phone'],
    'ADD_TELEFONODEEMERGENCIA' : '', // NO VIENE DE ZOHO
    'EMAILADDRESS1' : student['Email'],
    'ADD_DIRECCION' : 'SIN DATO', // NO VIENE DE ZOHO
    'ADD_COMUNA' : 'santiago', // NO VIENE DE ZOHO
    'ADD_CIUDAD' : 'santiago', // NO VIENE DE ZOHO
    'ADD_ESRESPONSABLEFINANCIERO' : 'si', // NO VIENE DE ZOHO
    'ADD_COLEGIO' : 1, // NO VIENE DE ZOHO
    'ADD_CATEGORIA' : '1', // NO VIENE DE ZOHO
    'ADD_ANOEGRESO' : '2000', // NO VIENE DE ZOHO
    'ADD_NEM' : 1, // NO VIENE DE ZOHO
    'ADD_ESTADOCIVIL' : 'soltero', // NO VIENE DE ZOHO
    'ADD_NACIONALIDAD' : 'chilena', // NO VIENE DE ZOHO
    'ADD_CODIGOCARRERA' : 'PR01001', // NO VIENE DE ZOHO
    'ADD_JORNADA' : 'D', // NO VIENE DE ZOHO
    'ADD_ESTADO' : '', // PENDING
    'ADD_VIADEINGRESO' : '1', // NO VIENE DE ZOHO
    'ADD_LICENCIADEENSENAZAMEDIA' : 'no', // NO VIENE DE ZOHO
    'ADD_COPIADECEULADEIDENTIDAD' : 'no', // NO VIENE DE ZOHO
    'ADD_CONCETRACIONDENOTASDEENSENAZA' : 'no', // NO VIENE DE ZOHO
    'ADD_SISTEMADESALUD_BUSQUEDA' : 0, // NO VIENE DE ZOHO
    'ADD_INSTITUCION_BUSQUEDA' : 1, // NO VIENE DE ZOHO
    'ADD_MOTIVODESELECCION_BUSQUEDA' : 1, // NO VIENE DE ZOHO
    'ADD_TRAMORENTA' : '1', // NO VIENE DE ZOHO
    'ADD_MEDIOSDESELECCION_BUSQUEDA' : '11' // NO VIENE DE ZOHO
  }
}

module.exports = {
  synchronize : synchronize,
  startCron : startCron,
  stopCron : stopCron,
  destroyCron : destroyCron,
  schedule : schedule
};
