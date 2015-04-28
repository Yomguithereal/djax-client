/**
 * Dummy API for Unit Tests
 * =========================
 *
 */
var express = require('express');

var app = express();

// Static
app.use('/static', express.static(__dirname));

// Basic rout
app.get('/basic', function(req, res) {
  return res.json({hello: 'world'});
});

module.exports = app;
