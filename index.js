var app = require('koa')();
var router = require('koa-router')();
var sendfile = require('koa-sendfile');
var server;

router.get('/', function *(next) {
    console.log(__dirname + '/static/html/start.html');

    yield* sendfile.call(this, __dirname + '/static/html/start.html');
    
    if (!this.status) {
        this.throw(404);
    }
});

app
.use(router.routes())
.use(router.allowedMethods());

server = app.listen(process.env.PORT || 3000, function () {
    console.log('Server running on port ' + server.address().port);
});
