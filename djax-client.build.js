(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DjaxClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _interopRequireDefault = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

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

/**
 * Defaults
 */
var blackList = ['beforeSend', 'success', 'error'];
blackList.has = function (x) {
  return !! ~undefined.indexOf(x);
};

var defaults = {
  method: 'GET',
  solver: /\:([^\/]+)/
};

/**
 * Helpers
 */
function solve(o, definitions, scope) {
  var s = {},
      k;

  for (k in o) {
    if (blackList.has(k) || typeof o[k] !== 'function') s[k] = o[k];else s[k] = o[k].call(scope);
  }
}

function bind(o, scope) {
  var b = {},
      k;

  for (k in o) {
    if (!blackList.has(k)) b[k] = o[k];else b[k] = o[k].bind(scope);
  }

  return b;
}

/**
 * Main Class
 */

var Client = (function () {

  // Initialization

  function Client(_ref) {
    var _this = this;

    var _ref$settings = _ref.settings;
    var settings = _ref$settings === undefined ? defaults : _ref$settings;
    var _ref$define = _ref.define;
    var define = _ref$define === undefined ? {} : _ref$define;
    var _ref$engine = _ref.engine;
    var engine = _ref$engine === undefined ? _djax2['default'] : _ref$engine;
    var _ref$scope = _ref.scope;
    var scope = _ref$scope === undefined ? null : _ref$scope;
    var _ref$services = _ref.services;
    var services = _ref$services === undefined ? {} : _ref$services;

    _classCallCheck(this, Client);

    // Basic properties
    this._settings = bind(settings, scope);
    this._definitions = bind(define, scope);
    this._engine = engine;
    this._scope = scope;
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
      var options = arguments[1] === undefined ? {} : arguments[1];

      var boundOptions = bind(options, this._scope);

      this._services[name] = boundOptions;
      this[name] = this.request.bind(this, name, boundOptions);
    }
  }, {
    key: 'request',

    // Requesting a service
    value: function request(name, options, callback) {

      // Polymorphism
      if (arguments.length < 3) {
        callback = options;
        options = {};
      }

      // Safeguard
      callback = callback || Function.prototype;

      var service = this._service[name];

      if (!service) throw Error('djax-client.request: inexistent service.');

      // Merging
      var ajaxOptions = Object.assign({}, this._defaults, service, options);

      return this._engine(ajaxOptions, callback);
    }
  }]);

  return Client;
})();

exports['default'] = Client;
module.exports = exports['default'];

},{"djax":2}],2:[function(require,module,exports){
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
      this.done(success);
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
  ajax.version = '1.0.2';

  // Check XMLHttpRequest presence:
  if (typeof XMLHttpRequest !== 'undefined')
    ajax.xhr = XMLHttpRequest;

  // Export the AJAX method:
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      exports = module.exports = ajax;
    exports.ajax = ajax;
  } else if (typeof define === 'function' && define.amd)
    define('djax', [], function() {
      return ajax;
    });
  else
    this.ajax = ajax;
}).call(this);

},{}]},{},[1])(1)
});