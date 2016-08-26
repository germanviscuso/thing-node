# thing-node [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
A Kii enabled IoT library for node.js capable Things

## Installation

```sh
$ npm install --save thing-node
```

## Usage
For detailed info see ```demos``` and ```test/index.js```
```js
var thingNode = require('thing-node');

const vendorThingId = 'MyThing';
const thingPassword = 'ThingPassword';
const thingType = 'ThingType';

const thingRegistrationFields = {
  _vendorThingID: vendorThingId,
  _password: thingPassword,
  _thingType: thingType,
  _vendor: 'ThingManufacturer'
};

// Initialize with Kii app info (get it at developer.kii.com)
thingNode.initialize(<APP_ID>, <APP_KEY>, <APP_SITE>);

// Register Thing in cloud
thingNode.registerOrLoadThing(thingRegistrationFields, function (error, thing) {
  if (!error) {
    thingId = thing.getThingID();
    thingAccessToken = thing.getAccessToken();
    thingNode.onboardThing(vendorThingId, thingPassword, thingType, thingAccessToken, function (error, onboardInfo) {
      if(!error) {
        var state = {
           'power': true,
           'temperature': 33
        };
        thingNode.registerThingState(thingId, state, thingAccessToken, function (error, stateRegInfo) {
          if (!error)
            console.log('Thing-IF state registration successful: ' + stateRegInfo);
          else
            console.log('Error registering Thing state: ' + error);
        });
      } else {
        console.log('Error onboarding Thing: ' + error);
      }
    });
  } else {
    console.log('Error loading or registering Thing: ' + error);
  }
});
```

## TODO

- Provide Promises besides a callback based API
- Provide API documentation (JSDoc)

## Development

- Test: ```npm test``` or ```gulp```
- Node dev version: ```4.2.1```
- Npm dev version:  ```3.5.2```
- Node deploy version: ```0.12.14```
- Npm deploy version: ```2.15.1```
- Continuous integration: ```Travis```
- Test deploy platform: ```Raspberry Pi Zero```
- Kii JS SDK: ```2.4.7```
- Thing-IF JS SDK: ```1.0```

## Logging

How to see what's happening on the cloud side (Kii log):
```
node ../kii-cli/bin/kii-logs.js -t --site us --app-id <KII_APP_ID> --app-key <KII_APP_KEY> --client-id <KII_CLIENT_ID> --client-secret <KII_CLIENT_SECRET>
```

## License

MIT © [German Viscuso](https://github.com/germanviscuso)

[npm-image]: https://badge.fury.io/js/thing-node.svg
[npm-url]: https://npmjs.org/package/thing-node
[travis-image]: https://travis-ci.org/germanviscuso/thing-node.svg?branch=master
[travis-url]: https://travis-ci.org/germanviscuso/thing-node
[daviddm-image]: https://david-dm.org/germanviscuso/thing-node.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/germanviscuso/thing-node
