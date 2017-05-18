'use strict';
require('dotenv/config')
var API_KEY = process.env.ZOHO_API_TOKEN
console.log(API_KEY);
var zohoModule = require('./zoho-module.js'),
  uplusModule = require('./u-plus-module.js'),
  xls = require('./xls_reader.js'),
  _ = require('underscore-node'),
  request = require('request'),
  xmlBuilder = require('xmlbuilder'),

  INDEXES = [
    'fromIndex=1&toIndex=200',
    'fromIndex=201&toIndex=400',
    'fromIndex=401&toIndex=600',
    'fromIndex=601&toIndex=800',
    'fromIndex=801&toIndex=1000'
  ];

// Convert to json the Zoho API response.
function parseCrmResponse(list) {
  var studentList = [];
  var elements = list['response']['result']['Contacts']['row'];
  _.each(elements, function (item) {
    var student = {};
    _.each(item['FL'], function (attr) {
      student[attr.val] = attr.content;
    })
    studentList.push(student);
  })
  return studentList;
}

// Sync UMAS students to Zoho CRM.
// This method is the the that the schedule use. After UMAS -> Zoho sync is over, it triggers the sync in inverse way.
function synchronizeCrmToUmas(index, crmStudentsList) {
  console.log("********************************************************************************************************************");
  console.log("********************************************** CRM TO UMAS SYNC START **********************************************");
  console.log("********************************************************************************************************************");
  index = index || 0;
  console.log("STATING IN INDEX: ", index);
  var inserts = 0, i = 0, updates = 0;

  request('https://crm.zoho.com/crm/private/json/Contacts/getRecords?newFormat=1&authtoken='+ API_KEY + '&scope=crmapi&' + INDEXES[index] + '&selectColumns=All', function (error, response, body) {
    var list = JSON.parse(body);
    console.log('STATUS CODE: ', response.statusCode);
    if (error) {
      console.log("ERROR");
      console.log(error);
    }
    if (!error && response.statusCode === 200 && list['response']['result']) {
      if (!crmStudentsList) {
        crmStudentsList = parseCrmResponse(list);
      } else {
        crmStudentsList = _.union(crmStudentsList, parseCrmResponse(list));
      }
      console.log("crmStudentsList LENGTH: ", crmStudentsList.length);
      return synchronizeCrmToUmas(index + 1, crmStudentsList);
    } else {
      console.log("crmStudentsList LENGTH: ", crmStudentsList.length);
      var timer;
      var i = 0;
      var updateList = [];
      var insertList = [];
      var busy = false;
      var interval;
      interval = setInterval(function () {
        if (!busy) {
          var student = crmStudentsList[i];
            if (student) {
            var addRut = student['RUT'].split('.').join('').split('-')[0];
            busy = true;
            uplusModule.buscarPostulanteRut({'ADD_RUT' : addRut}, function (umasStudent) {
              // If the register doesn't exist, then insert it to umas
              if (!umasStudent) {
                busy = false;
                i++;
                return insertList.push(student);
              }
              // Update the data. Otherwise, insert as new register.
              if (umasStudent) {
                busy = false;
                i++;
                return updateList.push(student);

              }
            })
          } else {
            console.log("TO UPDATE: ", updateList.length);
            console.log("TO INSERT: ", insertList.length);
            console.log("\n\n\n");
            clearInterval(interval);
            i = 0;
            interval = setInterval(function () {
              var student = updateList[i];
              if (student) {
                uplusModule.actualizarPostulante(insertStudentJson(student), function (res) {
                  // console.log("UPDATED!");
                });
                i++;
              } else {
                clearInterval(interval);
                i = 0;
                interval = setInterval(function () {
                  var student = insertList[i];
                  if (student) {
                    uplusModule.insertarPostulante(insertStudentJson(student), function (res) {
                      // console.log("INSERTED!");
                    })
                    i++;
                  } else {
                      console.log("\n\n***********************************************************************************************************************");
                      console.log("********************************************** CRM TO UMAS SYNC FINISHED **********************************************");
                      console.log("***********************************************************************************************************************\n\n");
                      synchronizeUmasToCrm(crmStudentsList);
                      clearInterval(interval);
                  }
                }, 300);
              }
            }, 300);
          }
        }
      }, 100);
    }
  });
}

