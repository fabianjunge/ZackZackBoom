var socket = io.connect('http://192.168.2.135:3000');
var tickloop;

function gotBomb() {
  tickloop = createjs.Sound.play("tick");
  tickloop.setMute(false);
  tickloop.volume = 0.5;
  tickloop.addEventListener("complete", function (event) {
      tickloop.play();
  });
  $(".bomb").show();
  $(".nobomb").hide();
  $(".button_active").show();
  $(".button_inactive").hide();
};

function lostBomb() {
  tickloop.removeAllEventListeners("complete");
  
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
createjs.Sound.registerSound("/sounds/tick.mp3", "tick");
createjs.Sound.registerSound("/sounds/tick.mp3", "tick");

$(document).ready( function() {
  $(".button_active").click( function() {
    var instance = createjs.Sound.play("tick");
    instance.setMute(false);
    instance.volume = 0.5;
    socket.emit('throwBomb');
    console.log('sent throwBomb')
  });
  
  $(".submit").click( function() {
    $(".login_overlay").fadeOut();
    socket.emit('register', { name: "Franz", email: "franz@aol.de"} );
  })
});