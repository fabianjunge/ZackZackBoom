"use strict"

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

app.get('/', routes.index);
app.get('/index', routes.index);

// app.get('/socket', routes.socket);

var connections = [];
var players = [];
var bombs = [];

function Player(name, email, socket) {
  this.name = name;
  this.email = email;
  this.socket = socket;
}

io.sockets.on('connection', function (socket) {
  connections.push(socket);

  // handle disconnects
  socket.on('disconnect', function () {
    for (var i = 0; i < connections.length; i++) {
      //console.log(socket);
      if (socket.id == connections[i].id) {
        connections.splice(i, 1);
        console.log("disconnect " + socket.id );
      }
    }
  });

  // register players, if the player is not already registered
  socket.on('register', function (data) {
    player = getPlayerBySocket(socket);
    if (player === undefined) {
      player = new Player(data.name, data.email, socket)
      players.push(player);
      console.log("socket " + player.socket.id + " registered as " + player.name + "(" + player.email + ")")
    } else {
      console.log("player " + player.name + "(" + player.email + ")" + " is already registered with socket " + player.socket.id)
    }

    // create bomb if more then two players are registered and we don't have a bomb already
    if(players.length > 1 && bombs.length == 0) {
      var ttl = 20 //Math.floor(Math.random()*100)
      bombs.push({id: bombs.length, ttl: ttl, handlerId: socket.id})
      socket.emit('caughtBomb');
    } else {
      socket.emit('lostBomb');
    }
  });

  // process bomb throws
  socket.on('throwBomb', function () {
    console.log("throwBomb " + socket.id );
    var victim = getRandomPlayerExceptMe(socket);
    bombs[0].handlerId = victim.socket.id;
    victim.socket.emit('caughtBomb');
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
    console.log("bombs[0].handlerId: " + bombs[0].handlerId);
    console.log("getSocketById(bombs[0].handlerId): " + getSocketById(bombs[0].handlerId));
    console.log("getPlayerBySocket: " + getPlayerBySocket(getSocketById(bombs[0].handlerId)));
    bomb_holder = getPlayerBySocket(getSocketById(bombs[0].handlerId)).name;
    //bomb_holder = bombs[0].handlerId;
  }
  // inform all players about game state
  for (var i = 0; i < players.length; i++) {
    players[i].socket.emit('info', { players_cnt: players.length, connections_cnt: connections.length, bombs_cnt: bombs.length, bombs_ttl: bomb_ttl, bomb_holder: bomb_holder});
  }
  // check if bomb goes boooooooom!
  if(bombs.length > 0 && bombs[0].ttl < 1) {
    getSocketById(bombs[0].handlerId).emit('explodeBomb');
    bombs.pop();
  }
}, 1000);

var getPlayerBySocket = function(socket) {
  return players[getPlayerNrById(socket.id)];
}

var getPlayerNrById = function(id) {
  console.log("getPlayerNrById(" + id + ")")
  for (var i = 0; i < players.length; i++) {
    if(id == players[i].socket.id) {
      return i;
    }
  }
}

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

var getRandomPlayerExceptMe = function(socket) {
  var victim_nr = randomFromMinMax(0,(players.length - 1) - 1);
  var myNr = getPlayerNrById(socket.id);
  console.log('myNr: ' + myNr);
  if (victim_nr >= myNr) { victim_nr = victim_nr + 1;};
  console.log('victim_nr: ' + victim_nr);
  return players[victim_nr];
}

var randomFromMinMax = function(min, max) {
  var delta = (max - min) + 1;
  return Math.floor(Math.random() * delta) + min;
}

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
