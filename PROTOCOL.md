# Protocol for ZackZackBoom #

The protocol is implement with Socket.io.  

## Server to Client ##

### info ###
This event is broadcast to the clients, every 1s and contains various game information.

Example with three players, two ready players, five connected clients, one bomb in game and the holder of the bomb is Franz:
```
{ players_cnt: 3, ready_players_cnt: 2, connections_cnt: 5, bombs_cnt: 1, bomb_holder: "Franz" }
```
### explodeBomb ###
This event is send to the client, if the time to live value of the bomb equals zero. The client loses the game.

This event has no additional data object attached.

### caughtBomb ###
This event is send to the client, if the client got the bomb.

This event has no additional data object attached.

### bombMoved ###
This event is broadcast to all players, if the bomb was passed on to another player.

Example where Franz is the poor player whos turn it is to hold the bomb, now:
```
{bomb_holder: "Franz"}
```
### lostBomb ###
If the Server got a "throwBomb" event it responses with a "lostBomb" event to signal the client that the bomb could be moved and that the player no longer is in possesion of the bomb.

This event has no additional data object attached.

### roundEnd ###
This event is broadcast to the clients after the bomb went off and the game round ended.

The data object contians information about the game state. It consists of an array with result object of the following form
```
{ pos: PLAYER_POSITON, name: PLAYER_NAME , score: PLAYER_SCORE }
```
where pos is the rank of the player, name is the player name and score. The objects in the array are already sorted from 1st to last rank.

## Client to Server ##

### register ###
This event is send to the server to register a name for the player.

An example for player named Franz:
```
{ name: "Franz", email: "franz@aol.com" }
```
The email value is optional and not used, yet...

### playerReady ###
This event is send to the server to signal that the player is ready for the next round.

This event has no additional data object attached.

### throwBomb ###
This event is send to the server to signal the request to pass the bomb to another player.

This event has no additional data object attached.
