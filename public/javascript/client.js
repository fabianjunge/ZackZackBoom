var socket = io.connect('http://192.168.2.172:3000');

socket.on('bombe', function (data) {
  console.log("Explodiere!");
  var instance = createjs.Sound.play("boom");
  instance.setMute(false);
  instance.volume = 0.5;
})

socket.on('info', function (data) {
  console.log("Player: " + data.connections_cnt + ", Bombs: " + data.bombs_cnt);
  
  $("#stats .player p").text(data.connections_cnt);
  $("#stats .bomb p").text(data.bombs_cnt);
})

createjs.Sound.setMute(false);
createjs.Sound.registerSound("/sounds/bomb.mp3", "boom");

function booooom() {
  socket.emit('explodiere', { my: 'data' });
}

$(document).ready( function() {
  $(".button").click( function() {
    var instance = createjs.Sound.play("boom");
    instance.setMute(false);
    instance.volume = 0.5;
  });
});