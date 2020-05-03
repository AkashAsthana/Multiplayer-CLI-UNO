/* eslint-disable no-redeclare */
/* eslint-disable semi */
/* eslint-disable eqeqeq */
const http = require('http').createServer();
const io = require('socket.io')(http);
const port = process.env.PORT || 5000;
const chalk = require('chalk');

var cards = require('./utilityFunctions.js').cards;
var restoreCard = require('./utilityFunctions.js').restoreCard;
var randomStr = require('./utilityFunctions.js').randomStr;
var getDrawPile = require('./utilityFunctions.js').getDrawPile;
var rooms = [];
var users = {};

// var warning = chalk.bold.red
// var textMessage = chalk.bold.blackBright
// var chat = chalk.bgBlack;

function findRoomById (id) {
  var room = users[id].room;
  return room;
}

async function findPlayerById (id, index) {
  for (var i = 0; i < rooms[index].players.length; i++) {
    if (rooms[index].players[i].id == id) {
      return rooms[index].players[i];
    }
  }
}

async function checkIfRoomExist (room) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].id == room) {
      return true;
    }
  }
  return false;
}

function getRoomVariables (room) {
  for (var i = 0; i < rooms.length; i++) {
    if (rooms[i].id == room) {
      return i;
    }
  }
  return null;
}

async function getPlayerByName (name, index) {
  for (var i = 0; i < rooms[index].names.length; i++) {
    if (rooms[index].names[i] == name) {
      return i;
    }
  }
}

io.on('connection', (socket) => {
  console.log(chalk.green('connected'));

  socket.on('text', (data) => {
    var room = findRoomById(socket.id);
    socket.in(room).emit('chat', data)
  });

  socket.on('pick', (object) => {
    draw(object);
  })

  socket.on('error', (error) => {
    console.log('===========================================')
    console.log(error)
    console.log('===========================================')
  })

  // socket.on('disconnect', (data) => {
  //   // rooms[0].players.forEach((player) => {
  //   //   // player.disconnect(true);
  //   //   player.disconnect();
  //   // })
  //   // socket.close();
  //   // socket._onDisconect();
  //   socket.emit('close');
  //   socket.disconnect(true);

  //   console.log('======================')
  //   // socket = undefined;
  //   console.log(data)
  // })

  async function draw (object) {
    var arr = [];
    var num = object.num;
    var room = findRoomById(object.id);
    var index = await getRoomVariables(room);
    var playerNo = await getPlayerByName(users[object.id].name, index);
    console.log('playerNo is ' + playerNo)

    if (playerNo == rooms[index].turn) {
      for (var i = 0; i < num; i++) {
        console.log('picked')
        arr.push(rooms[index].drawPile.pop());
      }
      socket.emit('pickListener', arr);

      var nextInd = await nextTurnIndex(index);
      console.log('NextInd is :' + nextInd, index);
      console.log('------------------------------------------')
      rooms[index].players[rooms[index].turn].broadcast.to(rooms[index].id).emit(
        'text', `${rooms[index].names[rooms[index].turn]} has drawn a card.`);
    } else {
      rooms[index].players[playerNo].emit('text', 'Wait for your turn')
    }
  }

  socket.on('getCards', (evt) => {
    console.log('get cards me');
    getCards(evt);
  });

  async function getCards (evt) {
    if ((evt.room == '') || (evt.room != '' && await checkIfRoomExist(evt.room))) {
      console.log('if me aa gye')
      var room = findRoomById(evt.id);
      var index = getRoomVariables(room);
      console.log('INDEX : ' + index)
      for (var i = 0; i < evt.cards.length; i++) {
        rooms[index].playerCards.push(evt.cards[i]);
      }

      if (rooms[index].playerCards.length == (7 * rooms[index].noOfPlayers)) {
        rooms[index].drawPile = getDrawPile(rooms[index].playerCards);
        rooms[index].currentCard = rooms[index].drawPile[rooms[index].drawPile.length - 1];

        if (rooms[index].currentCard.power == 'SKIP' ||
            rooms[index].currentCard.power == 'REVERSE' ||
            rooms[index].currentCard.power == 'DRAW 2' ||
            rooms[index].currentCard.power == 'WILD DRAW 4') {
          for (var i = rooms[index].drawPile.length - 1; i >= 0; i--) {
            if (rooms[index].drawPile[i].power == '' || rooms[index].drawPile[i].power == 'WILD') {
              var swapVar = rooms[index].drawPile[i];
              rooms[index].drawPile[i] = rooms[index].drawPile[rooms[index].drawPile.length - 1];
              rooms[index].drawPile[rooms[index].drawPile.length - 1] = swapVar;
              rooms[index].currentCard = rooms[index].drawPile.pop();
              io.sockets.in(rooms[index].id).emit('currentCard', rooms[index].currentCard);
              rooms[index].players[0].emit('text', 'It is your turn');
              break;
            }
          }
        } else {
          console.log('came here 2')
          rooms[index].currentCard = rooms[index].drawPile.pop();
          io.sockets.in(rooms[index].id).emit('currentCard', rooms[index].currentCard);
          rooms[index].players[0].emit('text', 'It is your turn');
        }
      }
    } else {
      socket.emit('text', 'No such room exist, press ctrl + c, check your room id and try again');
    }
  }

  socket.on('room', (obj) => {
    joinRoom(obj);
  });

  async function joinRoom (obj) {
    var { id, room, username, noOfPlayers } = obj;
    var index = getRoomVariables(room);

    if (room == '') {
      console.log('rooms me 1')
      room = randomStr();
      socket.room = room;
      socket.join(socket.room);
      users[id] = { room: room, name: username };
      var roomVariables = {};
      roomVariables.id = room;
      roomVariables.drawPile = [];
      roomVariables.drawPile = JSON.parse(JSON.stringify(cards));
      roomVariables.discardPile = [];
      roomVariables.playerCards = [];
      roomVariables.names = [];
      roomVariables.players = [];
      roomVariables.currentCard = '';
      roomVariables.direction = true;// true means normal, false means reverse
      roomVariables.noOfPlayers = Number(noOfPlayers);
      roomVariables.names.push(username);
      roomVariables.players.push(socket);
      roomVariables.turn = 0;
      rooms.push(roomVariables);
      socket.emit('text', `The room id is ${socket.room} `);
    } else if (room != '' && !(await checkIfRoomExist(room))) {
      socket.emit('text', 'Invalid room ID');
    } else if (room != '' && (await checkIfRoomExist(room)) && rooms[index].noOfPlayers > rooms[index].players.length) {
      users[id] = { room: room, name: username };
      socket.join(room);
      rooms[index].names.push(username);
      rooms[index].players.push(socket);
    }
  }

  socket.on('pass', (id) => {
    console.log('pass me aa gye')
    var room = users[id].room;
    var index = getRoomVariables(room);
    console.log('turn before : ' + rooms[index].turn);
    nextTurn(index);
    console.log('turn after :' + rooms[index].turn);
    rooms[index].players[rooms[index].turn].emit('text', 'Its your turn now');
  })

  // socket.on('opponentDeckSize', (id) => {
  //   var room = findRoomById(id);
  //   var index = getRoomVariables(room);
  //   if (id === rooms[index].players[1].id) {
  //     var msg = `Your opponent has ${rooms[index].players[0].cards.length} cards left`
  //     // rooms[index].players[1].emit("text",msg);
  //     rooms[index].players[1].emit('text', msg);
  //   } else {
  //     var msg = `Your opponent has ${rooms[index].players[1].cards.length} cards left`
  //     rooms[index].players[0].emit('text', msg);
  //   }
  // });

  socket.on('disconnect', function () {
    socket.leave(socket.room)
    console.log('user disconnected');
  });

  socket.on('playTurn', (evt) => {
    playTurnMain(evt, socket);
  })
});

