/**
 * Djax Services Client
 * =====================
 *
 * A straightforward services client powered by djax.
 */
import djax from 'djax';
import assign from 'object-assign';

/**
 * Defaults
 */
const blackList = x => !!~['beforeSend', 'success', 'error'].indexOf(x);

const DEFAULTS = {
  method: 'GET'
};

const DEFAULT_SETTINGS = {
  baseUrl: null,
  solver: /\:([^\/]+)/
};

/**
 * Helpers
 */
function solve(o, definitions, scope) {
  var s = {},
      k;

  for (k in o) {
    if (blackList(k) || typeof o[k] !== 'function') {
      s[k] = o[k];
    }
    else {

      // TODO: solve parameters here, coming from definitions plus parameters
      // TODO: merge define --> settings: params
      // TODO: must check that return is either string or number
      // TODO: recursive solving
      // TODO: merge definitions with given params
      s[k] = o[k].call(scope);
    }
  }

  return s;
}

function bind(o, scope) {
  var b = {},
      k;

  for (k in o) {
    if (blackList(k) && typeof o[k] === 'function')
      b[k] = o[k].bind(scope);
    else
      b[k] = o[k];
  }

  return b;
}

function stripSlash(url, leading) {
  if (leading)
    return url.charAt(0) === '/' ? url.slice(1) : url;
  else
    return url.slice(-1) === '/' ? url.slice(0, -1) : url;
}

function joinUrls(...urls) {
  return urls.reduce(function(a, b) {
    return [stripSlash(a), stripSlash(b, true)].join('/');
  });
}

/**
 * Main Class
 */
export default class Client {

  // Initialization
  constructor({settings = DEFAULT_SETTINGS,
               defaults = DEFAULTS,
               define = {},
               services = {}}) {

    const scope = settings.scope || null;

    // Basic properties
    this._settings = settings;
    this._defaults = bind(defaults, scope);
    this._definitions = bind(define, scope);
    this._engine = this._settings.engine || djax;
    this._scope = scope;
    this._services = services;

    // Registering initial services
    Object.keys(services).forEach(k => this.register(k, services[k]));
  }

  // Registering a service
  register(name, options = {}) {
    const boundOptions = bind(options, this._settings.scope || null);

    this._services[name] = boundOptions;
    this[name] = this.request.bind(this, name, boundOptions);
  }

  // Requesting a service
  request(name, options, callback) {

    // Handling polymorphism
    if (arguments.length < 3) {
      if (typeof options === 'function') {
        callback = options;
      }

      if (typeof name !== 'string') {
        options = name;
        name = null;
      }
      else {
        options = {};
      }
    }

    if (arguments.length < 2) {
      if (typeof name === 'function') {
        callback = name;
        name = null;
        options = {};
      }
      else if (typeof name === 'object') {
        options = name;
        name = null;
        callback = null;
      }
    }

    // Safeguard
    callback = callback || Function.prototype;

    const service = this._services[name];

    if (!service && name)
      throw Error('djax-client.request: inexistent service.');

    // Merging
    let ajaxOptions = assign({},
      this._defaults,
      service,
      options
    );

    // Base url
    if (!ajaxOptions.url)
      throw Error('djax-client.request: no url was provided.');

    // Solving
    ajaxOptions = solve(
      ajaxOptions,
      assign({}, options.params, this._definitions),
      this._settings.scope || null
    );

    if (this._settings.baseUrl)
      ajaxOptions.url = joinUrls(this._settings.baseUrl, ajaxOptions.url);

    // Calling
    return this._engine(ajaxOptions)
      .fail(function(xhr, errorMsg) {
        var e = new Error(errorMsg);
        e.xhr = xhr;

        return callback(e);
      })
      .done(function(data) {
        return callback(null, data);
      });
  }
}
