/**
 * Created by germanviscuso on 8/04/16.
 *
 *
 * For more info about Thing-IF see: https://docs.kii.com/en/starts/thingifsdk
 *
 */

const config = require('../../config.js');
const thingNode = require('thing-node');

const vendorThingId = 'MockTracker';
const thingPassword = '123456';
const thingType = 'ST300B';
const thingRegistrationFields = {
  _vendorThingID: vendorThingId,
  _password: thingPassword,
  _thingType: thingType,
  _vendor: 'Suntech'
};

var thingId;
var thingAccessToken;
var sensor_enabled = true;

if(!config.kii.appId || !config.kii.appKey || !config.kii.appSite) {
  console.log('Go to developer.kii.com, create an app, and copy the app ID, app Key and app Site to ../../config.json');
  process.exit(-1);
}
// Initialize with Kii app info (get it at developer.kii.com)
console.log('Initializing thing-node...');
thingNode.initialize(config.kii.appId, config.kii.appKey, config.kii.appSite);

var PORT = 33333;
var HOST = '127.0.0.1';
var dgram = require('dgram');
var server = dgram.createSocket('udp4');

server.on('listening', function () {
  var address = server.address();
  console.log('UDP Server listening on ' + address.address + ":" + address.port);
  // Register Thing in cloud
  console.log('Registering or loading thing...');
  thingNode.registerOrLoadThing(thingRegistrationFields, function (error, result) {
    if (error) {
      console.log(error);
      process.exit(-2);
    } else {
      var thing = result;
      thingId = thing.getThingID();
      console.log('Thing ID: ' + thingId);
      thingAccessToken = thing.getAccessToken();

      console.log('Onboarding Thing to Thing-IF...');
      thingNode.onboardThing(vendorThingId, thingPassword, thingType, thingAccessToken, function (error, result) {
        if(error) {
          console.log('Error onboarding Thing: ' + error);
        } else {
          // MQTT loop
          var mqttEndpoint = result['mqttEndpoint'];
          var serverUrl = 'mqtt://' + mqttEndpoint['host'];
          var port = mqttEndpoint['portTCP'];
          var username = mqttEndpoint['username'];
          var password = mqttEndpoint['password'];
          var topic = mqttEndpoint['mqttTopic'];
          var mqttClient = thingNode.connectMqtt(serverUrl, port, username, password, topic);

          mqttClient.on('connect', function () {
            mqttClient.subscribe(topic);
            //mqttClient.publish(topic, 'Hello mqtt');
            console.log('MQTT client connected!');
          });

          mqttClient.on('error', function (e) {
            console.log(false, 'MQTT client connection error: ' + e);
            mqttClient.end();
          });

          mqttClient.on('message', function (topic, message) {
            // message is a Buffer
            console.log('MQTT message received: ' + message.toString());
            // do something with incoming MQTT message
          });
        }
      });
    }
  });
});

server.on('message', function (message, remote) {
  console.log(remote.address + ':' + remote.port +' - ' + message);
  // we will pass the raw message to cloud but you might want to parse the message
  // and set more specific key/value entries in the state, eg. lat=30.0, lon=3.5
  var state = {
    'message': message
  };
  console.log('Saving Thing state to cloud:');
  console.log(state);
  thingNode.registerThingState(thingId, state, thingAccessToken, function (error, result) {
    if (result) {
      console.log('Thing-IF state registration successful');
    } else
      console.log('Error registering Thing-IF state: ' + error);
  });
});

server.bind(PORT, HOST);



