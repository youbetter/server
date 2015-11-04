var express = require('express');
var app = express();
var server;

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/static/html/start.html');
});

server = app.listen(process.env.PORT || 3000, function () {
    console.log('Server running on port ' + server.address().port);
});
