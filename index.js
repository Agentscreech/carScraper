var db = require('./models');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname + '/static/')));


//root route and server port
app.get('/*', function(req, res) {
  res.sendFile(path.join(__dirname, 'static/index.html'));
});
var server = app.listen((process.env.PORT || 1337), function(){
  console.log('listening on 1337');
});
