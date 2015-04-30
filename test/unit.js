/**
 * Djax Services Client Unit Testing
 * ==================================
 *
 */
import assert from 'assert';
import jquery from 'jquery';
import Client from '../djax-client.js';

describe('Client', function() {

  describe('API', function() {
    var client = new Client({
      settings: {
        baseUrl: 'http://localhost:7337'
      },
      services: {
        basic: {
          url: '/basic'
        }
      }
    });

    it('should be possible to request a service.', function(done) {

      client.request('basic').then(function(data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('services should be bound to the client.', function(done) {
      client.basic(function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should return a promise.', function() {
      var promise = client.request('basic');

      assert(promise instanceof XMLHttpRequest);
      assert('then' in promise);
      assert('fail' in promise);
      assert('done' in promise);
    });

    it('should be possible to request through the engine directly.', function(done) {

      assert.throws(function() {
        client.request({hello: 'world'});
      }, /no url/);

      assert.throws(function() {
        client.request(Function.prototype);
      }, /no url/);

      assert.throws(function() {
        client.request();
      }, /no url/);

      client.request({url: '/basic'}, function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should normalize correctly the baseUrl + url target.', function(done) {
      client.request({url: 'basic'}, function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should expose an error on fail.', function(done) {
      var xhr = client.request({url: '/inexistent'}, function(err, data) {
        assert.strictEqual(err.message, 'error');
        assert(err.xhr === xhr);
        done();
      });
    });
  });

  describe('Solving', function() {
    var client = new Client({
      settings: {
        baseUrl: 'http://localhost:7337'
      },
      services: {
        basic: {
          url: function() {
            return '/basic';
          }
        },
        basicWithParam: {
          url: '/:param'
        }
      }
    });

    it('should be possible to solve functions.', function(done) {
      client.basic(function(err, data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should be possible to solve parameters.', function(done) {
      client.basicWithParam({params: {param: 'basic'}}, function(err, data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    // Definitions
    // Dynamic definitions
    // Recursive
    // Merge params
    // Do not fail the port
  });

  describe('Defaults', function() {

    it('should be possible to set any defaults.', function(done) {
      var client = new Client({
        settings: {
          baseUrl: 'http://localhost:7337'
        },
        defaults: {
          url: '/basic'
        },
        services: {
          basic: {}
        }
      });

      client.request('basic', function(err, data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });
  });

  describe('Settings', function() {

    it('should be possible to bind the client to a scope.', function(done) {
      var scope = {
        method: 'GET',
        test: true
      };

      var client = new Client({
        settings: {
          baseUrl: 'http://localhost:7337',
          scope: scope
        },
        services: {
          basic: {
            url: '/basic',
            method: function() {
              return this.method;
            },
            success: function() {
              assert(this.test);
              return done();
            }
          }
        }
      });

      client.basic();
    });

    it('should be possible to set another engine.', function(done) {
      var client = new Client({
        settings: {
          baseUrl: 'http://localhost:7337',
          engine: jquery.ajax,
        },
        services: {
          basic: {
            url: '/basic'
          }
        }
      });

      client.request('basic', function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });
  });
});
