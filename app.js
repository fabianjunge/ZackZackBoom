
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

  // create bomb if more then two players are connected and we don't have one already
  if(connections.length > 1 && bombs.length == 0) {
    var ttl = 20 //Math.floor(Math.random()*100)
    bombs.push({id: bombs.length, ttl: ttl, handlerId: socket.id })
    socket.emit('caughtBomb');
  } else {
    socket.emit('lostBomb');
  }

  socket.on('disconnect', function () {
    for (var i = 0; i < connections.length; i++) {
      //console.log(socket);
      if (socket.id == connections[i].id) {
        connections.splice(i, 1);
        console.log("disconnect " + socket.id );
      }
    }
  });

  socket.on('throwBomb', function () {
    console.log("throwBomb " + socket.id );
    var victim = getRandomConnectionExceptMe(socket);
    bombs[0].handlerId = victim.id;
    victim.emit('caughtBomb');
    socket.emit('lostBomb');
  });
});

setInterval(function(){
  // calculate bomb ttl
  var bomb_ttl = -1;
  var bomb_holder = "none";
  if(bombs.length > 0) {
    bombs[0].ttl = bombs[0].ttl - 1;
    bomb_ttl = bombs[0].ttl;
    bomb_holder = bombs[0].handlerId;
  }
  // inform all clients about game state
  for (var i = 0; i < connections.length; i++) {
    connections[i].emit('info', { connections_cnt: connections.length, bombs_cnt: bombs.length, bombs_ttl: bomb_ttl, bomb_holder: bomb_holder});
  }
  // check if bomb goes boooooooom!
  if(bombs.length > 0 && bombs[0].ttl < 1) {
    getSocketById(bombs[0].handlerId).emit('explodeBomb');
    bombs.pop();
  }
}, 1000);

var getSocketNrById = function(id) {
  for (var i = 0; i < connections.length; i++) {
    if(id == connections[i].id) {
      return i;
    }
  }
}

var getSocketById = function(id) {
  return connections[getSocketNrById(id)];
}

var getRandomConnectionExceptMe = function(socket) {
  var victim_nr = randomFromMinMax(0,(connections.length - 1) - 1);
  var myNr = getSocketNrById(socket.id);
  console.log('myNr: ' + myNr);
  if (victim_nr >= myNr) { victim_nr = victim_nr + 1;};
  console.log('victim_nr: ' + victim_nr);
  //var newArray = getConnectionsWithoutMe(socket);
  return connections[victim_nr];
}

var getConnectionsWithoutMe = function(my_socket) {
  var nr = getSocketNrById(my_socket.id);
  return connections.slice(0,nr).concat(connections.slice(nr,-1));
}

var randomFromMinMax = function(min, max) {
  var delta = (max - min) + 1;
  return Math.floor(Math.random() * delta) + min;
}

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
