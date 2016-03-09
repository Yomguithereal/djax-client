/**
 * Dummy API for Unit Tests
 * =========================
 *
 */
var express = require('express'),
    bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Static
app.use('/static', express.static(__dirname));

// Basic rout
app.get('/basic', function(req, res) {
  return res.json({hello: 'world'});
});

// Basic rout
app.get('/basic2', function(req, res) {
  return res.json({hello: 'again'});
});

app.post('/data', function(req, res) {
  return res.json(req.body);
});

module.exports = app;
