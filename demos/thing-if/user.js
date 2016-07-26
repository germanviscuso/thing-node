/**
 * Created by germanviscuso on 7/15/16.
 *
 * This sample shows a generic User side implementation that sends commands to a Kii Thing after claiming
 * ownership of it. The commands are received by a Thing via MQTT and acted upon. To see/run the Thing
 * side script please check the file thing.js located in the same directory as this script.
 * For more info about Thing-IF see: https://docs.kii.com/en/starts/thingifsdk
 *
 */

const thingNode = require('thing-node');

const appId = null; // TODO Create an app at developer.kii.com and paste the app id here
const appKey = null; // TODO Create an app at developer.kii.com and paste the app key here
const appSite = null; // // TODO Create an app at developer.kii.com and paste the site location here ('US', 'EU', 'JP', 'SG' or 'CN3')
const vendorThingId = 'MyThing';
const username = 'MyUser';
const userPassword = '123456';

var thingCommand = {
  'actions': [
    {'enableSensor':{'sensor': false}}
  ],
  'issuer': 'user:{USER_ID}', // fill owner user id later
  'schema': 'MySchemaName',
  'schemaVersion': 1,
  'title': 'CommandableThingDemo',
  'description': 'Enable or disable the Thing sensor',
  'metadata': {'created_at': '20160715'}
};

var command = process.argv[2];
if(command) {
  command = parseInt(command);
  switch(command) {
    case 0:
      thingCommand.actions[0].enableSensor.sensor = false;
      console.log('Command: turn off Thing sensor');
      break;
    case 1:
      thingCommand.actions[0].enableSensor.sensor = true;
      console.log('Command: turn on Thing sensor');
      break
    default:
      console.log('Invalid command. Enter 0 or 1 (0 means turn off sensor, 1 means turn on sensor)');
      process.exit(-2);
  }
} else {
  console.log('Missing command. Enter 0 or 1 (0 means turn off sensor, 1 means turn on sensor)');
  process.exit(-1);
}

if(!appId || !appKey || !appSite) {
  console.log('Go to developer.kii.com, create an app, and fill in the app ID, app Key and app Site at the top of this script.');
  process.exit(-2);
}
// Initialize with Kii app info (get it at developer.kii.com)
console.log('Initializing thing-node...');
thingNode.initialize(appId, appKey, appSite);

thingNode.getInstance().KiiUser.authenticate(username, userPassword).then(
  function(theUser) {
    console.log('User ID is: ' + theUser.getID());
    //Register user as Thing owner
    thingNode.registerOwnerSimpleFlow(vendorThingId, theUser, function(error, result) {
      if(error && (error.errorCode != 'THING_OWNERSHIP_ALREADY_EXISTS')) {
        console.log('Error registering owner: ' + error.message);
      }
      if(result)
        console.log('Owner successfully registered!');
      else
        console.log('The user was already an owner of the thing');
      //fetch thing token and submit command
      thingNode.loadThingWithVendorThingIdByOwner(vendorThingId, theUser, function (error2, result2) {
        if(error2) {
          console.log('Error loading thing: ' + error2.message);
        }
        else {
          var thing = result2;
          thingCommand.issuer = 'user:' + theUser.getID();
          thingNode.sendThingCommand(thing.getThingID(), thingCommand, theUser.getAccessToken(), function (error3, result3) {
            if(error3)
              console.log('Error sending thing command: ' + error3.message);
            else
              console.log('Command sent successfully: ' + JSON.stringify(result3));
          });
        }
      });
    });
  }
).catch(
  function(error) {
    if(error.message.indexOf('invalid_grant') > -1) {
      var userBuilder = thingNode.getInstance().KiiUser.userWithUsername(username, userPassword);
      userBuilder.register().then(
        function(theUser) {
          console.log('User registered. Please run this script again!');
        }
      ).catch(
        function(error) {
          console.log('Error registering user: ' + error.message);
        }
      );
    } else {
      console.log('Error enabling user: ' + error.message);
    }
  }
);



