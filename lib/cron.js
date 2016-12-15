'use strict';
var cron = require('node-cron'),
  zohoModule = require('./zoho-module.js'),
  uplusModule = require('./u-plus-module.js'),
  _ = require('underscore-node'),
  clock = require('node-schedule')

  function schedule() {
    var rule = new clock.RecurrenceRule()
    rule.second = 30
    clock.scheduleJob(rule, function(){
      // console.log(new Date(), "Somthing important is going to happen today!");
      synchronize()
    });

  }

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

function synchronize() {
  var inserts = 0
  zohoModule.getContacts(function (crmMatriculados) {
    // console.log(crmMatriculados.length);
    _.each(crmMatriculados, function (student) {
      console.log("STUDENT FROM CRM => " + student['RUT'] + " - " + student['First Name'] + " " + student['Last Name']);
      var addRut = student['RUT'].split('-')[0]
      uplusModule.buscarMatriculadoRut({'ADD_RUT' : addRut}, function (umasStudent) {
        // console.log(umasStudent);
        // If the register doesn't exist, then insert it to umas
        if (!umasStudent) {
          // console.log("************************************************************************************************************ INSERT STUDENT ************************************************************************************************************");
          inserts += 1
          uplusModule.insertarPostulante(insertStudentJson(student), function (res) {
            console.log(JSON.stringify(res));
          })
        }
      })
    })
    // console.log("SE INTENTARON AGREGAR " + inserts + " ESTUDIANTES DE " + crmMatriculados.length);
  })
}

function insertStudentJson(student) {
  return {
    'ADD_RUT' : student['RUT'].split('-')[0],
    'ADD_DIGITOVERIFICADOR' : student['RUT'].split('-')[1],
    'FIRSTNAME' : student['First Name'],
    'LASTNAME' : student['Last Name'].split(' ')[0] || student['Last Name'],
    'ADD_APELLIDOMATERNO' : student['Last Name'].split(' ')[1] || '',
    'ADD_SEXO2' : 'X',
    'ADD_BIRTHDATE' : '01-01-1970',
    'MOBILEPHONE' : student['Phone'],
    'TELEPHONE1' : student['Phone'],
    'ADD_TELEFONODEEMERGENCIA' : '',
    'EMAILADDRESS1' : student['Email'],
    'ADD_DIRECCION' : '',
    'ADD_COMUNA' : '',
    'ADD_CIUDAD' : '',
    'ADD_ESRESPONSABLEFINANCIERO' : '',
    'ADD_COLEGIO' : 0,
    'ADD_CATEGORIA' : '',
    'ADD_ANOEGRESO' : '',
    'ADD_NEM' : 0,
    'ADD_ESTADOCIVIL' : '',
    'ADD_NACIONALIDAD' : '',
    'ADD_CODIGOCARRERA' : '',
    'ADD_JORNADA' : '',
    'ADD_ESTADO' : '',
    'ADD_VIADEINGRESO' : '',
    'ADD_LICENCIADEENSENAZAMEDIA' : '',
    'ADD_COPIADECEULADEIDENTIDAD' : '',
    'ADD_CONCETRACIONDENOTASDEENSENAZA' : '',
    'ADD_SISTEMADESALUD_BUSQUEDA' : 0,
    'ADD_INSTITUCION_BUSQUEDA' : 0,
    'ADD_MOTIVODESELECCION_BUSQUEDA' : 0,
    'ADD_TRAMORENTA' : '',
    'ADD_MEDIOSDESELECCION_BUSQUEDA' : ''
  }
}

module.exports = {
  synchronize : synchronize,
  startCron : startCron,
  stopCron : stopCron,
  destroyCron : destroyCron,
  schedule : schedule
};
