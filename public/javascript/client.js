"use strict"

var socket = io.connect();

createjs.Sound.setMute(false);
createjs.Sound.registerSound("/sounds/bomb.mp3|/sounds/bomb.ogg", "boom");
createjs.Sound.registerSound("/sounds/tick.mp3|/sounds/tick.ogg", "tick");
createjs.Sound.registerSound("/sounds/click.mp3|/sounds/click.ogg", "click");


var tickloopSound = createjs.Sound.createInstance("tick");
tickloopSound.addEventListener("complete", function (event) {
    tickloopSound.play();
});
tickloopSound.setMute(false);
tickloopSound.volume = 0.5;

var clickSound = createjs.Sound.createInstance("click");
clickSound.setMute(false);
clickSound.volume = 0.5;

function gotBomb() {
  tickloopSound.play();
  $(".bomb").show();
  $(".nobomb").hide();
  $(".button_active").show();
  $(".button_inactive").hide();
};

function lostBomb() {
  tickloopSound.pause();
  $(".bomb").hide()
  $(".nobomb").show()
  $(".button_active").hide()
  $(".button_inactive").show()
};

function registerName() {
  $("#login_overlay").fadeOut();
  socket.emit('register', { name: $(".loginname").val() , email: "franz@aol.de"} );
  console.log($(".loginname").val());
}

function throwBomb() {
  clickSound.play();
  socket.emit('throwBomb');
  console.log('sent throwBomb')
}

socket.on('explodeBomb', function (data) {
  console.log("Explodiere!");
  var instance = createjs.Sound.play("boom");
  instance.setMute(false);
  instance.volume = 0.5;
  lostBomb();
});

socket.on('info', function (data) {
  console.log("Players/Connections: " + data.players_cnt + "/" + data.connections_cnt + ", Bombs: " + data.bombs_cnt + ", TTL: " + data.bombs_ttl + ", Holder: " + data.bomb_holder);
  $("#stats .player p").text(data.connections_cnt);
  $("#stats .bomb p").text(data.bombs_cnt);
  $("#content .nobomb p").text(data.bomb_holder + " has the bomb");
});

socket.on('lostBomb', function () {
  lostBomb();
});

socket.on('caughtBomb', function () {
  gotBomb();
});

socket.on('roundEnd', function (data) {
  for (var i = 0; i < data.length; i++) {
    var content = "<tr><td>" + data[i].pos + "</td><td>" + data[i].name  + "</td><td>" + data[i].score + "</td></tr>";
    $("#score_overlay p").text(data[data.length-1].name + " got bombed!!!");
    $("#score_overlay table").append(content);
  }
  
   $("#score_overlay").show();
});

$(document).ready( function() {
  $(".button_active").click( function() {
    throwBomb();
  });
  
  $(".bomb").click( function() {
    throwBomb();
  });
  
  $("#login_overlay").on('keydown',"input.loginname", function (e) {
    if (e.keyCode == 13) {
      registerName();
    }
  });

  $(".submit").click( function() {
    clickSound.play();
    registerName();
  });

  $(document).bind('keyup', function(e) {
    if (e.keyCode == 32) {
      throwBomb();
    }
  });

});