io.on('disconnect', (evt) => {
  console.log('disconnected')
})
http.listen(port, () => console.log(`server listening on port: ${port}`));

async function playTurnMain (evt, socket) {
  var room = findRoomById(evt.id);
  var index = getRoomVariables(room);

  if (await checkCard(evt, socket)) {
    io.sockets.to(rooms[index].id).emit('resetDrawBool', true);
    var currentCard = await playTurn(evt, socket);
    io.sockets.to(rooms[index].id).emit('currentCard', currentCard);
    io.sockets.to(rooms[index].id).emit('text', '------------------------------------------');
  }
}

function broadcastInfo (socket, msg, room) {
  socket.broadcast.in(room).emit('text', msg);
}

async function checkCard (evt, socket) {
  var room = findRoomById(evt.id);
  var index = getRoomVariables(room);
  var card = await restoreCard(evt.card);
  var bool = false;
  if ((card.power != '' && card.power == rooms[index].currentCard.power) ||
        (card.color != '' && card.color == rooms[index].currentCard.color) ||
        (card.number != '' && card.number == rooms[index].currentCard.number)) {
    bool = true;
  } else if (rooms[index].currentCard.power == 'WILD DRAW 4' || rooms[index].currentCard.power == 'WILD') {
    bool = true;
  } else if (card.power == 'WILD DRAW 4' || card.power == 'WILD') {
    bool = true;
  } else {
    socket.emit('restoreCard', card.id);
    bool = false;
  }

  if (bool) {
    return bool;
  } else {
    socket.emit('text', 'Invalid card');
    return bool;
  }
}

