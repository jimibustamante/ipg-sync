var XLSX = require('node-xlsx').default;
var stringSimilarity = require('string-similarity');
var _ = require('underscore-node');
var fs = require('fs');

function readExcel() {
  var workbook = XLSX.parse(fs.readFileSync(`ColegiosCarrerasIPG.xlsx`));
  return workbook;
}

function getColegios() {
  return readExcel()[0].data;
}

function getCarreras() {
  return readExcel()[1].data;
}

function getColegioByCode(code) {
  var colegios = getColegios();
  var colegio = _.find(colegios, function (item) {
    return item[0] === parseInt(code);
  });
  if (colegio) {
    return colegio[1];
  } else {
    return '';
  }
}

function getCarreraByCode(code) {
  var carreras = getCarreras();
  var carrera = _.find(carreras, function (item) {
    return item[0] === code;
  });
  if (carrera) {
    return carrera[1];
  } else {
    return '';
  }
}

function getCodeByColegio(colegio) {
  var colegios = getColegios();
  var code = _.find(colegios, function (item) {
    if (item[1] && typeof(item[1]) === 'string') {
      return stringSimilarity.compareTwoStrings(colegio, item[1]) >= 0.9;
    } else {
      return false;
    }
  });
  if (code) {
    return code[0];
  } else {
    return '1';
  }
}

function getCodeByCarrera(carrera) {
  var carreras = getCarreras();
  var code = _.find(carreras, function (item) {
    // return stringSimilarity.compareTwoStrings(carrera, item[1]) >= 0.95;
    return carrera === item[1];
  });
  if (code) {
    return code[0];
  } else {
    // UMAS default code
    return 'PR01001';
  }
}

module.exports = {
  readExcel : readExcel,
  getColegios : getColegios,
  getCarreras : getCarreras,
  getColegioByCode : getColegioByCode,
  getCarreraByCode : getCarreraByCode,
  getCodeByColegio : getCodeByColegio,
  getCodeByCarrera : getCodeByCarrera
};
