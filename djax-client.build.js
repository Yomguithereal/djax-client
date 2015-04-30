(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DjaxClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, '__esModule', {
  value: true
});
/**
 * Djax Services Client
 * =====================
 *
 * A straightforward services client powered by djax.
 */

var _djax = require('djax');

var _djax2 = _interopRequireDefault(_djax);

var _assign = require('object-assign');

var _assign2 = _interopRequireDefault(_assign);

/**
 * Defaults
 */
var blackList = function blackList(x) {
  return !! ~['beforeSend', 'success', 'error'].indexOf(x);
};

var DEFAULTS = {};

var DEFAULT_SETTINGS = {
  baseUrl: null,
  engine: _djax2['default'],
  solver: /\:([^/:]+)/g
};

/**
 * Helpers
 */
function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Function);
}

function solve(o, solver, definitions, scope) {
  var s = {},
      k = undefined;

  for (k in o) {
    if (typeof o[k] === 'function' && !blackList(k)) {
      s[k] = o[k].call(scope);
    } else if (typeof o[k] === 'string') {

      // Solving string parameters
      s[k] = o[k];

      var match = undefined;
      while ((match = solver.exec(o[k])) !== null) {
        var _match = _slicedToArray(match, 2);

        var pattern = _match[0];
        var key = _match[1];
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
    if (blackList(k) && typeof o[k] === 'function') b[k] = o[k].bind(scope);else b[k] = o[k];
  }

  return b;
}

function stripSlash(url, leading) {
  if (leading) {
    return url.charAt(0) === '/' ? url.slice(1) : url;
  } else {
    return url.slice(-1) === '/' ? url.slice(0, -1) : url;
  }
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
    var _ref$define = _ref.define;
    var define = _ref$define === undefined ? {} : _ref$define;
    var _ref$services = _ref.services;
    var services = _ref$services === undefined ? {} : _ref$services;

    _classCallCheck(this, Client);

    var scope = settings.scope || null;

    // Basic properties
    this._settings = _assign2['default']({}, DEFAULT_SETTINGS, settings);
    this._defaults = bind(_assign2['default']({}, DEFAULTS, defaults), scope);
    this._definitions = bind(define, scope);
    this._engine = this._settings.engine;
    this._services = services;

    // Registering initial services
    Object.keys(services).forEach(function (k) {
      return _this.register(k, services[k]);
    });
  }

  _createClass(Client, [{
    key: 'register',

    // Registering a service
    value: function register(name) {
      var _this2 = this;

      var options = arguments[1] === undefined ? {} : arguments[1];

      if (typeof options === 'string') options = { url: options };

      var boundOptions = bind(options, this._settings.scope || null);

      this._services[name] = boundOptions;
      this[name] = function (o, callback) {
        var mergedOptions = isPlainObject(o) ? _assign2['default']({}, boundOptions, o) : o || {};

        if (typeof o === 'function') {
          callback = o;
          mergedOptions = boundOptions;
        }

        return _this2.request.call(_this2, name, mergedOptions, callback);
      };
    }
  }, {
    key: 'request',

    // Requesting a service
    value: function request(name, options, callback) {

      // Handling polymorphism
      if (arguments.length < 3) {
        if (typeof options === 'function') {
          callback = options;
        }

        if (typeof name !== 'string') {
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
        } else if (typeof name === 'object') {
          options = name;
          name = null;
          callback = null;
        }
      }

      // Safeguard
      callback = callback || Function.prototype;

      var service = this._services[name];

      if (!service && name) throw Error('djax-client.request: inexistent service.');

      // Merging
      var ajaxOptions = _assign2['default']({}, this._defaults, service, options);

      // Base url
      if (!ajaxOptions.url) throw Error('djax-client.request: no url was provided.');

      // Solving
      ajaxOptions = solve(ajaxOptions, this._settings.solver, _assign2['default']({}, options.params, this._definitions), this._settings.scope || null);

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

},{"djax":2,"object-assign":3}],2:[function(require,module,exports){
(function(undefined) {
  'use strict';

  // Declare the ajax function:
  function ajax(opt, fn) {
    if (!ajax.xhr)
      throw new Error(
        'XMLHttpRequest not found. You can specify which XMLHttpRequest ' +
        'you want to use by using `ajax.xhr = myXHR`.'
      );

    // Callbacks:
    var successes = [],
        errors = [],
        beforeSend = [];

    // Check for given callbacks:
    if (typeof opt === 'string') {
      opt = { url: opt };

      if (arguments.length === 2) {
        if (typeof fn === 'function')
          successes.push(fn);
        else if (Array.isArray(fn))
          successes = successes.concat(fn);
      }
    } else if (typeof opt !== 'object' || !opt)
      throw new Error('Wrong arguments');

    if (typeof opt.success === 'function')
      successes.push(opt.success);
    else if (Array.isArray(opt.success))
      successes = successes.concat(opt.success);

    if (typeof opt.error === 'function')
      errors.push(opt.error);
    else if (Array.isArray(opt.error))
      errors = errors.concat(opt.error);

    // Other parameters:
    var key,
        data,
        timer,
        conclude,
        textStatus,
        done = false,
        url = opt.url,
        xhr = new ajax.xhr(),
        type = opt.type || 'GET',
        dataType = opt.dataType || 'json',
        contentType = opt.contentType || 'application/x-www-form-urlencoded';

    if (!url || typeof url !== 'string')
      throw new Error('Wrong arguments');

    if (opt.data) {
      if (typeof opt.data === 'string')
        data = opt.data;
      else if (/json/.test(contentType))
        data = JSON.stringify(opt.data);
      else {
        data = [];
        for (key in opt.data)
          data.push(
            encodeURIComponent(key) + '=' + encodeURIComponent(opt.data[key])
          );
        data = data.join('&');
      }

      if (/GET|DELETE/i.test(type)) {
        url += /\?/.test(url) ?
          '&' + data :
          '?' + data;
        data = '';
      }
    }

    xhr.onreadystatechange = function() {
      if (+xhr.readyState === 4) {
        done = true;

        if (timer)
          clearTimeout(timer);

        if (/^2/.test(xhr.status)) {
          done = true;
          textStatus = 'success';
          data = xhr.responseText;

          if (/json/.test(dataType)) {
            try {
              data = data ? JSON.parse(data) : '';
            } catch (e) {
              conclude = function(successes, errors) {
                errors.forEach(function(fn) {
                  fn(xhr, textStatus = 'parsererror');
                });
              };
              conclude(null, errors);
              return;
            }
          }

          // Specific 204 HTTP status case:
          if (+xhr.status === 204) {
            textStatus = 'nocontent';
            data = undefined;
          }

          conclude = function(successes, errors) {
            successes.forEach(function(fn) {
              fn(data, textStatus, xhr);
            });
          };
          conclude(successes);

        } else {
          conclude = function(successes, errors) {
            errors.forEach(function(fn) {
              fn(
                xhr,
                +xhr.status ? 'error' : 'abort',
                xhr.responseText
              );
            });
          };
          conclude(null, errors);
        }
      }
    };

    // Check xhrFields
    if (opt.xhrFields && typeof opt.xhrFields === 'object')
      for (key in opt.xhrFields)
        xhr[key] = opt.xhrFields[key];

    xhr.open(type, url, true);
    xhr.setRequestHeader('Content-Type', contentType);

    // Check custom headers:
    if (opt.headers)
      for (key in opt.headers)
        xhr.setRequestHeader(key, opt.headers[key]);

    // Check the "beforeSend" callback:
    if (
      typeof opt.beforeSend === 'function' &&
      opt.beforeSend(xhr, opt) === false
    ) {
      done = true;
      conclude = function(successes, errors) {
        errors.forEach(function(fn) {
          fn(
            xhr,
            'abort',
            xhr.responseText
          );
        });
      };
      conclude(null, errors);
      return xhr.abort();
    }

    // Check "timeout":
    if (opt.timeout)
      timer = setTimeout(function() {
        done = true;
        xhr.onreadystatechange = function() {};
        xhr.abort();
        conclude = function(successes, errors) {
          errors.forEach(function(fn) {
            fn(xhr, 'timeout');
          });
        };
        conclude(null, errors);
      }, opt.timeout);

    // Send the AJAX call:
    xhr.send(data);

    // Promise:
    xhr.done = function(callback) {
      if (typeof callback === 'function')
        successes.push(callback);
      else if (Array.isArray(callback))
        successes = successes.concat(callback);
      else
        throw new Error('Wrong arguments.');

      // If the call has already been received:
      if (done) {
        if (typeof callback === 'function')
          conclude([callback]);
        else if (Array.isArray(callback))
          conclude(callback);
      }

      return this;
    };
    xhr.fail = function(callback) {
      if (typeof callback === 'function')
        errors.push(callback);
      else if (Array.isArray(callback))
        errors = errors.concat(callback);
      else
        throw new Error('Wrong arguments.');

      // If the call has already been received:
      if (done) {
        if (typeof callback === 'function')
          conclude(null, [callback]);
        else if (Array.isArray(callback))
          conclude(null, callback);
      }

      return this;
    };
    xhr.then = function(success, error) {
      if (success)
        this.done(success);
      if (error)
        this.fail(error);

      // If the call has already been received:
      if (done)
        conclude(
          Array.isArray(success) ?
            success :
            typeof success === 'function' ?
              [success] : null,
          Array.isArray(error) ?
            error :
            typeof error === 'function' ?
              [error] : null
        );

      return this;
    };

    return xhr;
  }

  // Djax version:
  ajax.version = '1.1.0';

  // Check XMLHttpRequest presence:
  if (typeof XMLHttpRequest !== 'undefined')
    ajax.xhr = XMLHttpRequest;

  // Export the AJAX method:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = ajax;
    exports.djax = ajax;
  } else if (typeof define === 'function' && define.amd)
    define('djax', [], function() {
      return ajax;
    });
  else
    this.djax = ajax;
}).call(this);

},{}],3:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}]},{},[1])(1)
});