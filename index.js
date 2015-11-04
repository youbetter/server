var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/html/start.html');
});

app.listen(process.env.PORT || 3000);
