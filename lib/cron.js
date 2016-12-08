'use strict';
var cron = require('node-cron'),
  zohoModule = require('./zoho-module.js'),
  uplusModule = require('./u-plus-module.js'),
  _ = require('underscore-node')

cron.schedule('0 0 * * * *', function(){
  console.log('running a task hour');
  synchronize()
});

function synchronize() {
  zohoModule.getContacts(function (crmMatriculados) {
    console.log(crmMatriculados.length);
    _.each(crmMatriculados, function (student) {
      console.log(JSON.stringify(student));
      uplusModule.insertarPostulante(insertStudentJson(student))
    })
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
};
