/**
 * Created by germanviscuso on 8/04/16.
 *
 * This sample shows a generic mock UDP lcoation tracker implementation that sends reports
 * via UDP to a bridge running on localhost (run the bridge script first)
 * For more info about Thing-IF see: https://docs.kii.com/en/starts/thingifsdk
 *
 */

var PORT = 33333;
var HOST = '127.0.0.1';

var dgram = require('dgram');

var client = dgram.createSocket('udp4');

// Send data loop. As example we send random numbers in location parameters
setInterval(function () {
  var message = 'ST300STT;205151998;09;470;<DATE>;<TIME>;21d48;<LAT>;<LON>;000.026;000.00;10;1;80;12.93;000000;34;000013;4.1;1';
  var date = new Date();
  // replace placeholders
  message = message.replace('<DATE>', date.toLocaleDateString());
  message = message.replace('<TIME>', date.toLocaleTimeString());
  message = message.replace('<LAT>', (Math.random() * 1000).toString());
  message = message.replace('<LON>', (Math.random() * 1000).toString());
  var buffer = new Buffer(message);
  client.send(buffer, 0, buffer.length, PORT, HOST, function (err, bytes) {
    if (err) throw err;
    console.log('UDP message sent to ' + HOST +':'+ PORT);
    // client.close();
  });
}, 5000);