async function didWrongPlayerPlayTurn (wrongPlayerPlayed, evt, index) {
  var currentPlayer = rooms[index].players[rooms[index].turn];
  if (currentPlayer.id != evt.id) {
    console.log('currentPlayer id was not correct')
    wrongPlayerPlayed = false;
    var playerWhoPlayedTurn = await findPlayerById(evt.id, index);
    playerWhoPlayedTurn.emit('restoreCard', evt.card);
    playerWhoPlayedTurn.emit('text', 'Not your turn!');
  } else {
    console.log('currentPLayer id was correct')
    wrongPlayerPlayed = true;
  }

  return wrongPlayerPlayed;
}

async function nextTurn (index) {
  if (rooms[index].direction == true) {
    rooms[index].turn = (rooms[index].turn + 1) % rooms[index].noOfPlayers;
  } else {
    rooms[index].turn = (rooms[index].turn - 1 + rooms[index].noOfPlayers) % rooms[index].noOfPlayers;
  }
}

async function nextTurnIndex (index) {
  if (rooms[index].direction == true) {
    return (rooms[index].turn + 1) % rooms[index].noOfPlayers;
  } else {
    return (rooms[index].noOfPlayers + rooms[index].turn - 1) % rooms[index].noOfPlayers;
  }
}

async function applyPower (evt, index) {
  var card = await restoreCard(evt.card);
  var cardsToDraw = 0;

  if (card.power == 'SKIP') {
    var messageToSkippedPlayer = 'Your turn has been skipped!';
    var skippedPlayerInd = await nextTurnIndex(index);
    var skippedPlayer = rooms[index].players[skippedPlayerInd];
    skippedPlayer.emit('text', messageToSkippedPlayer);
    await nextTurn(index);
  } else if (card.power == 'REVERSE') {
    rooms[index].direction = !rooms[index].direction;
  } else if (card.power == 'DRAW 2') {
    cardsToDraw = 2;
  } else if (card.power == 'WILD DRAW 4') {
    cardsToDraw = 4;
  }

  return cardsToDraw;
}

async function playTurn (evt) {
  var wrongPlayerPlayed = true;
  var room = findRoomById(evt.id);
  var index = getRoomVariables(room);
  wrongPlayerPlayed = await didWrongPlayerPlayTurn(wrongPlayerPlayed, evt, index);
  var currentPlayer = rooms[index].players[rooms[index].turn];

  if (wrongPlayerPlayed) { // change the name to correctPlayerPlayed
    if (evt.len == 0) {
      currentPlayer.emit('text', 'You won!!');
      broadcastInfo(currentPlayer, 'You Lost!!', room);
    } else if (evt.len == 1) {
      broadcastInfo(currentPlayer, `${evt.name} has only 1 card left!!`, room);
    }
    console.log('sahi player')
    var card = await restoreCard(evt.card);
    rooms[index].currentCard = card;
    rooms[index].discardPile.push(card);
    var cardsToDraw = await applyPower(evt, index);

    if (cardsToDraw != 0) {
      var nextTurnInd = await nextTurnIndex(index);
      var msgToOpponent = `${evt.name} threw ${evt.card} card\nIt's your turn now` +
                `and you have to draw ${cardsToDraw} cards from the draw pile.`;
      rooms[index].players[nextTurnInd].emit('text', msgToOpponent);
      // broadcastInfo()
      await nextTurn(index)
      setTimeout(() => {
        var arr = [];
        for (var i = 0; i < cardsToDraw; i++) {
          arr.push(rooms[index].drawPile.pop());
          if (rooms[index].drawPile.length == 0) {
            reInitializeDrawPile(index);
          }
          if (i == cardsToDraw - 1) {
            rooms[index].players[nextTurnInd].emit('pickListener', arr);
          }
        }
      }, 500);
    } else {
      var nextTurnInd = await nextTurnIndex(index);
      console.log('Next turn index is : ' + nextTurnInd)
      var msgToOpponent = `${evt.name} threw ${evt.card} card\nIt's your turn now`;
      rooms[index].players[nextTurnInd].emit('text', msgToOpponent);
      await nextTurn(index);
    }
  }
  return rooms[index].currentCard;
}

async function reInitializeDrawPile (index) {
// shuffle discard pile upto length-1 and make it the draw pile

  rooms[index].discardPile.pop();

  for (var i = rooms[index].discardPile.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = rooms[index].discardPile[i];
    rooms[index].discardPile[i] = rooms[index].discardPile[j];
    rooms[index].discardPile[j] = temp;
  }

  var discardPileDeepCopy = JSON.parse(JSON.stringify(rooms[index].discardPile));
  rooms[index].drawPile = discardPileDeepCopy;
  rooms[index].discardPile.splice(0, rooms[index].discardPile.length);// setting dscard pile to zero
}
