/**
 * Djax Services Client
 * =====================
 *
 * A straightforward services client powered by djax.
 */
import djax from 'djax';

/**
 * Defaults
 */
const blackList = ['beforeSend', 'success', 'error'];
blackList.has = x => !!~this.indexOf(x);

const defaults = {
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
    if (blackList.has(k) || typeof o[k] !== 'function')
      s[k] = o[k];
    else
      s[k] = o[k].call(scope);
  }
}

function bind(o, scope) {
  var b = {},
      k;

  for (k in o) {
    if (!blackList.has(k))
      b[k] = o[k];
    else
      b[k] = o[k].bind(scope);
  }

  return b;
}

/**
 * Main Class
 */
export default class Client {

  // Initialization
  constructor({settings = defaults,
               define = {},
               engine = djax,
               scope = null,
               services = {}}) {

    // Basic properties
    this._settings = bind(settings, scope);
    this._definitions = bind(define, scope);
    this._engine = engine;
    this._scope = scope;
    this._services = services;

    // Registering initial services
    Object.keys(services).forEach(k => this.register(k, services[k]));
  }

  // Registering a service
  register(name, options = {}) {
    const boundOptions = bind(options, this._scope);

    this._services[name] = boundOptions;
    this[name] = this.request.bind(this, name, boundOptions);
  }

  // Requesting a service
  request(name, options, callback) {

    // Polymorphism
    if (arguments.length < 3) {
      callback = options;
      options = {};
    }

    // Safeguard
    callback = callback || Function.prototype;

    const service = this._service[name];

    if (!service)
      throw Error('djax-client.request: inexistent service.');

    // Merging
    const ajaxOptions = Object.assign({}, this._defaults, service, options);

    return this._engine(ajaxOptions, callback);
  }
}
