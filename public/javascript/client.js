var socket = io.connect('http://localhost:3000');

function gotBomb() {
  $(".bomb").show();
  $(".nobomb").hide();
  $(".button_active").show();
  $(".button_inactive").hide();
};

function lostBomb() {
  $(".bomb").hide()
  $(".nobomb").show()
  $(".button_active").hide()
  $(".button_inactive").show()
};

socket.on('explodeBomb', function (data) {
  console.log("Explodiere!");
  var instance = createjs.Sound.play("boom");
  instance.setMute(false);
  instance.volume = 0.5;
  lostBomb();
  alert("You've got bombed!!!")
});

socket.on('info', function (data) {
  console.log("Player: " + data.connections_cnt + ", Bombs: " + data.bombs_cnt + ", TTL: " + data.bombs_ttl + ", Holder: " + data.bomb_holder);
  $("#stats .player p").text(data.connections_cnt);
  $("#stats .bomb p").text(data.bombs_cnt);
});

socket.on('lostBomb', function () {
  lostBomb();
});

socket.on('caughtBomb', function () {
  gotBomb();
});

createjs.Sound.setMute(false);
createjs.Sound.registerSound("/sounds/bomb.mp3", "boom");

$(document).ready( function() {
  $(".button_active").click( function() {
    //var instance = createjs.Sound.play("boom");
    //instance.setMute(false);
    //instance.volume = 0.5;
    socket.emit('throwBomb');
    console.log('sent throwBomb')
  });
});