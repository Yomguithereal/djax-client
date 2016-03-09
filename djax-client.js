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
const BLACKLIST = {
  beforeSend: true,
  error: true,
  success: true
};

const DEFAULTS = {
  params: {}
};

const DEFAULT_SETTINGS = {
  baseUrl: null,
  engine: djax,
  solver: /\:([^/:]+)/g
};

/**
 * Helpers
 */
function isPlainObject(value) {
  return value &&
         typeof value === 'object' &&
         !Array.isArray(value) &&
         !(value instanceof Date) &&
         !(value instanceof RegExp);
}

function isNesting(spec) {
  return isPlainObject(spec) && !spec.url;
}

function setIn(o, path, value) {
  for (let i = 0, l = path.length; i < l; i++) {
    let step = path[i];

    if (i === l - 1) {
      o[step] = value;
      return;
    }

    o[step] = o[step] || {};
    o = o[step];
  }
}

function getIn(o, path) {
  if (!path)
    return;

  for (let i = 0, l = path.length; i < l; i++) {
    let step = path[i];

    o = o[step];
  }

  return o;
}

function solve(o, solver, definitions, scope) {
  let s = {},
      k;

  for (k in o) {
    if (typeof o[k] === 'function' && !BLACKLIST[k]) {
      s[k] = o[k].call(scope);
    }
    else if (typeof o[k] === 'string') {

      // Solving string parameters
      s[k] = o[k];

      let match;
      while ((match = solver.exec(o[k])) !== null) {
        let [pattern, key] = match,
            replacement = definitions[key];

        if (typeof replacement === 'function')
          replacement = replacement.call(scope);

        if (replacement)
          s[k] = s[k].replace(pattern, replacement);
      }

      // Resetting the solver's state
      solver.lastIndex = 0;
    }
    else {
      if (k !== 'params' && isPlainObject(o[k]))
        s[k] = solve(o[k], solver, definitions, scope);
      else
        s[k] = o[k];
    }
  }

  return s;
}

function bind(o, scope) {
  let b = {},
      k;

  for (k in o) {
    if (BLACKLIST[k] && typeof o[k] === 'function')
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
  constructor({settings = {},
               defaults = {},
               services = {}}) {

    const scope = settings.scope || null;

    // Basic properties
    this._settings = assign({}, DEFAULT_SETTINGS, settings);
    this._defaults = bind(assign({}, DEFAULTS, defaults), scope);
    this._engine = this._settings.engine;
    this._services = services;

    // Registering initial services
    Object.keys(services).forEach(k => this.register(k, services[k]));
  }

  // Registering a service
  register(name, options = {}) {
    name = [].concat(name);

    // Are we nesting?
    if (isNesting(options)) {
      for (const k in options)
        this.register(name.concat(k), options[k]);

      return;
    }

    if (typeof options === 'string')
      options = {url: options};

    const boundOptions = bind(options, this._settings.scope || null);

    setIn(this._services, name, boundOptions);
    const fn = (o, callback) => {
      let mergedOptions = isPlainObject(o) ?
        assign({}, boundOptions, o) :
        o || {};

      if (typeof o === 'function') {
        callback = o;
        mergedOptions = boundOptions;
      }

      return this.request.call(this, name, mergedOptions, callback);
    };

    setIn(this, name, fn);
  }

  // Requesting a service
  request(name, options, callback) {

    // Handling polymorphism
    if (arguments.length < 3) {
      if (typeof options === 'function') {
        callback = options;
      }

      if (typeof name !== 'string' && !Array.isArray(name)) {
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
      else if (isPlainObject(name)) {
        options = name;
        name = null;
        callback = null;
      }
    }

    if (name)
      name = [].concat(name);

    // Safeguard
    callback = callback || Function.prototype;

    const service = getIn(this._services, name);

    if (!service && name)
      throw Error('djax-client.request: service not found.');

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
      this._settings.solver,
      assign({}, this._defaults.params, options.params),
      this._settings.scope || null
    );

    if (this._settings.baseUrl)
      ajaxOptions.url = joinUrls(this._settings.baseUrl, ajaxOptions.url);

    // Calling
    return this._engine(ajaxOptions)
      .fail(function(xhr, errorMsg) {
        let e = new Error(errorMsg);
        e.xhr = xhr;

        return callback(e);
      })
      .done(function(data) {
        return callback(null, data);
      });
  }
}
