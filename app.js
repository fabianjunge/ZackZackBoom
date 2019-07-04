'use strict';

var express = require('express');
var socketIO = require('socket.io');
var routes = require('./routes');
var _ = require('underscore');

var PORT = process.env.PORT || 3000;

var server = express()
  .use(express.static(__dirname + '/public'))
  .set('view engine', 'jade')
  .set('views', __dirname + '/views')
  .get('/', routes.index)
  .get('/intro', routes.intro)
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

var io = socketIO(server);

var connections = [];
var players = [];
var bombs = [];

class Player {
  constructor(name, email, socket) {
    this.name = name;
    this.email = email;
    this.socket = socket;
    this.score = 0;
    this.state = 'ready';
  }
  addScore(amount) {
    this.score = this.score + amount;
  }
  lost() {
    this.score = this.score - 20;
  }
  setReady() {
    this.state = 'ready';
  }
  setPlaying() {
    this.state = 'playing';
  }
  setUnready() {
    this.state = 'unready';
  }
  isReady() {
    return this.state === 'ready';
  }
}

io.sockets.on('connection', function (socket) {
  connections.push(socket);

  // handle disconnects
  socket.on('disconnect', function () {
    removePlayerBySocketId(socket.id);
    removeConnectionById(socket.id);
    console.log("disconnect " + socket.id );
  });

  // register players, if the player is not already registered
  socket.on('register', function (data) {
    var player = getPlayerBySocket(socket);
    if (player === undefined) {
      player = new Player(data.name, data.email, socket)
      players.push(player);
      console.log("socket " + player.socket.id + " registered as " + player.name + "(" + player.email + ")")
    } else {
      console.log("player " + player.name + "(" + player.email + ")" + " is already registered with socket " + player.socket.id)
    }

    // initialize client
    socket.emit('lostBomb');

    // maybe start a round?
    startRound();

  });

  // process playerReady messages
  socket.on('playerReady', function () {
    var player = getPlayerBySocket(socket);
    if(player === undefined) {
      console.log("Player has to register first! (" + socket.id + ")");
      socket.emit('requestRegistration');
    } else {
      player.setReady();
      // maybe start a round?
      startRound();
    }
  });

  // process bomb throws
  socket.on('throwBomb', function () {
    console.log("throwBomb " + socket.id );
    moveBombAwayFrom(socket);
  });

});

setInterval(() =>{
  // calculate bomb ttl
  var bomb_ttl = -1;
  var bomb_holder_name = "none";
  if(bombs.length > 0) {
    bombs[0].ttl = bombs[0].ttl - 1;
    bomb_ttl = bombs[0].ttl;
    var socket = getSocketById(bombs[0].handlerId);
    if (socket == undefined) {
      bomb_holder_name = undefined;
    } else {
      var bomb_holder = getPlayerBySocket(socket);
      if (bomb_holder !== undefined) {
        // add score to player
        bomb_holder.addScore(1);
        bomb_holder_name = bomb_holder.name;
      } else {
        bomb_holder_name = undefined;
      }
    }
  }
  // inform all players about game state
  sendAllPlayers('info',
    {
      players_cnt: players.length,
      ready_players_cnt: readyPlayers().length,
      connections_cnt: connections.length,
      bombs_cnt: bombs.length,
      bombs_ttl: bomb_ttl,
      bomb_holder: bomb_holder_name
    }
  );

  // check if bomb goes boooooooom!
  checkBomb();
}, 1000);

var startRound = () => {
  console.log(readyPlayers().length);
  // create bomb if more then two players are registered and we don't have a bomb already
  if(readyPlayers().length > 1 && bombs.length == 0) {
    var ttl = randomFromMinMax(10, 18);
    // create bomb and give to random player
    var player = readyPlayers()[randomFromMinMax(0,readyPlayers().length-1)];
    bombs.push({id: bombs.length, ttl: ttl, handlerId: player.socket.id})
    player.socket.emit('caughtBomb');
  } else {
    console.log('Waiting for second player...');
  }
}

