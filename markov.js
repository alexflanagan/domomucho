var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

// Input validator for previous/current text pairs.
var valid = function (pair) {
  return (pair &&
      typeof pair.previous !== 'undefined' &&
      typeof pair.current !== 'undefined');
};

// Map that holds the Markov chain transition matrix.
var textmap;

// Zero us out.
// Also a test output function.
var reset = function () {
  textmap = { statecount: 0 };

  console.log(getRandomPropertyWeighted({
    'alex is great!': 20,
    'domo is online!': 25,
    'alex is a coconut!': 15,
    'domo is alive!': 40
  }, 100));
};

// Add a transition pair to the matrix.
// Returns false/true for fail/success.
var add = function (pair) {

  // Pairs must have "previous" and "current" members.
  if (!valid(pair)) {
    console.log('invalid pair: %o', pair);
    return false;
  }
  
  // New previous states get their cumulative counters set to zero.
  if (typeof textmap[pair.previous] === 'undefined') {
      textmap[pair.previous] = { transitioncount: 0 };
      textmap.statecount++;
  }

  // New transition states get their counter set to zero.
  if (typeof textmap[pair.previous][pair.current] === 'undefined') {
    textmap[pair.previous][pair.current] = 0;
  }

  // Increment the cumulative and individual counters for the transition.
  textmap[pair.previous][pair.current]++;
  textmap[pair.previous].transitioncount++;

  console.log('added: (%s, %s, %d)', pair.previous, pair.current, textmap[pair.previous][pair.current]);

  return true;
};

var getRandomPropertyWeighted = function(obj, count) {
  var probs = [];
  var check = 0.0;
  
  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) { continue };
    if (key === 'transitioncount') { continue };
    if (key === 'statecount') { continue };
    var p = obj[key] / count;
    probs.push({ key: key, p: p });
    check += p;
  }

  console.log('check sum should be ~1.0:', check);

  var rando = Math.random() * count;

  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) { continue; }
    if (key === 'transitioncount') { continue };
    if (key === 'statecount') { continue };
    if (rando < obj[key]) {
      return key;
    }

    rando -= obj[key];
  }
};

var getRandomProperty = function(obj, count) {
  var index = Math.floor(Math.random() * count);
  var i = 0;

  for (var key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    if (key === 'transitioncount') { continue };
    if (key === 'statecount') { continue };
    if (i === index) {
      console.log(key);
      return obj[key];
    }
    i++;
  }
};

// TODO: Could expose the separator for the join below here.
var get = function(text, count) {

  var retVal = '';
  var next = text;

  for (var i = 0; i < count; i++) {

    console.log('word: %s', next);

    var fromTransition = textmap[next];
    if (typeof fromTransition === 'undefined') {
      fromTransition = getRandomProperty(textmap, textmap.statecount);
    }

    console.log('transitioncount: %d', fromTransition.transitioncount);

    var next = getRandomPropertyWeighted(fromTransition, fromTransition.transitioncount);
    retVal = [retVal, next].join(' ');
  }

  return retVal;
};

var save = function(filename) {
  console.log ('saving markov chain to %s', filename);
  return fs.writeFileAsync(filename, JSON.stringify(textmap), 'utf-8');
};

var load = function(filename) {
  console.log ('loading markov chain from %s', filename);
  return fs.readFileAsync(filename, 'utf-8').then(function(contents) {
    textmap = JSON.parse(contents);
  });
};

reset();

module.exports = {
  reset: reset,
  add: add,
  get: get,
  save: save,
  load: load
};