function synchronizeUmasToCrm(crmStudents) {
  console.log("\n\n********************************************************************************************************************");
  console.log("********************************************** UMAS TO CRM SYNC START **********************************************");
  console.log("********************************************************************************************************************\n\n");
  console.log("CRM STUDENTS COUNT: ", crmStudents.length);
  clearStudentsRut(crmStudents)
  var updatedCount = 0, newCount = 0, i = 0, interval;
  uplusModule.buscarMatriculados(function (students) {
    // In order to use async each, we create this dummy function
    console.log("UMAS STUDENTS COUNT: ", students.length);
    interval = setInterval(function () {
      var student = students[i];
      if (student) {
        var crmStudent = _.findWhere(crmStudents, {'RUT' : student['ADD_RUT']});
        if (crmStudent) {
          var crmStudentId = crmStudent['CONTACTID'];
          // The studen exist in umas, then we update the record in crm.
          updateCrmStudent(student, crmStudent, crmStudentId);
          updatedCount++;
          i++;
        } else {
          // The student doesn't exist in umas, so we create a new record.
          insertCrmStudent(student);
          newCount++;
          i++;
        }
      } else {
        console.log("\n***********************************************************************************************************************");
        console.log("********************************************** UMAS TO CRM SYNC FINISHED **********************************************");
        console.log("***********************************************************************************************************************\n");
        console.log("UPDATED STUDENTS: ", updatedCount);
        console.log("NEW STUDENTS: ", newCount);
        clearInterval(interval);
      }
    }, 200);
  })
}

function clearStudentsRut(list) {
  _.each(list, function (student) {
    student['RUT'] = student['RUT'].split('-')[0].split('.').join('');
  })
}

function insertCrmStudent(umasStudent) {
  var url = 'https://crm.zoho.com/crm/private/xml/Contacts/insertRecords?authtoken='+ API_KEY + '&scope=crmapi&newFormat=1&xmlData=' + buildCrmInsertStudent(umasStudent) + '&duplicateCheck=1';
  request(url, function (error, response, body) {
    // if (body.includes('Record(s) already exists')) {
    //   console.log("RECORD ALREADY EXISTS!");
    // }
  })
}

function updateCrmStudent(umasStudent, crmStudent, id) {
  // console.log("UMAS STUDENT => ", umasStudent);
  var url = 'https://crm.zoho.com/crm/private/xml/Contacts/updateRecords?authtoken='+ API_KEY + '&scope=crmapi&newFormat=1&xmlData=' + buildCrmUpdateStudent(umasStudent, crmStudent) + '&id=' + id;
  request(url, function (error, response, body) {
    // console.log(body);
  })
}

// Returns a xml version strudent for insert
function buildCrmInsertStudent(student) {
  var colegio, carrera;
  colegio = xls.getColegioByCode(student['ADD_COLEGIO']);
  carrera = xls.getCarreraByCode(student['ADD_CARRERA']);
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
          },
          {
            '@val': 'Colegio',
            '#text': colegio
          },
          {
            '@val': 'Carreras',
            '#text': carrera
          },
        ]
      }
    }
  });
  // console.log(xml.end({ pretty: true }).replace('<?xml version="1.0"?>',''));
  return xml.end({ pretty: true }).replace('<?xml version="1.0"?>','')

}

// Returns a xml version strudent for update
function buildCrmUpdateStudent(umasStudent, crmStudent) {
  var colegio, carrera;
  function getColegio() {
    return xls.getColegioByCode(umasStudent['ADD_COLEGIO']);

  }
  function getCarrera() {
    return xls.getCarreraByCode(umasStudent['ADD_CARRERA']);
  }
  var buildObject = {
    'Contacts': {
      'row': {
        '@no': '1',
        'FL': [
          { '@val': 'Colegio',
            '#text': getColegio()
          },
          { '@val': 'Carreras',
            '#text': getCarrera()
          }
        ]
      }
    }
  }
  if (crmStudent['Email']) {
    buildObject['Contacts']['row']['FL'].push({'@val': 'Email','#text': crmStudent['Email']})
  }
  var xml = xmlBuilder.create(buildObject);
  return xml.end({ pretty: true }).replace('<?xml version="1.0"?>','')

}



