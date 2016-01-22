var express = require('express');

var app = express();

app.get('/', function(req, res) {
    res.send('hello world');
});

app.use(express.static('www'));

app.listen(process.env.PORT || 3000);
