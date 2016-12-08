'use strict';
var soap = require('soap'),
  easysoap = require('easysoap'),
  http = require('http'),
  clientParams = {host: 'ipg.umas.cl',path: '/wscrm/Service1.asmx',wsdl: '/wscrm/Service1.asmx?WSDL'},
  baseParams = {'USUARIO' : 'wscrm', 'PASSWORD' : '56d9aed975d82fd94f69aa36a0b94a693ffd7c65'},
  _ = require('underscore-node')

function allFunctions() {
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);
  soapClient.getAllFunctions()
    .then(function (list) {
      console.log(list);
    }
  )
}

function getMethodParamsByName(name) {
  var soapClient = easysoap.createClient(clientParams);
  soapClient.getMethodParamsByName(name)
    .then(function (list) {
      console.log("**************************************************************************** GET METHOS PARAMS ****************************************************************************");
      console.log(JSON.stringify(list.request));
    }
  )
}

// WS_sp_busca_matriculado_todos_crm
function buscarMatriculados() {
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);

  soapClient.call({
    method : 'WS_sp_busca_matriculado_todos_crm',
    attributes: {
      xmlns: 'http://umas.cl/'
    },
    params : {
      'USUARIO' : 'wscrm',
      'PASSWORD' : '56d9aed975d82fd94f69aa36a0b94a693ffd7c65'
    }
  }).then(function (res) {
    console.log(JSON.stringify(res));
  });
}


// WS_sp_insertar_postulante_crm
function insertarPostulante(params) {
  params = _.union(baseParams, params)
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);

  soapClient.call({
    method : 'WS_sp_insertar_postulante_crm',
    attributes: {
      xmlns: 'http://umas.cl/'
    },
    params : params
  }).then(function (res) {
    console.log(JSON.stringify(res));
  });
}

// WS_sp_actualizar_postulante_crm
function actualizarPostulante() {
  params = _.union(baseParams, params)
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);

  soapClient.call({
    method : 'WS_sp_actualizar_postulante_crm',
    attributes: {
      xmlns: 'http://umas.cl/'
    },
    params : params
  }).then(function (res) {
    console.log(JSON.stringify(res));
  });
}

// WS_sp_elimina_postulante_crm
function eliminarPostulante() {
  params = _.union(baseParams, params)
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);

  soapClient.call({
    method : 'WS_sp_elimina_postulante_crm',
    attributes: {
      xmlns: 'http://umas.cl/'
    },
    params : params
  }).then(function (res) {
    console.log(JSON.stringify(res));
  });
}

// WS_sp_busca_postulante_rut_crm
function buscarPostulanteRut() {
  params = _.union(baseParams, params)
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);

  soapClient.call({
    method : 'WS_sp_busca_postulante_rut_crm',
    attributes: {
      xmlns: 'http://umas.cl/'
    },
    params : params
  }).then(function (res) {
    console.log(JSON.stringify(res));
  });
}

// WS_sp_busca_matriculado_rut_crm
function buscarMatriculadoRut(rut, callback) {
  params = _.union(baseParams, params)
  var soapClient = easysoap.createClient(clientParams);
  console.log(soapClient);

  soapClient.call({
    method : 'WS_sp_busca_matriculado_rut_crm',
    attributes: {
      xmlns: 'http://umas.cl/'
    },
    params : params
  }).then(function (res) {
    console.log(JSON.stringify(res));
  });
}

module.exports = {
  buscarMatriculados : buscarMatriculados,
  insertarPostulante : insertarPostulante,
  actualizarPostulante : actualizarPostulante,
  eliminarPostulante : eliminarPostulante,
  buscarPostulanteRut : buscarPostulanteRut,
  buscarMatriculadoRut : buscarMatriculadoRut,
  allFunctions : allFunctions,
  getMethodParamsByName : getMethodParamsByName
};
