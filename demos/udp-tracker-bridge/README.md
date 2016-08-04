This demo requires that you run the bridge script first and the the tracker script in a separate command line window.

Run Thing side script:

```node bridge.js```

It will run a UDP server to receive mock tracker location data. It will send the location data to Kii via Thing-IF

Run user side script:

```node tracker.js```

It will act as a mock location tracker and connect to localhost via UDP
