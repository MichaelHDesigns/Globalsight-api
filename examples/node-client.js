var io = require('socket.io-client');

var Globaltokencore = require('Globaltokencore');
var util = Globaltokencore.util;
var Key = Globaltokencore.Key;
var AuthMessage = Globaltokencore.AuthMessage;
var Buffer = Globaltokencore.Buffer;

var socket = io.connect('http://localhost:3001', {
  reconnection: false
});

var pk = Key.generateSync();
var pubkey = pk.public.toString('hex');
socket.emit('subscribe', pubkey);
socket.emit('sync');



socket.on('connect', function() {
  console.log('connected as ' + pubkey);
});

socket.on('message', function(m) {
  var data = AuthMessage.decode(pk, m);
  console.log('message received ' + data.payload);
  var echo = AuthMessage.encode(m.pubkey, pk, data.payload);
  socket.emit('message', echo);
});


socket.on('error', function(err) {
  console.log(err);
});
