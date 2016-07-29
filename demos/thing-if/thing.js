/**
 * Created by germanviscuso on 7/15/16.
 *
 * This sample shows a generic Thing implementation that sends data to Kii cloud as
 * Thing-IF states and receives Thing-IF commands via MQTT. If you want to send commands
 * to a Thing running this script run user.js located in the same directory as this script.
 * For more info about Thing-IF see: https://docs.kii.com/en/starts/thingifsdk
 *
 */

const config = require('../../config.json');
const thingNode = require('thing-node');

const vendorThingId = 'MyThing';
const thingPassword = '123456';
const thingType = 'Sensor';
const thingRegistrationFields = {
  _vendorThingID: vendorThingId,
  _password: thingPassword,
  _thingType: thingType,
  _vendor: 'ThingManufacturer'
};

var thingId;
var thingAccessToken;
var sensor_enabled = true;

if(!config.appId || !config.appKey || !config.appSite) {
  console.log('Go to developer.kii.com, create an app, and copy the app ID, app Key and app Site to ../../config.json');
  process.exit(-1);
}
// Initialize with Kii app info (get it at developer.kii.com)
console.log('Initializing thing-node...');
thingNode.initialize(config.appId, config.appKey, config.appSite);

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
          var json = JSON.parse(message);
          var commandId = json.commandID;
          var thingCommandResult = {
            'actionResults': [
              {'enableSensor': {'succeeded': true}}
            ]
          };
          if(json.actions[0].enableSensor.sensor == true) {
            sensor_enabled = true;
            thingNode.sendThingCommandResult(thing.getThingID(), thingCommandResult, commandId, thing.getAccessToken(), function (error2, result2) {
              if(error) {
                console.log('Error sending thing command result: ' + error);
              } else {
                console.log('Command result sent!');
              }
            });
          }
          if(json.actions[0].enableSensor.sensor == false) {
            sensor_enabled = false;
            thingNode.sendThingCommandResult(thing.getThingID(), thingCommandResult, commandId, thing.getAccessToken(), function (error2, result2) {
              if(error) {
                console.log('Error sending thing command result: ' + error);
              } else {
                console.log('Command result sent!');
              }
            });
          }
        });

        // Send data loop. As example we send random numbers (you should replace with real sensor data)
        setInterval(function () {
          var state = {
            'power': sensor_enabled
          };
          if(sensor_enabled) {
            var sensor_value = Math.random() * 1000;
            state.sensor_value = sensor_value;
          }
          console.log('Saving Thing state to cloud:');
          console.log(state);
          thingNode.registerThingState(thingId, state, thingAccessToken, function (error, result) {
            if (result) {
              console.log('Thing-IF state registration successful');
            } else
              console.log('Error registering Thing-IF state: ' + error);
          });
        }, 5000);
      }
    });
  }
});


