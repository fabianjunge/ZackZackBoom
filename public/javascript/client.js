var socket = io.connect();

createjs.Sound.setMute(false);
createjs.Sound.registerSound("/sounds/bomb.mp3", "boom");
createjs.Sound.registerSound("/sounds/tick.mp3", "tick");

var tickloop = createjs.Sound.play("tick");

function gotBomb() {
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
  tickloop.removeEventListener("complete");
  
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

$(document).ready( function() {
  $(".button_active").click( function() {
    var instance = createjs.Sound.play("tick");
    instance.setMute(false);
    instance.volume = 0.5;
    socket.emit('throwBomb');
    console.log('sent throwBomb')
  });
  
  $(".submit").click( function() {
    $("#login_overlay").fadeOut();
    socket.emit('register', { name: $(".loginname").val() , email: "franz@aol.de"} );
    console.log($(".loginname").val());
  })
});