function insertStudentJson(student) {
  function getColegio() {
    if (student['Colegio']) {
      // console.log("COLEGIO: ", student['Colegio']);
      return xls.getCodeByColegio(student['Colegio']);
    } else {
      return '1';
    }
  }
  function getCarrera() {
    // console.log(student['Carreras']);
    if (student['Carreras']) {
      // console.log('CARRERA: ', student['Carreras']);
      return xls.getCodeByCarrera(student['Carreras']);
    } else {
      return 'PR01001';
    }
  }

  return {
    'ADD_RUT' : student['RUT'].split('.').join('').split('-')[0],
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
    'ADD_DIRECCION' : student['Mailing Street'] || 'SIN DATO',
    'ADD_COMUNA' : 'santiago', // NO VIENE DE ZOHO
    'ADD_CIUDAD' : student['Mailing City'] || 'santiago',
    'ADD_ESRESPONSABLEFINANCIERO' : 'SI', // NO VIENE DE ZOHO
    'ADD_COLEGIO' : getColegio(),
    'ADD_CATEGORIA' : '1', // NO VIENE DE ZOHO
    'ADD_ANOEGRESO' : '2000', // NO VIENE DE ZOHO
    'ADD_NEM' : 1, // NO VIENE DE ZOHO
    'ADD_ESTADOCIVIL' : 'soltero', // NO VIENE DE ZOHO
    'ADD_NACIONALIDAD' : '1', // NO VIENE DE ZOHO
    'ADD_CODIGOCARRERA' : getCarrera(),
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
  synchronizeUmasToCrm : synchronizeUmasToCrm
};


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


// { CONTACTID: '1990525000003361001',
//   SMOWNERID: '1990525000000099003',
//   'Contact Owner': 'Daniela León',
//   'Lead Source': 'Charlas en colegios',
//   'First Name': 'Matriculado',
//   'Last Name': 'de Prueba',
//   Email: 'notify@santiagosystems.com',
//   Phone: '333333333',
//   'Home Phone': '222222222',
//   'Other Phone': '5696651745',
//   Mobile: '99999999',
//   'Date of Birth': '1999-03-14',
//   SMCREATORID: '1990525000000099003',
//   'Created By': 'Daniela León',
//   MODIFIEDBY: '1990525000000099003',
//   'Modified By': 'Daniela León',
//   'Created Time': '2017-02-03 15:53:54',
//   'Modified Time': '2017-02-03 15:53:54',
//   'Mailing Street': 'General Bustamante 16 Of. 1-A',
//   'Other Street': 'General Bustamante 16 Of. 1-A',
//   'Mailing City': 'Santiago',
//   'Other City': 'Santiago',
//   'Mailing State': 'Providencia',
//   'Other State': 'Providencia',
//   'Mailing Zip': '7500776',
//   'Other Zip': '7500776',
//   'Mailing Country': 'Chile',
//   'Other Country': 'Chile',
//   Description: 'ESTE ES UN MATRICULADO DE PRUEBA',
//   'Email Opt Out': 'false',
//   'Secondary Email': 'cbustamante@santiagosystems.com',
//   'Last Activity Time': '2017-02-03 15:55:38',
//   Jornada: 'Vespertino',
//   Carreras: 'INGENIERIA EN PREVENCION DE RIESGOS, CALIDAD Y AMBIENTE NIVEL PROFESIONAL PLAN CONTINUIDAD',
//   'Estado de consulta': 'Matriculado en IPG',
//   Sedes: 'Providencia',
//   RUT: '123456789',
//   Colegio: 'Colegio de Prueba',
//   'Cost per Click': '0',
//   'Cost per Conversion': '0' }


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
