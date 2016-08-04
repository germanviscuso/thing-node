This demo requires that you run the bridge script first and the the tracker script in a separate command line window.

Run Thing side script:

```node bridge.js```

It will run a UDP server to receive mock tracker location data. It will send the location data to Kii via Thing-IF

Run user side script:

```node tracker.js```

It will act as a mock location tracker and connect to localhost via UDP

#TODO

- Read device ID from incoming message and use that ID as vendorThingId in Kii calls. This requires the device registration on bridge.js to be done after the message is received
- Adapt bridge.js to parse the incoming message and extract high level info instead of passing the message to Kii as is (eg. parse latitude and longitude and set that in the Kii state passed to the cloud). This way the data passed to Kii becomes human readable
- Test MQTT connection by creating a Kii Thing-IF trigger that sends a message back to the bridge
