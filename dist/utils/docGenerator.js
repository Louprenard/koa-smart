'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.generateDoc = generateDoc;
exports.end = end;

var _path = require('path');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _child_process = require('child_process');

var _TypeArray = require('../types/TypeArray');

var _TypeObject = require('../types/TypeObject');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DIR = void 0;
var DIR_TMP = void 0;
var ENABLE_DOC = false;

function _capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function _param(file, type, keyBase) {
  if (type instanceof _TypeObject.TypeObject) {
    for (var key in type._schema) {
      var tmpType = type._schema[key];
      var sKey = keyBase ? keyBase + '.' + key : key;
      var sKeyD = !tmpType._isRequired ? '[' + sKey + ']' : sKey;
      var sType = _capitalize(tmpType._type || 'Any');
      var description = _capitalize(tmpType._getDescription());
      _fsExtra2.default.appendFileSync(file, ' * @apiParam {' + sType + '} ' + sKeyD + ' ' + description + '\n');
      if (tmpType instanceof _TypeObject.TypeObject) {
        _param(file, tmpType, sKey);
      }
    }
  }
  if (type instanceof _TypeArray.TypeArray) {
    var _sType = _capitalize(type._type || 'Any');
    var _description = _capitalize(type._getDescription());
    _fsExtra2.default.appendFileSync(file, ' * @apiParam {' + _sType + '} __ARRAY_BODY__ ' + _description + '\n');
  }
}

function init(pathDir, enable) {
  ENABLE_DOC = !!enable;
  if (!ENABLE_DOC) return;
  DIR = pathDir || (0, _path.join)(__dirname, '..', 'ApiDoc');
  DIR_TMP = (0, _path.join)(__dirname, '..', 'ApiDocTmp');
  _fsExtra2.default.removeSync(DIR_TMP);
  _fsExtra2.default.mkdirpSync(DIR_TMP);
}

function generateDoc(classRoute, route) {
  if (!ENABLE_DOC || classRoute.generateDoc === false || route.options.doc.disable === true) return;

  var options = route.options;

  var className = classRoute.constructor.name.replace('Route', '');
  _fsExtra2.default.mkdirpSync((0, _path.join)(DIR_TMP, options.routePath));
  var file = (0, _path.join)(DIR_TMP, (options.routePath || className) + '.js');
  _fsExtra2.default.writeFileSync(file, '\n');

  var group = '';
  if (classRoute.prefix) {
    group += _capitalize(classRoute.prefix.replace(/^\//, ''));
    if (group.length) group += '/';
  }
  group += _capitalize(className);

  _fsExtra2.default.appendFileSync(file, '/**\n');
  _fsExtra2.default.appendFileSync(file, ' * @api {' + options.type + '} ' + (options.routePath || '/') + '\n');
  _fsExtra2.default.appendFileSync(file, ' * @apiGroup ' + group + '\n');

  if (Array.isArray(options.accesses) && options.accesses.length) {
    var apiPermission = options.accesses.map(function (e) {
      return e.name || e;
    }).join(' OR ');
    _fsExtra2.default.appendFileSync(file, ' * @apiPermission ' + apiPermission + '\n');
  } else if (Array.isArray(classRoute.accesses) && classRoute.accesses.length) {
    var _apiPermission = classRoute.accesses.map(function (e) {
      return e.name;
    }).join(' ');
    _fsExtra2.default.appendFileSync(file, ' * @apiPermission ' + _apiPermission + '\n');
  } else {
    _fsExtra2.default.appendFileSync(file, ' * @apiPermission public\n');
  }

  _param(file, options.bodyType);

  if (options.doc.description) {
    _fsExtra2.default.appendFileSync(file, ' * @apiDescription ' + options.doc.description + '\n');
  }

  _fsExtra2.default.appendFileSync(file, '*/\n\n');
}

function end() {
  if (!ENABLE_DOC) return;
  var cmdApidoc = (0, _child_process.spawn)('npx', ['apidoc', '-i', DIR_TMP, '-o', DIR]);
  cmdApidoc.on('close', function (code) {
    if (code === 1) {
      // eslint-disable-next-line
      console.error('[DocGenerator] an error when generate the apiDoc ');
    }
    (0, _child_process.spawn)('rm', ['-rf', DIR_TMP]);
  });
}