var readyPlayers = () => {
  return _.filter(players, (pl) => {
    return pl.isReady();
  });
}

var sendAllPlayers = (command, data) => {
  for (var i = 0; i < players.length; i++) {
    players[i].socket.emit(command, data);
  }
}

var checkBomb = () => {
  if(bombs.length > 0 && bombs[0].ttl < 1) {
    var socket = getSocketById(bombs[0].handlerId)
    if (socket !== undefined) {
      socket.emit('explodeBomb');
    }
    bombs.pop();
    console.log("Bomb explodes!");
    if (bombs.length < 1) {
      var looser = getPlayerBySocket(socket);
      var looser_name = undefined;
      if (looser !== undefined) {
        looser.lost();
        looser_name = looser.name;
      }
      console.log('Round ended!');
      sendAllPlayers('roundEnd', getGameStats());
      _.forEach(readyPlayers(), function (pl) {
        pl.setUnready();
      });
    }
  }
}

var getGameStats = () => {
  var sortedList = _.sortBy(readyPlayers(), (pl) => {
    return pl.score * -1;
  });
  var pos = 0;
  var gameStatsArray = _.map(sortedList, function (pl) {
    pos = pos + 1;
    return { pos: pos, name: pl.name , score: pl.score };
  });
  return gameStatsArray;
}

var moveBombAwayFrom = (socket) => {
  if (bombs.length < 1) {
    console.log("No Bomb in the game!")
    return;
  }
  if (socket === undefined) {
    console.log("Given socket was undefined!")
    return;
  }
  console.log("Try to move Bomb away from " + getPlayerNameBySocket(socket));
  if (bombs[0].handlerId !== socket.id) {
    console.log(getPlayerNameBySocket(socket) + " doesn't possess the bomb!");
    return;
  }
  var victim = getRandomPlayerExceptMe(socket);
  bombs[0].handlerId = victim.socket.id;
  socket.emit('lostBomb');
  victim.socket.emit('caughtBomb');
  sendAllPlayers('bombMoved', {bomb_holder: victim.name});
}

var removePlayerBySocketId = (id) => {
  var pNr = getPlayerNrById(id);
  if (pNr !== undefined) {
    // check if Player has bomb, if so move it
    if (bombs.length > 0 && bombs[0].handlerId === id) {
      moveBombAwayFrom(getSocketById(id));
    }
    var player = players[pNr];
    players.splice(pNr,1);
    console.log('Player "' + player.name + '" was removed.');
  }
}

var removeConnectionById = (id) => {
  var sNr = getSocketNrById(id);
  if (sNr !== undefined) {
    connections.splice(sNr,1);
    console.log('Connection "' + id + '" was removed.');
  }
}

var getPlayerBySocket = (socket) => {
  if (socket === undefined) return undefined;
  return players[getPlayerNrById(socket.id)];
}

var getPlayerNameBySocket = (socket) => {
  var pl = getPlayerBySocket(socket);
  if (pl !== undefined) return pl.name;
}

var getPlayerNrById = (id) => {
  console.log("getPlayerNrById(" + id + ")")
  for (var i = 0; i < players.length; i++) {
    if(id == players[i].socket.id) {
      return i;
    }
  }
}

var getSocketNrById = (id) => {
  for (var i = 0; i < connections.length; i++) {
    if(id == connections[i].id) {
      return i;
    }
  }
}

var getSocketById = (id) => {
  return connections[getSocketNrById(id)];
}

var getRandomPlayerExceptMe = (socket) => {
  var victim_nr = randomFromMinMax(0,(readyPlayers().length - 1) - 1);
  var myNr = getPlayerNrById(socket.id);
  console.log('myNr: ' + myNr);
  if (readyPlayers().length > 1 && victim_nr >= myNr) { victim_nr = victim_nr + 1;};
  console.log('victim_nr: ' + victim_nr);
  return readyPlayers()[victim_nr];
}

var randomFromMinMax = (min, max) => {
  var delta = (max - min) + 1;
  return Math.floor(Math.random() * delta) + min;
}

