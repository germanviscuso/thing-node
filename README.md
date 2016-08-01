# thing-node [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> A Kii enabled IoT library for node.js capable Things

## Installation

```sh
$ npm install --save thing-node
```

## Usage
For detailed info see ```demos``` and ```test/index.js```
```js
var thingNode = require('thing-node');

// Initialize with Kii app info (get it at developer.kii.com)
thingNode.initialize(<APP_ID>, <APP_KEY>, <APP_SITE>);

// Register Thing in cloud
thingNode.registerThing(registrationThingFields, function (error, result) {
  if (error) {
    // process error
  } else {
    // registered! process result 
  }
});
```

## Development

Test: ```npm test```

Node dev version: ```4.2.1```

Npm dev version:  ```3.5.2```

Node deploy version: ```0.12.14```

Npm deploy version: ```2.15.1```

Test deploy platform: ```Raspberry Pi Zero``

Kii JS SDK: ```2.4.7```

Thing-IF JS SDK: ```1.0```

## Logging

How to see what's happening on the cloud side (Kii log):
```
node ../kii-cli/bin/kii-logs.js -t --site us --app-id 6f673d3a --app-key 42790dac7aef69298846bca4acbd7f2a --client-id f61402883dde7b8839526d18f8680840 --client-secret <CLIENT_SECRET>
```

## License

MIT © [German Viscuso](https://github.com/germanviscuso)


[npm-image]: https://badge.fury.io/js/thing-node.svg
[npm-url]: https://npmjs.org/package/thing-node
[travis-image]: https://travis-ci.org/germanviscuso/thing-node.svg?branch=master
[travis-url]: https://travis-ci.org/germanviscuso/thing-node
[daviddm-image]: https://david-dm.org/germanviscuso/thing-node.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/germanviscuso/thing-node
