
/**
 * Module dependencies.
 */

var express = require('express');
var app = express();
var routes = require('./routes');
var server = require('http').createServer(app);
var path = require('path');
var io = require('socket.io').listen(server);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.intro);
app.get('/index', routes.index);

// app.get('/socket', routes.socket);

var connections = [];
var bombs = [];

io.sockets.on('connection', function (socket) {
  connections.push(socket);
  
  setInterval(function(){
    socket.emit('info', { connections_cnt: connections.length, bombs_cnt: bombs.length});
  }, 2000);
  
  socket.on('explodiere', function (data) {
      // Broadcast explodiere
	  for (var i = 0; i < connections.length; i++) {
		  connections[i].emit('bombe', { hello: 'world' });
		  console.log("An Socket " + i + "gesendert, dass er explodieren soll.");
	  }
  });

  socket.on('disconnect', function () {
    for (var i = 0; i < connections.length; i++) {
      //console.log(socket);
      if (socket.id == connections[i].id) {
        connections.splice(i, 1);
        console.log("disconnect " + socket.id );
      }
    }
  });
});


server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
