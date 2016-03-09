/**
 * Djax Services Client
 * =====================
 *
 * A straightforward services client powered by djax.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _djax = require('djax');

var _djax2 = _interopRequireDefault(_djax);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

/**
 * Defaults
 */
var BLACKLIST = {
  beforeSend: true,
  error: true,
  success: true
};

var DEFAULTS = {
  params: {}
};

var DEFAULT_SETTINGS = {
  baseUrl: null,
  engine: _djax2['default'],
  solver: /\:([^/:]+)/g
};

/**
 * Helpers
 */
function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof RegExp);
}

function isNesting(spec) {
  return isPlainObject(spec) && !spec.url;
}

function setIn(o, path, value) {
  for (var i = 0, l = path.length; i < l; i++) {
    var step = path[i];

    if (i === l - 1) {
      o[step] = value;
      return;
    }

    o[step] = o[step] || {};
    o = o[step];
  }
}

function getIn(o, path) {
  if (!path) return;

  for (var i = 0, l = path.length; i < l; i++) {
    var step = path[i];

    o = o[step];
  }

  return o;
}

function solve(o, solver, definitions, scope) {
  var s = {},
      k = undefined;

  for (k in o) {
    if (typeof o[k] === 'function' && !BLACKLIST[k]) {
      s[k] = o[k].call(scope);
    } else if (typeof o[k] === 'string') {

      // Solving string parameters
      s[k] = o[k];

      var match = undefined;
      while ((match = solver.exec(o[k])) !== null) {
        var _match = match;

        var _match2 = _slicedToArray(_match, 2);

        var pattern = _match2[0];
        var key = _match2[1];
        var replacement = definitions[key];

        if (typeof replacement === 'function') replacement = replacement.call(scope);

        if (replacement) s[k] = s[k].replace(pattern, replacement);
      }

      // Resetting the solver's state
      solver.lastIndex = 0;
    } else {
      if (k !== 'params' && isPlainObject(o[k])) s[k] = solve(o[k], solver, definitions, scope);else s[k] = o[k];
    }
  }

  return s;
}

function bind(o, scope) {
  var b = {},
      k = undefined;

  for (k in o) {
    if (BLACKLIST[k] && typeof o[k] === 'function') b[k] = o[k].bind(scope);else b[k] = o[k];
  }

  return b;
}

function stripSlash(url, leading) {
  if (leading) return url.charAt(0) === '/' ? url.slice(1) : url;else return url.slice(-1) === '/' ? url.slice(0, -1) : url;
}

function joinUrls() {
  for (var _len = arguments.length, urls = Array(_len), _key = 0; _key < _len; _key++) {
    urls[_key] = arguments[_key];
  }

  return urls.reduce(function (a, b) {
    return [stripSlash(a), stripSlash(b, true)].join('/');
  });
}

/**
 * Main Class
 */

var Client = (function () {

  // Initialization

  function Client(_ref) {
    var _this = this;

    var _ref$settings = _ref.settings;
    var settings = _ref$settings === undefined ? {} : _ref$settings;
    var _ref$defaults = _ref.defaults;
    var defaults = _ref$defaults === undefined ? {} : _ref$defaults;
    var _ref$services = _ref.services;
    var services = _ref$services === undefined ? {} : _ref$services;

    _classCallCheck(this, Client);

    var scope = settings.scope || null;

    // Basic properties
    this._settings = (0, _objectAssign2['default'])({}, DEFAULT_SETTINGS, settings);
    this._defaults = bind((0, _objectAssign2['default'])({}, DEFAULTS, defaults), scope);
    this._engine = this._settings.engine;
    this._services = services;

    // Registering initial services
    Object.keys(services).forEach(function (k) {
      return _this.register(k, services[k]);
    });
  }

  // Registering a service

  _createClass(Client, [{
    key: 'register',
    value: function register(name) {
      var _this2 = this;

      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      name = [].concat(name);

      // Are we nesting?
      if (isNesting(options)) {
        for (var k in options) {
          this.register(name.concat(k), options[k]);
        }return;
      }

      if (typeof options === 'string') options = { url: options };

      var boundOptions = bind(options, this._settings.scope || null);

      setIn(this._services, name, boundOptions);
      var fn = function fn(o, callback) {
        var mergedOptions = isPlainObject(o) ? (0, _objectAssign2['default'])({}, boundOptions, o) : o || {};

        if (typeof o === 'function') {
          callback = o;
          mergedOptions = boundOptions;
        }

        return _this2.request.call(_this2, name, mergedOptions, callback);
      };

      setIn(this, name, fn);
    }

    // Requesting a service
  }, {
    key: 'request',
    value: function request(name, options, callback) {

      // Handling polymorphism
      if (arguments.length < 3) {
        if (typeof options === 'function') {
          callback = options;
        }

        if (typeof name !== 'string' && !Array.isArray(name)) {
          options = name;
          name = null;
        } else {
          options = {};
        }
      }

      if (arguments.length < 2) {
        if (typeof name === 'function') {
          callback = name;
          name = null;
          options = {};
        } else if (isPlainObject(name)) {
          options = name;
          name = null;
          callback = null;
        }
      }

      if (name) name = [].concat(name);

      // Safeguard
      callback = callback || Function.prototype;

      var service = getIn(this._services, name);

      if (!service && name) throw Error('djax-client.request: service not found.');

      // Merging
      var ajaxOptions = (0, _objectAssign2['default'])({}, this._defaults, service, options);

      // Base url
      if (!ajaxOptions.url) throw Error('djax-client.request: no url was provided.');

      // Solving
      ajaxOptions = solve(ajaxOptions, this._settings.solver, (0, _objectAssign2['default'])({}, this._defaults.params, options.params), this._settings.scope || null);

      if (this._settings.baseUrl) ajaxOptions.url = joinUrls(this._settings.baseUrl, ajaxOptions.url);

      // Calling
      return this._engine(ajaxOptions).fail(function (xhr, errorMsg) {
        var e = new Error(errorMsg);
        e.xhr = xhr;

        return callback(e);
      }).done(function (data) {
        return callback(null, data);
      });
    }
  }]);

  return Client;
})();

exports['default'] = Client;
module.exports = exports['default'];

