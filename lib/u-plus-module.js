'use strict';
var soap = require('soap');
var easysoap = require('easysoap');
var http = require('http');
var params = {host: 'ipg.umas.cl',path: '/wscrm/Service1.asmx',wsdl: '/wscrm/Service1.asmx?WSDL'};
// ?USUARIO=wscrm&CLAVE=56d9aed975d82fd94f69aa36a0b94a693ffd7c65

function allFunctions() {
  var soapClient = easysoap.createClient(params);
  console.log("LOL");
  console.log(soapClient);
  soapClient.getAllFunctions()
    .then(function (list) {
      console.log("plpl");
      console.log(list);
    }
  )

  soapClient.getMethodParamsByName('WS_sp_busca_matriculado_todos_crm')
    .then(function (list) {
      console.log("**************************************************************************** GET METHOS PARAMS ****************************************************************************");

      console.log(JSON.stringify(list.request));
    }
  )


  soapClient.call({
    'method' : 'wsSpBuscaMatriculadoTodosCrm',
      'params' : {
        'USUARIO' : 'wscrm',
        'PASSWORD' : '56d9aed975d82fd94f69aa36a0b94a693ffd7c65'
      }
    }
  ).then(function (res) {
    console.log("BLA");
    console.log(res);
  });
}

// var soapHeader = ''//xml string for header
// var url = 'http://ipg.umas.cl/wscrm/'
// soap.createClient(url, function(err, client){
//   // client.addSoapHeader(soapHeader);
//   var args = {
//     USUARIO: "wscrm",
//     PASSWORD: "56d9aed975d82fd94f69aa36a0b94a693ffd7c65"
//   };
//
//   client.BasicVerify(args, function(err, result){
//    if(err){
//      throw err;
//    }
//    console.log(result);
//   });
// });

// WS_sp_busca_matriculado_todos_crm
function buscarMatriculados() {
  var req = http.get(params, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}
// getMatriculados()

// WS_sp_insertar_postulante_crm
function insertarPostulante() {
  var req = http.get(params, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}


// WS_sp_actualizar_postulante_crm
function actualizarPostulante() {
  var req = http.get(params, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}

// WS_sp_elimina_postulante_crm
function eliminarPostulante() {
  var req = http.get(params, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}

// WS_sp_busca_postulante_rut_crm
function buscarPostulanteRut() {
  var req = http.get(params, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}

// WS_sp_busca_matriculado_rut_crm
function buscarMatriculadoRut(rut, callback) {
  var req = http.get(params, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = Buffer.concat(bodyChunks);
      console.log('BODY: ' + body);
      // ...and/or process the entire body here.
    })
  });

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}

module.exports = {
  buscarMatriculados : buscarMatriculados,
  insertarPostulante : insertarPostulante,
  actualizarPostulante : actualizarPostulante,
  eliminarPostulante : eliminarPostulante,
  buscarPostulanteRut : buscarPostulanteRut,
  buscarMatriculadoRut : buscarMatriculadoRut,
  allFunctions : allFunctions

};
