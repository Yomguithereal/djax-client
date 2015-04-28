/**
 * Djax Services Client Unit Testing
 * ==================================
 *
 */
import assert from 'assert';
import Client from '../djax-client.js';

describe('Client', function() {

  describe('API', function() {
    var client = new Client({
      services: {
        basic: {
          url: 'http://localhost:7337/basic'
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
      client.basic(function(data) {
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
  });
});
