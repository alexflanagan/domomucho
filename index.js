var slack = require('@slack/client');
var markov = require('./markov');

var RtmClient = slack.RtmClient;

var CLIENT_EVENTS = slack.CLIENT_EVENTS;
var RTM_EVENTS = slack.RTM_EVENTS;
var RTM_CLIENT_EVENTS = slack.CLIENT_EVENTS.RTM;

var token = process.env.BOT_TOKEN || 'Add token to environment.';

var rtm = new RtmClient(token, {logLevel: 'debug'});

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  console.log('rtm: %s', rtmStartData);
  markov.load('mind.json');
});

// Wait for full connection for messaging.
rtm.on(RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, function () {
  console.log('open');

  rtm.on(RTM_EVENTS.MESSAGE, function (message) {
    console.log('msg: %s', message);

    var tok = message.text.split(' ');

    for (var i = 1; i < tok.length; i++) {
      markov.add({ previous: tok[i-1], current: tok[i] });
    }

    var phraseLength = Math.floor(Math.random() * 30) + 7;
    var response = markov.get(tok[Math.floor(Math.random() * tok.length)], phraseLength);

    // Stop the phrase at the first terminal punctuation mark.
    var punctuation = /[.!?]/;
    var matching = response.match(punctuation);
    if (matching && matching.length > 0) {
      response = response.substring(0, response.indexOf(matching[0]) + 1);
    }

    rtm.sendMessage(response, message.channel, function sent() {
      console.log('saving...');
      markov.save('mind.json').then(function() { console.log('saved!'); });
    });

  });

  rtm.on(RTM_EVENTS.CHANNEL_CREATED, function (message) {
    console.log('new: %s', message);
  });

});

rtm.start();
