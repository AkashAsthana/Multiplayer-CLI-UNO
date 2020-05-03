/* eslint-disable eqeqeq */
/* eslint-disable semi */
var socket = require('socket.io-client')('https://uno-on-terminal.herokuapp.com/');
const repl = require('repl');
const chalk = require('chalk');
const { program } = require('commander');

var cards = require('./utilityFunctions.js').cards;
var restoreCard = require('./utilityFunctions.js').restoreCard;
var removeCard = require('./utilityFunctions.js').removeCard;
var displayCards = require('./utilityFunctions.js').displayCards;
var distributeCards = require('./utilityFunctions.js').distributeCards;
const warning = chalk.bold.red;
const mesg = chalk.bold.blue;
var didPlayerDrawCard = 0;

program
  .requiredOption('-u, --username <string>', '')
  .option('-n, --no <number>', 2)
  .option('-r, --room <number>', '');

// when client enter wrong room name the  the server crashes, fix that so that only client crashes or send them a warning of wrong room id
// ============================================================

socket.on('disconnect', () => {
  socket.emit('disconnect');
});

socket.on('connect', () => {
  var room = '';
  var noOfPlayers = 2;
  program.parse(process.argv);

  if (program.no) {
    noOfPlayers = program.no;
  }
  if (program.room) {
    room = program.room;
  }

  if (noOfPlayers > 7) {
    console.log(warning('Number of players cannot be more than 7!'));
  } else {
    socket.room = room;
    socket.username = program.username;
    socket.noOfPlayers = noOfPlayers;
    var obj = { id: socket.id, room: socket.room, username: socket.username, noOfPlayers: noOfPlayers };
    socket.emit('room', obj);
    socket.cards = distributeCards(cards);
    var evt = { cards: socket.cards, id: socket.id, room: room };
    socket.emit('getCards', evt);
    console.log(chalk.bold.cyan('=== Start Playing ==='));
  }
});

socket.on('text', (message) => {
  console.log(warning(message));
});

socket.on('currentCard', (card) => {
  if (card.color == 'RED') {
    console.log(chalk.bold.whiteBright('Current Card is : ') + chalk.bold.redBright(card.id))
  } else if (card.color == 'YELLOW') {
    console.log(chalk.bold.whiteBright('Current Card is : ') + chalk.bold.yellowBright(card.id))
  } else if (card.color == 'BLUE') {
    console.log(chalk.bold.whiteBright('Current Card is : ') + chalk.bold.blueBright(card.id))
  } else if (card.color == 'GREEN') {
    console.log(chalk.bold.whiteBright('Current Card is : ') + chalk.bold.greenBright(card.id))
  } else {
    console.log(chalk.bold.whiteBright('Current Card is : ') + chalk.bold.whiteBright(card.id))
  }
})

socket.on('playTurn', (msg) => {
  console.log(mesg(msg));
})

socket.on('pickListener', (arr) => {
  // try deep copy by jsonparse and jsonstringify instead of concat
  socket.cards = socket.cards.concat(arr);
  console.log(chalk.red('Drawn cards are :'));
  displayCards(arr);
});

socket.on('chat', (data) => {
  console.log(chalk.bold.greenBright('> ') + chalk.green(data.username + ': ' + data.cmd.split('\n')[0]));
});

socket.on('restoreCard', (cardId) => {
  restoreCardListener(cardId);
});

socket.on('resetDrawBool', (bool) => {
  didPlayerDrawCard = 0;
})

async function restoreCardListener (cardId) {
  var card = await restoreCard(cardId);
  socket.cards.push(card);
}

socket.on('close', () => {
  socket.disconnect(true)
})

function contains (cards, card) {
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].id == card) {
      return true;
    }
  }
  return false;
}

repl.start({
  prompt: '',
  eval: (cmd) => {
    var playerData = {
      cmd: cmd,
      cards: socket.cards,
      username: socket.username,
      id: socket.id
    }
    var res = cmd.replace('\n', '');
    var result = res.split(' ');

    if (result[0] === 'throw') {
      result = result.join();
      result = result.substring(6);
      result = result.replace(',', ' ');
      result = result.replace(',', ' ');
      var card = result.toUpperCase();
      if (contains(socket.cards, card)) {
        var arr = removeCard(socket.cards, card);
        socket.cards = arr;
        var data = { card: card, name: socket.username, id: socket.id, len: socket.cards.length };
        socket.emit('playTurn', data);
      } else {
        console.log(warning("You don't have this card, throw some other card"));
      }
    } else if (result[0] === 'show') {
      displayCards(socket.cards);
    } else if (result[0] === 'draw') {
      didPlayerDrawCard++;
      if (didPlayerDrawCard > 1) {
        console.log(warning('You cant draw more than one card'));
      } else {
        var obj = { num: 1, id: socket.id };
        socket.emit('pick', obj);
        console.log(didPlayerDrawCard)
        // didPlayerDrawCard = 0;
      }
    } else if (result[0] == 'pass') {
      if (didPlayerDrawCard > 0) {
        console.log('if me aa gye')
        socket.emit('pass', socket.id);
      } else {
        console.log(warning('You need to draw a card first!'));
      }
    } else {
      socket.emit('text', playerData);
    }
    /* else if (result[0] === 'size') {
      socket.emit('opponentDeckSize', socket.id);
    }  else if (result[0] == 'disconnect') {
      // console.log("marr gye")
      //  socket.emit('disconnect', 5);
      //  socket.leave(socket.room);
      //  socket.disconnect(true);
      // socket = undefined;
    } */
  }
});
