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
        },
        urlBasic: '/basic',
        nested: {
          basic: '/basic',
          other: '/basic'
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

    it('should be possible to use the url polymorphism.', function(done) {
      client.urlBasic(function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should be possible to nest the services.', function(done) {
      assert.deepEqual(Object.keys(client.nested), ['basic', 'other']);

      client.nested.other(function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should be possible to request by path.', function(done) {
      client.request(['nested', 'basic'], function(err, data) {
        assert(err === null);
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });
  });

  describe('Solving', function() {
    var client = new Client({
      settings: {
        baseUrl: 'http://localhost:7337'
      },
      defaults: {
        params: {
          fragment: 'basic',
          fragment2: 'data',
          fnFragment: function() {
            return 'basic';
          },
          value: 'world'
        }
      },
      services: {
        basic: {
          url: function() {
            return '/basic';
          }
        },
        basicWithParam: {
          url: '/:param'
        },
        basicWithDefinition: {
          url: '/:fragment'
        },
        basicWithFunctionDefinition: {
          url: '/:fnFragment'
        },
        data: {
          url: '/data',
          type: 'POST',
          data: {
            hello: ':value',
            bonjour: 'monde'
          }
        },
        complexData: {
          url: '/:fragment2',
          type: 'POST',
          data: {
            bonjour: ':value'
          }
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

    it('should be possible to solve default parameters.', function(done) {
      client.basicWithDefinition(function(err, data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should be possible to solve function definitions.', function(done) {
      client.basicWithFunctionDefinition(function(err, data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });

    it('should be possible to solve recursive objects.', function(done) {
      client.data(function(err, data) {
        assert.deepEqual(data, {hello: 'world', bonjour: 'monde'});
        done();
      });
    });

    it('should be possible to solve both parameters and definitions.', function(done) {
      client.complexData(function(err, data) {
        assert.deepEqual(data, {bonjour: 'world'});
        done();
      });
    });

    it('should not solve unfound parameters.', function(done) {
      var specialClient = new Client({
        defaults: {
          params: {
            fragment: 'basic'
          }
        },
        services: {
          basic: {
            url: 'http://localhost:7337/:fragment'
          }
        }
      });

      specialClient.basic(function(err, data) {
        assert.deepEqual(data, {hello: 'world'});
        done();
      });
    });
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
