/* eslint-disable no-redeclare */
/* eslint-disable eqeqeq */
/* eslint-disable semi */
class Card {
  constructor (number, color, power) {
    this.number = number;
    this.color = color;
    this.power = power;
    this.id = '';
    if (this.number === '' && this.color === '') {
      this.id = power;
    } else if (this.number === '') {
      this.id = this.color + ' ' + this.power;
    } else {
      this.id = this.color + ' ' + this.number;
    }
  }
}

var cards = [];
var colors = ['GREEN', 'RED', 'YELLOW', 'BLUE'];
for (var i = 0; i < 10; i++) {
  for (var j = 0; j < colors.length; j++) {
    if (i > 0) {
      cards.push(new Card(i, colors[j], ''));
      cards.push(new Card(i, colors[j], ''));
    } else {
      cards.push(new Card(i, colors[j], ''));
    }
  }
}

var powers = ['DRAW 2', 'REVERSE', 'SKIP', 'WILD DRAW 4', 'WILD'];

for (var i = 0; i < powers.length; i++) {
  if (i < 3) {
    for (var j = 0; j < colors.length; j++) {
      cards.push(new Card('', colors[j], powers[i]));
      cards.push(new Card('', colors[j], powers[i]));
    }
  } else {
    cards.push(new Card('', '', powers[i]));
    cards.push(new Card('', '', powers[i]));
    cards.push(new Card('', '', powers[i]));
    cards.push(new Card('', '', powers[i]));
  }
}

function distributeCards (cards) {
  var playerDeck = [];

  // shuffling
  for (var i = cards.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }

  for (var i = 0; i < 7; i++) {
    playerDeck.push(cards[i]);
    cards.splice(i, 1);
  }

  return playerDeck;
}

function getDrawPile (playerCards) {
  var cardsDeepCopy = JSON.parse(JSON.stringify(cards));
  for (var i = 0; i < playerCards.length; i++) {
    var ind = cardsDeepCopy.indexOf(playerCards[i]);
    cardsDeepCopy.splice(ind, 1);
  }
  for (var i = cardsDeepCopy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = cardsDeepCopy[i];
    cardsDeepCopy[i] = cardsDeepCopy[j];
    cardsDeepCopy[j] = temp;
  }

  return cardsDeepCopy;
}

function randomStr () {
  var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var ans = '';
  var len = 5;
  for (var i = len; i > 0; i--) {
    ans +=
          arr[Math.floor(Math.random() * arr.length)];
  }
  return ans;
}

const chalk = require('chalk');

function removeCard (myArray, card) {
  card = card.toUpperCase();
  var arr = [];
  var ind = 0;
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].id === card) {
      ind = i;
    }
    arr.push(myArray[i])
  }
  arr.splice(ind, 1);
  return arr;
}

function displayCards (arr) {
  var string = '';
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].color == 'YELLOW') {
      string += chalk.yellow(arr[i].id);
      string += ', ';
    } else if (arr[i].color == 'RED') {
      string += chalk.red(arr[i].id);
      string += ', ';
    } else if (arr[i].color == 'BLUE') {
      string += chalk.blue(arr[i].id);
      string += ', ';
    } else if (arr[i].color == 'GREEN') {
      string += chalk.green(arr[i].id);
      string += ', ';
    } else {
      string += chalk.white(arr[i].id);
      string += ', ';
    }
  }
  console.log(string);
}

async function restoreCard (card) {
  card = card.split(' ');

  if (card.length === 3) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].color == card[0] && cards[i].power == 'DRAW 2') {
        return cards[i];
      } else if (cards[i].power == 'WILD DRAW 4') {
        return cards[i];
      }
    }
  } else if (card.length === 2) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].color == card[0] && cards[i].number == card[1]) {
        return cards[i];
      } else if (cards[i].color == card[0] && cards[i].power == card[1]) {
        return cards[i];
      }
    }
  } else { // card.length == 1
    var obj = { number: '', color: '', power: 'WILD', id: 'WILD' }
    return obj;
  }
}

module.exports = {
  cards,
  powers,
  restoreCard,
  removeCard,
  displayCards,
  randomStr,
  distributeCards,
  getDrawPile
};
