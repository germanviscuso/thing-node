This demo requires that you run the thing script first and then the controller script in a separate command line window.

Run Thing side script:

```node thing.js```

It will send random temperature data to Kii using Thing-IF. It will turn of a mock temperature sensor when it receives a command from the controller (see the next script)

Run user side script:

```node controller.js```

It can turn on or off the thing temperature sensor by sending a command via Thing-IF. It can also query the executed commands and the corresponding results
