'use strict';

var cron = require('node-cron'),
  zohoModule = require('./zoho-module.js'),
  uplusModule = require('./u-plus-module.js'),
  _ = require('underscore-node'),
  clock = require('node-schedule'),
  request = require('request'),
  async = require('async'),
  xmlBuilder = require('xmlbuilder');

function schedule() {
  var rule = new clock.RecurrenceRule()
  rule.hour = 2
  clock.scheduleJob(rule, function(){
    synchronizeCrmToUmas()
  });
}

// RUN THE TAKS!
schedule()

function parseCrmResponse(response) {
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

function synchronizeCrmToUmas() {
  console.log("********************************************************************************************************************");
  console.log("********************************************** CRM TO UMAS SYNC START **********************************************");
  console.log("********************************************************************************************************************");
  var inserts = 0,
    i = 0,
    updates = 0;
  request('https://crm.zoho.com/crm/private/json/Contacts/getRecords?newFormat=1&authtoken=36beb038e36a00d0bf8c22c8befd0c9b&scope=crmapi&fromIndex=1&toIndex=200', function (error, response, body) {
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    if (!error && response.statusCode == 200) {
      var response = JSON.parse(body);
      var studentList = parseCrmResponse(response);
      var timer;
      function callback() { return ''; }
      async.each(studentList, function (student, callback) {
        function setTimer() {
          if (timer) {
            clearTimeout(timer);
          }
          timer = setTimeout(function () {
            console.log("TIMEOUT --");
            callback('TIMEOUT');
          }, 20000);
        }
        // console.log("STUDENT FROM CRM => " + student['RUT'] + " - " + student['First Name'] + " " + student['Last Name']);
        var addRut = student['RUT'].split('-')[0]
        uplusModule.buscarPostulanteRut({'ADD_RUT' : addRut}, function (umasStudent) {
          // If the register doesn't exist, then insert it to umas
          console.log("STUDENT FOUND? =>", umasStudent['FIRSTNAME']);
          // Update the data. Otherwise, insert as new register.
          if (umasStudent) {
            uplusModule.actualizarPostulante(insertStudentJson(student), function (res) {
              updates++;
              setTimer(timer);
              i++;
              if (i >= studentList.length) {
                clearTimeout(timer);
                callback();
              }
            })
          } else {
            uplusModule.insertarPostulante(insertStudentJson(student), function (res) {
              inserts++;
              setTimer(timer);
              // Timer for timeout error
              i++;;
              if (i >= studentList.length) {
                clearTimeout(timer);
                callback();
              }
            })
          }
        })
        // callback();
      }, function (err) {
        console.log("\n***********************************************************************************************************************");
        console.log("********************************************** CRM TO UMAS SYNC FINISHED **********************************************");
        console.log("***********************************************************************************************************************\n");
        console.log("TOTAL INSERTS: ", inserts);
        console.log("TOTAL UPDATES: ", updates);
        if (err) {
          console.error("ERROR", err);
        } else {
          console.log("CRM => UMAS FINISHED");
        }
        if (inserts > 0 || updates > 0) {
          synchronizeUmasToCrm(studentList);
        }
      })

    }
  });
}

function synchronizeUmasToCrm(crmStudents) {
  console.log("\n********************************************************************************************************************");
  console.log("********************************************** UMAS TO CRM SYNC START **********************************************");
  console.log("********************************************************************************************************************\n");
  clearStudentsRut(crmStudents)
  var newCount = 0;
  // console.log(_.pluck(crmStudents, 'RUT'));
  uplusModule.buscarMatriculados(function (students) {
    // In order to use async each, we create this dummy function
    function callback() {return '';}
    async.each(students, function(student, callback) {
      var newStudent = _.findWhere(crmStudents, {'RUT' : student['ADD_RUT']})
      // console.log("NEW STUDENT => ", newStudent);
      if (newStudent) {
        // console.log(newStudent);
        console.log("STUDENT EXIST");
      } else {
        // console.log(student['RUT'] + " - " + student['FIRSTNAME']);
        newCount++;
        updateCrmStudent(student);
      }
      callback()
    }, function (err) {
      console.log("\n***********************************************************************************************************************");
      console.log("********************************************** UMAS TO CRM SYNC FINISHED **********************************************");
      console.log("***********************************************************************************************************************\n");
      console.log("NEW STUDENTS: ", newCount);
    })
  })
}

function clearStudentsRut(list) {
  _.each(list, function (student) {
    student['RUT'] = student['RUT'].replace('.','');
  })
}

function updateCrmStudent(umasStudent) {
  var url = 'https://crm.zoho.com/crm/private/xml/Contacts/insertRecords?authtoken=36beb038e36a00d0bf8c22c8befd0c9b&scope=crmapi&newFormat=1&xmlData=' + buildCrmStudent(umasStudent) + '&duplicateCheck=1'
  request(url, function (error, response, body) {
    // console.log(response);
    console.log(body);
    buildCrmStudent(umasStudent);
  })
}

// Returns a xml version strudent
function buildCrmStudent(student) {
  var xml = xmlBuilder.create({
    'Contacts': {
      'row': {
        '@no': '1',
        'FL': [
          {
            '@val': 'RUT',
            '#text': student['ADD_RUT'] // + '-' + student['ADD_DIGITOVERIFICADOR']
          },
          {
            '@val': 'Email',
            '#text': student['EMAILADRESS1']
          },
          {
            '@val': 'Lead Source',
            '#text': 'UMAS'
          },
          {
            '@val': 'First Name',
            '#text': student['FIRSTNAME']
          },
          {
            '@val': 'Last Name',
            '#text': student['LASTNAME']
          },
          {
            '@val': 'Phone',
            '#text': student['MOBILE_PHONE'] || student['TELEPHONE2'] || ''
          },
          {
            '@val': 'Created By',
            '#text': 'UMAS'
          }
        ]
      }
    }
  });
  console.log(xml.end({ pretty: true }).replace('<?xml version="1.0"?>',''));
  return xml.end({ pretty: true }).replace('<?xml version="1.0"?>','')
  // var xml =
  // "<Leads>
  //  <row no='1'>
  //    <FL val='Lead Source'>Web Download</FL>
  //    <FL val='Company'>Your Company</FL>
  //    <FL val='First Name'>Hannah</FL>
  //    <FL val='Last Name'>Smith</FL>
  //    <FL val='Email'>student['EMAILADRESS1']</FL>
  //    <FL val='Title'>Manager</FL>
  //    <FL val='Phone'>1234567890</FL>
  //    <FL val='Home Phone'>0987654321</FL>
  //    <FL val='Other Phone'>1212211212</FL>
  //    <FL val='Fax'>02927272626</FL>
  //    <FL val='Mobile'>292827622</FL>
  //   </row>
  // </Leads>"


  // { CONTACTID: '1990525000001926173',
  //   SMOWNERID: '1990525000000495001',
  //   'Contact Owner': 'Joselyn Osses Rupallán',
  //   'Lead Source': 'Página web',
  //   'First Name': 'yohanna',
  //   'Last Name': 'Gallardo Quintero',
  //   Email: 'yohannabelitza2@gmail.com',
  //   Phone: '982173984',
  //   SMCREATORID: '1990525000000495001',
  //   'Created By': 'Joselyn Osses Rupallán',
  //   MODIFIEDBY: '1990525000000495001',
  //   'Modified By': 'Joselyn Osses Rupallán',
  //   'Created Time': '2016-12-09 13:49:45',
  //   'Modified Time': '2016-12-09 13:49:45',
  //   'Email Opt Out': 'false',
  //   'Last Activity Time': '2016-12-09 13:49:45',
  //   Carreras: 'TÉCNICO DE NIVEL SUPERIOR EN ESTÉTICA INTEGRAL',
  //   'Estado de consulta': 'Matriculado en IPG',
  //   Sedes: 'Providencia',
  //   RUT: '24973607-4',
  //   GCLID: 'CM_Rz8jh29ACFYSBkQodnH8M2Q',
  //   'Cost per Click': '0',
  //   'Cost per Conversion': '0',
  //   'Conversion Export Status': 'Not started' }

  // STATUSCODE: 'EGRESADO',
  // FIRSTNAME: 'GERMANIA GEMA',
  // LASTNAME: 'ANDREOTTI',
  // ADD_APELLIDOMATERNO: 'POZO',
  // GENDERCODE: 'F',
  // BIRTHDATE: '24-04-1969',
  // MOBILE_PHONE: '68649024',
  // TELEPHONE2: '95504807',
  // EMAILADRESS1: 'pozogermania@gmail.com',
  // ADD_DIRECCION: 'LA LECHERIA 2080 DEPTO 43',
  // ADD_SECTOR: {},
  // ADD_COMUNA: 'MAIPU',
  // ADD_CIUDAD: 'SANTIAGO',
  // ADD_COLEGIO: '8505',
  // ADD_CARRERA: 'PR04003',
  // FAMILYSTATUSCODE: 'CASADO',
  // ADD_NACIONALIDAD: 'Chilena',
  // ADD_PROCESODEADMISION: {},
  // ADD_FECHAMATRICULADA: '20/11/2015',
  // ADD_PROCESOADMISION: '2015-1',
  // ADD_NEM_DECIMAL: '0',
  // ADD_ANOEGRESO: '1988',
  // ADD_PSULENGUAJE: '0',
  // ADD_PSUMATEMATICA: '0',
  // ADD_CIENCIAS: '0',
  // ADD_HISTORIA: '0',
  // ADD_PUNTAJERANKING: '0',
  // ADD_RUT: '11477162'

}

function insertStudentJson(student) {
  return {
    'ADD_RUT' : student['RUT'].replace('.', '').split('-')[0],
    'ADD_DIGITOVERIFICADOR' : student['RUT'].replace('.', '').split('-')[1],
    'FIRSTNAME' : student['First Name'],
    'LASTNAME' : student['Last Name'].split(' ')[0] || student['Last Name'],
    'ADD_APELLIDOMATERNO' : student['Last Name'].split(' ')[1] || '',
    'ADD_SEXO2' : 'M', // NO VIENE DE ZOHO
    'ADD_BIRTHDATE' : '01-01-1970', // NO VIENE DE ZOHO
    'MOBILEPHONE' : student['Phone'] || '999999999',
    'TELEPHONE1' : student['Phone'] || '999999999',
    'ADD_TELEFONODEEMERGENCIA' : '999999999', // NO VIENE DE ZOHO
    'EMAILADDRESS1' : student['Email'] || 'ipf@zoho.com',
    'ADD_DIRECCION' : 'SIN DATO', // NO VIENE DE ZOHO
    'ADD_COMUNA' : 'santiago', // NO VIENE DE ZOHO
    'ADD_CIUDAD' : 'santiago', // NO VIENE DE ZOHO
    'ADD_ESRESPONSABLEFINANCIERO' : 'SI', // NO VIENE DE ZOHO
    'ADD_COLEGIO' : 1, // NO VIENE DE ZOHO
    'ADD_CATEGORIA' : '1', // NO VIENE DE ZOHO
    'ADD_ANOEGRESO' : '2000', // NO VIENE DE ZOHO
    'ADD_NEM' : 1, // NO VIENE DE ZOHO
    'ADD_ESTADOCIVIL' : 'soltero', // NO VIENE DE ZOHO
    'ADD_NACIONALIDAD' : '1', // NO VIENE DE ZOHO
    'ADD_CODIGOCARRERA' : 'PR01001', // NO VIENE DE ZOHO
    'ADD_JORNADA' : 'D', // NO VIENE DE ZOHO
    'ADD_ESTADO' : 'vigente', // PENDING
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
  synchronizeCrmToUmas : synchronizeCrmToUmas,
  synchronizeUmasToCrm : synchronizeUmasToCrm,
  schedule : schedule
};
