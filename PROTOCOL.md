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
This event is send to the client, if the time to life of the bomb is equil zero. The client loses the game.

This event has no data.
### caughtBomb ###
This event is send to the client, if the client get the bomb.

This event has no data.
### bombMoved ###
This event is broadcast to the clients, if the bomb has a new handler.

Example that Franz is poor player:
```
{bomb_holder: "Franz"}
```
### lostBomb ###
This event is send to the client, if the thowBomb event is approved.

This event has no data.
### roundEnd ###
This event is broadcast to the clients, if the game round ended.

Example that Franz is the poor one:
```
{bomb_holder: "Franz"}
```
## Client to Server ##

### register ###
This event is send to the server, if the client submit the player name.

Example that the player named Franz:
```
{ name: "Franz", email: "franz@aol.com" }
```
### playerReady ###
This event is send to the server, if the client is ready for the next round.

This event has no data.
### throwBomb ###
This event is send to the server, if the client trow the bomb away.

This event has no data.