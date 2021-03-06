const should = require('chai').should();
const assert = require('chai').assert;
const config = require('../config');
import thingNode from '../lib';

const random = Math.random() * 1000;
const apiCallTimeout = 25000;
const testVendorThingId = 'myTestDevice' + random;
const testThingPassword = '123456';
const testRegistrationThingFields = {
  _vendorThingID: testVendorThingId,
  _password: testThingPassword,
  _thingType: 'sensor',
  _vendor: 'Kii',
  _layoutPosition: 'STANDALONE'
};
const testUsername = 'testuser' + random;
const testUserPassword = '123456';
const testThingState = {
  'power': true,
  'presetTemperature': 25,
  'fanspeed': 5,
  'currentTemperature': 28,
  'currentHumidity': 65
};
const testThingCommand = {
  'actions': [
    {'turnPower':{'power': true}},
    {'setPresetTemperature':{'presetTemperature': 25}},
    {'setFanSpeed':{'fanSpeed': 5}}
  ],
  'issuer': 'user:{USER_ID}', // placeholder, we'll fill in the owner user id later
  'schema': 'SmartLight',
  'schemaVersion': 1,
  'title': 'AirConditioner-Demo',
  'description': 'Set the air conditioner to my favorite settings',
  'metadata': {'created_at': '20160715'}
};
const testThingCommandResult = {
  'actionResults': [
    {'turnPower': {'succeeded': true}},
    {'setPresetTemperature': {'succeeded': true}},
    {'setFanSpeed': {'succeeded': false, 'errorMessage': 'Interrupted by user.'}}
  ]
};
const testThingScheduledTrigger = {
  'triggersWhat': 'COMMAND',
  'predicate': {
    'eventSource': 'SCHEDULE_ONCE',
    'scheduleAt': (new Date).getTime() + 50000
  },
  'command': {
    'schema': 'SmartLight',
    'schemaVersion': 1,
    'issuer': 'user:{USER_ID}', // placeholder, we'll fill in the owner user id later
    'actions': [
      {'setLightColor': {'lightColor': '333'}}
    ]
  },
  'title': 'Example #1',
  'description': 'Execute the command at the designated time',
  'metadata': {
    'color': 'red',
    'hex': '#333'
  }
};
const testThingConditionTrigger = {
  'triggersWhat': 'COMMAND',
  'predicate': {
    'eventSource': 'STATES',
    'condition': {'type': 'eq', 'field': 'power', 'value': true},
    'triggersWhen': 'CONDITION_CHANGED'
  },
  'command': {
    'schema': 'SmartLight',
    'schemaVersion': 1,
    'issuer': 'user:{USER_ID}', // placeholder, we'll fill in the owner user id later
    'actions': [
      {'setLightColor': {'lightColor': '333'}}
    ]
  },
  'title': 'Example #2',
  'description': 'Execute the command when the state condition is met',
  'metadata': {
    'color': 'red',
    'hex': '#333'
  }
};
const testThingServerCodeTrigger = {
  'triggersWhat': 'SERVER_CODE',
  'predicate': {
    'eventSource': 'STATES',
    'condition': {'type': 'eq', 'field': 'power', 'value': true},
    'triggersWhen': 'CONDITION_CHANGED'
  },
  'serverCode' : {
    'endpoint' : 'saveColor',
    'parameters' : {
      'brightness' : 100,
      'color' : '#FFF'
    },
    'executorAccessToken' : '{ACCESS_TOKEN}' // placeholder, we'll fill in the access token later
  },
  'title': 'Example #2',
  'description': 'Execute the server code when the state condition is met',
  'metadata': {
    'color': 'red',
    'hex': '#333'
  }
};
const testThingUpdatedTrigger = {
  'triggersWhat': 'SERVER_CODE',
  'predicate': {
    'eventSource': 'STATES',
    'condition': {'type': 'eq', 'field': 'power', 'value': true},
    'triggersWhen': 'CONDITION_FALSE_TO_TRUE'
  },
  'serverCode' : {
    'endpoint' : 'saveColor',
    'parameters' : {
      'brightness' : 100,
      'color' : '#FFF'
    },
    'executorAccessToken' : '{ACCESS_TOKEN}' // placeholder, we'll fill in the access token later
  },
  'title': 'Example #2 (updated)',
  'description': 'Execute the server code when the state condition is met (updated)',
  'metadata': {
    'color': 'red',
    'hex': '#333'
  }
};
const testThingStateQuery = {
  'query': {
    'clause': {
      'type': 'and',
      'clauses': [
        {
          'type': 'range',
          'field': 'value',
          'upperLimit': 17.0
        },
        {
          'type': 'eq', 'field': 'sensor',
          'value': 'TCB'
        }
      ]
    },
    'grouped': false
  }
};

describe('tests', function () {
  var tempPin;
  var tempInstallationId;
  var tempCommandId;
  var tempTriggerId, tempTriggerId2;

  this.timeout(apiCallTimeout);

  /* before(function (done) {
    // set up code here
    done();
  }); */

  after(function (done) {
    // clean up code, no callback/no output
    // delete user
    var user = thingNode.getKiiInstance().KiiUser.getCurrentUser();
    if (user) {
      user.delete(null);
    }
    // delete thing
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, thing) {
      if (!error) {
        thing.deleteThing(null);
      }
    });
    done();
  });

  it('should be up and running', function () {
    should.exist(thingNode);
    assert(true, 'unit test system is up and running');
  });
  it('should have SDK instances', function () {
    should.exist(thingNode.getKiiInstance());
    should.exist(thingNode.getThingIFInstance());
  });
  it('should have SDK versions', function () {
    should.exist(thingNode.getKiiSDKVersion());
    thingNode.getKiiSDKVersion().should.be.a('string');
    should.exist(thingNode.getThingIFSDKVersion());
    thingNode.getThingIFSDKVersion().should.be.a('string');
  });
  it('should have the SDK parameters filled in previous to initialization', function () {
    assert(config.kii.appId, 'KII_APP_ID has been filled in ../config.js or as environment variable');
    assert(config.kii.appKey, 'KII_APP_KEY has been filled in ../config.js or as environment variable');
    assert(config.kii.appSite, 'KII_APP_SITE has been filled in ../config.js or as environment variable');
  });
  it('should have the SDKs initialized', function () {
    thingNode.initialize(config.kii.appId, config.kii.appKey, config.kii.appSite);
    assert(thingNode.isInitialized(), 'sdks are initialized');
  });
  it('should have a Thing-IF app', function () {
    assert(thingNode.getThingIFApp(), 'thing-if app present');
  });
  it('should have a test user registered', function (done) {
    let user = thingNode.getKiiInstance().KiiUser.userWithUsername(testUsername, testUserPassword);
    user.register().then(
      function (theUser) {
        let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
        should.exist(currentUser);
        theUser.getID().should.equal(currentUser.getID());
        done();
      }
    ).catch(
      function (error) {
        if (error.message.indexOf('USER_ALREADY_EXISTS') > -1)
          assert(true, 'user was previously registered');
        else
          assert(false, 'user registration error');
        done();
      }
    );
  });
  it('should have a test user logged in', function (done) {
    thingNode.getKiiInstance().KiiUser.authenticate(testUsername, testUserPassword).then(
      function (theUser) {
        assert(true, 'user successfully logged in!');
        let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
        should.exist(currentUser);
        theUser.getID().should.equal(currentUser.getID());
        // console.log('User Token: ' + theUser.getAccessToken());
        done();
      }
    ).catch(
      function (error) {
        assert(false, 'user log in error');
      }
    );
  });
  it('should allow thing registration', function (done) {
    thingNode.registerThing(testRegistrationThingFields, function (error, result) {
      if (error) {
        if (thingNode.isErrorAlreadyExists(error))
          assert(true, 'thing was previously registered');
        else
          assert(false, error.toString());
      } else {
        if (thingNode.isKiiThing(result)) {
          let thing = result;
          should.exist(thing);
          thing.getVendorThingID().should.equal(testVendorThingId);
        } else {
          assert(false, 'got something different than a kii thing');
        }
      }
      done();
    });
  });
  it('should allow checking if a thing exists', function (done) {
    thingNode.isThingRegistered(testVendorThingId, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      should.exist(result);
      // TODO verify result structure
      assert(result, 'test thing exists');
      done();
    });
  });
  it('should allow thing authentication', function (done) {
    thingNode.authenticateAsThing(testVendorThingId, testThingPassword, function (error, context) {
      if (error)
        console.log(error);
      should.not.exist(error);
      should.exist(context);
      var authThing = context.getAuthenticatedThing();
      assert.notEqual(null, authThing, 'authThing should not be null');
      assert.strictEqual(testVendorThingId, authThing.getVendorThingID(), 'vendorThingID should be same');
      should.exist(authThing.getAccessToken());
      done();
    });
  });
  it('should not allow unknown thing authentication', function (done) {
    thingNode.authenticateAsThing(testVendorThingId + '-fake', testThingPassword, function (error, context) {
      should.exist(error);
      should.not.exist(context);
      assert(thingNode.isErrorUnknownThing(error), 'should get error of non existent thing');
      done();
    });
  });
  it('should allow thing self loading by vendor id', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thing.getVendorThingID().should.equal(testVendorThingId);
      done();
    });
  });
  it('should allow thing registration or loading', function (done) {
    thingNode.registerOrLoadThing(testRegistrationThingFields, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thing.getVendorThingID().should.equal(testVendorThingId);
      done();
    });
  });
  it('should allow to add current logged in user as owner of thing (simple flow)', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.registerOwnerSimpleFlow(testVendorThingId, currentUser, function (error, result) {
      if (error && (error.errorCode == 'THING_OWNERSHIP_ALREADY_EXISTS')) {
        assert(true, 'Owner already exists');
        done();
      } else {
        if (error)
          console.log(error);
        should.not.exist(error);
        should.exist(result);
        done();
      }
    });
  });
  it('should have the user as owner', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.isThingOwner(thing, currentUser, function (error2, result2) {
        should.not.exist(error2)
        should.exist(result2);
        done();
      });
    });
  });
  it('should include the owner in the list of thing owners', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.listThingOwners(thing, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(JSON.stringify(result2).indexOf(currentUser.getID()) > -1, 'user is in the list of owners');
        done();
      });
    });
  });
  it('should allow thing loading by vendor id with current user authorization', function (done) {
    thingNode.loadThingWithVendorThingIdByCurrentUser(testVendorThingId, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thing.getVendorThingID().should.equal(testVendorThingId);
      done();
    });
  });
  it('should allow getting thing fields', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thing.refresh({
        success(returnedThing) {
          const fields = thingNode.getThingFields(returnedThing);
          should.exist(fields);
          fields.should.have.property('_thingType');
          fields.should.have.property('_vendor');
          done();
        },
        failure(error) {
          if (error)
            console.log(error);
          assert(false, error);
          done();
        }
      });
    });
  });
  it('should allow setting thing fields', function (done) {
    const thingFields = {
      _thingType: 'GPS',
      _vendor: 'Kii Corporation',
      _firmwareVersion: Math.random().toString(),
      _productName: 'KiiCloud',
      _lot: 'KII20140711-AB-002134D',
      _stringField1: 'S001',
      _stringField2: 'S002',
      _stringField3: 'S003',
      _stringField4: 'S004',
      _stringField5: 'S005',
      _numberField1: 101,
      _numberField2: 102,
      _numberField3: 103,
      _numberField4: 104,
      _numberField5: 105
    };
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.updateThingFields(thing, thingFields, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        const fields = thingNode.getThingFields(thing2);
        should.exist(fields);
        fields.should.have.property('_firmwareVersion');
        fields._firmwareVersion.should.equal(thingFields._firmwareVersion);
        done();
      });
    });
  });
  it('should not allow thing self disablement', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      assert(!thing.getDisabled(), 'thing should be enabled by default');
      thingNode.disableThing(thing, function (error2, result2) {
        should.exist(error2);
        should.not.exist(result2);
        assert(error2.message.indexOf('statusCode: 401') > -1, 'thing disablement with thing token not allowed');
        done();
      });
    });
  });
  it('should allow thing disablement by owner', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByCurrentUser(testVendorThingId, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      assert(!thing.getDisabled(), 'thing should be enabled by default');
      thingNode.disableThing(thing, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        assert(thing.getDisabled(), 'thing should be disabled at this point');
        done();
      });
    });
  });
  it('should allow thing enablement by owner', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByCurrentUser(testVendorThingId, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      assert(thing.getDisabled(), 'thing should be disabled at this point');
      thingNode.enableThing(thing, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        assert(!thing.getDisabled(), 'thing should be enabled at this point');
        done();
      });
    });
  });
  it('should allow getting thing info by thing', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingInfo(testVendorThingId, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('_thingID');
        result2.should.have.property('_vendorThingID');
        result2.should.have.property('_created');
        result2.should.have.property('_thingType');
        done();
      });
    });
  });
  it('should allow getting thing info by user', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.getThingInfo(testVendorThingId, currentUser.getAccessToken(), function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      should.exist(result);
      result.should.have.property('_thingID');
      result.should.have.property('_vendorThingID');
      result.should.have.property('_created');
      result.should.have.property('_thingType');
      done();
    });
  });
  it('should not allow thing owner removal by thing', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.unregisterOwner(thing, currentUser, function (error2, result2) {
        should.exist(error2);
        should.not.exist(result2);
        assert(error2.message.indexOf('statusCode: 401') > -1, 'thing ownership removal with thing token not allowed');
        thingNode.isThingOwner(thing, currentUser, function (error3, result3) {
          should.not.exist(error3)
          should.exist(result3);
          done();
        });
      });
    });
  });
  it('should allow thing owner removal by owner', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByCurrentUser(testVendorThingId, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.unregisterOwner(thing, currentUser, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        thingNode.isThingOwner(thing, currentUser, function (error3, result3) {
          if (error3)
            console.log(error3);
          should.not.exist(error3)
          should.exist(result3);
          done();
        });
      });
    });
  });
  it('should allow thing owner registration by owner by getting a pin (pin code validation flow)', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.registerOwnerRequestPin(thing, currentUser, false, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('code');
        tempPin = result2.code;
        done();
      });
    });
  });
  it('should allow thing owner validation by thing by verifying pin (pin code validation flow)', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempPin);
      thingNode.registerOwnerValidatePin(thing, tempPin, false, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        done();
      });
    });
  });
  it('should allow thing owner registration by thing by getting a pin (pin code validation flow)', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByCurrentUser(testVendorThingId, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.unregisterOwner(thing, currentUser, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error3, result3) {
          if (error3)
            console.log(error3);
          should.not.exist(error3);
          let thing = result3;
          should.exist(thing);
          thingNode.registerOwnerRequestPin(thing, currentUser, true, function (error4, result4) {
            if (error4)
              console.log(error4);
            should.not.exist(error4);
            should.exist(result4);
            result4.should.have.property('code');
            tempPin = result4.code;
            done();
          });
        });
      });
    });
  });
  it('should allow thing owner validation by owner by verifying pin (pin code validation flow)', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempPin);
      thingNode.registerOwnerValidatePin(thing, tempPin, true, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        done();
      });
    });
  });
  it('should allow to create a push installation by thing', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.installThingPush(thing.getAccessToken(), false, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('installationID');
        result2.should.have.property('installationRegistrationID');
        tempInstallationId = result2['installationID'];
        done();
      });
    });
  });
  it('should allow to get a push installation by thing', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempInstallationId);
      thingNode.getThingPush(thing.getAccessToken(), tempInstallationId, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('installationID');
        result2.should.have.property('installationRegistrationID');
        done();
      });
    });
  });
  it('should allow to get push installations by thing', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempInstallationId);
      thingNode.getThingPushes(thing.getAccessToken(), thing.getThingID(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('installations');
        done();
      });
    });
  });
  it('should allow to get the MQTT endpoint of a push installation by thing', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempInstallationId);
      thingNode.getMQTTEndpoint(thing.getAccessToken(), tempInstallationId, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('installationID');
        done();
      });
    });
  });
  it('should allow thing to connect to an MQTT endpoint', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempInstallationId);
      thingNode.getMQTTEndpoint(thing.getAccessToken(), tempInstallationId, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('installationID');
        result2.should.have.property('username');
        result2.should.have.property('password');
        result2.should.have.property('mqttTopic');
        result2.should.have.property('host');
        result2.should.have.property('portTCP');
        result2.should.have.property('portSSL');
        result2.should.have.property('portWS');
        result2.should.have.property('portWSS');
        result2.should.have.property('X-MQTT-TTL');

        let serverUrl = 'mqtt://' + result2['host'];
        let port = result2['portTCP'];
        let username = result2['username'];
        let password = result2['password'];
        let topic = result2['mqttTopic'];
        let client = thingNode.connectMqtt(serverUrl, port, username, password, topic);

        client.on('connect', function () {
          // client.subscribe(topic);
          // client.publish(topic, 'Hello mqtt');
          assert(true, 'MQTT client connected');
          client.end();
          done();
        });

        client.on('error', function (e) {
          console.log(e);
          assert(false, 'MQTT client connection error');
          client.end();
          done();
        });

        // client.on('message', function (topic, message) {
          // console.log(JSON.parse(message));
        // });
      });
    });
  });
  it('should allow to delete a push installation by thing', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      should.exist(tempInstallationId);
      thingNode.deleteThingPush(thing.getAccessToken(), tempInstallationId, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        done();
      });
    });
  });
  it('should allow thing onboarding itself', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.onboardMyself(thing, testThingPassword, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('accessToken');
        result2.should.have.property('thingID');
        result2.should.have.property('mqttEndpoint');
        done();
      });
    });
  });
  it('should allow thing to do self onboarding with vendor id', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.onboardWithVendorThingIdByThing(testVendorThingId, testThingPassword, testRegistrationThingFields._thingType, {}, '1_MINUTE', 'STANDALONE', thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('accessToken');
        result2.should.have.property('thingID');
        result2.should.have.property('mqttEndpoint');
        done();
      });
    });
  });
  it('should allow thing to do self onboarding with thing id', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.onboardWithThingIdByThing(thing.getThingID(), testThingPassword, testRegistrationThingFields._thingType, {}, '1_MINUTE', 'GATEWAY', thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('accessToken');
        result2.should.have.property('thingID');
        result2.should.have.property('mqttEndpoint');
        done();
      });
    });
  });
  it('should not allow thing gateway to onboard an end node over itself without owner', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      let endNodeVendorThingId = 'endnode_' + testVendorThingId;
      let endNodePassword = 'endnode_' + testThingPassword;
      thingNode.onboardEndNodeWithGatewayVendorThingId(endNodeVendorThingId, endNodePassword, testVendorThingId, {}, testRegistrationThingFields._thingType, '', '1_MINUTE', thing.getAccessToken(), function (error2, result2) {
        if (result2)
          console.log(result2);
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should not allow thing gateway to onboard an end node over itself with owner', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      let endNodeVendorThingId = 'endnode_' + testVendorThingId;
      let endNodePassword = 'endnode_' + testThingPassword;
      thingNode.onboardEndNodeWithGatewayVendorThingId(endNodeVendorThingId, endNodePassword, testVendorThingId, {}, testRegistrationThingFields._thingType, currentUser.getID(), '1_MINUTE', thing.getAccessToken(), function (error2, result2) {
        if (result2)
          console.log(result2);
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should not allow owner to onboard an end node over a standalone thing with vendor thing id', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      let endNodeVendorThingId = 'endnode_' + testVendorThingId;
      let endNodePassword = 'endnode_' + testThingPassword;
      thingNode.onboardEndNodeWithGatewayVendorThingId(endNodeVendorThingId, endNodePassword, testVendorThingId, {}, testRegistrationThingFields._thingType, currentUser.getID(), '1_MINUTE', currentUser.getAccessToken(), function (error2, result2) {
        if (result2)
          console.log(result2);
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to set standalone thing as gateway', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.setThingAsGateway(thing.getThingID(), currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        done();
      });
    });
  });
  it('should allow thing to set itself as gateway', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.setThingAsGateway(thing.getThingID(), thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to onboard an end node over a thing gateway with vendor thing id', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      let endNodeVendorThingId = 'endnode_' + testVendorThingId;
      let endNodePassword = 'endnode_' + testThingPassword;
      thingNode.onboardEndNodeWithGatewayVendorThingId(endNodeVendorThingId, endNodePassword, testVendorThingId, {}, testRegistrationThingFields._thingType, currentUser.getID(), '1_MINUTE', currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('accessToken');
        result2.should.have.property('endNodeThingID');
        thingNode.loadThingWithVendorThingId(endNodeVendorThingId, endNodePassword, function (error3, result3) {
          if (error3)
            console.log(error3);
          should.not.exist(error3);
          should.exist(result3);
          let thing2 = result3;
          thingNode.deleteThing(thing2, function (error4, result4) {
            if (error4)
              console.log(error4);
            should.not.exist(error4);
            should.exist(result4);
            done();
          });
        });
      });
    });
  });
  it('should allow owner to onboard an end node over a thing gateway with thing id', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      let endNodeVendorThingId = 'endnode_' + testVendorThingId;
      let endNodePassword = 'endnode_' + testThingPassword;
      thingNode.onboardEndNodeWithGatewayThingId(endNodeVendorThingId, endNodePassword, thing.getThingID(), {}, testRegistrationThingFields._thingType, currentUser.getID(), '1_MINUTE', currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('accessToken');
        result2.should.have.property('endNodeThingID');
        thingNode.loadThingWithVendorThingId(endNodeVendorThingId, endNodePassword, function (error3, result3) {
          if (error3)
            console.log(error3);
          should.not.exist(error3);
          should.exist(result3);
          let thing2 = result3;
          thingNode.deleteThing(thing2, function (error4, result4) {
            if (error4)
              console.log(error4);
            should.not.exist(error4);
            should.exist(result4);
            done();
          });
        });
      });
    });
  });
  it('should have connected (thing)', function (done) {
    // Important: this test can fail because the online status is not reflected instantly after the MQTT connection
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingInfo(testVendorThingId, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('_online');
        result2.should.have.property('_onlineStatusModifiedAt');
        done();
      });
    });
  });
  it('should allow thing self deletion', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.deleteThing(thing, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error3, result3) {
          should.exist(error3);
          should.not.exist(result3);
          assert(thingNode.isErrorUnknownThing(error3), 'should get error of non existent thing');
          done();
        });
      });
    });
  });
  it('should allow user to do thing onboarding by vendor id', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.onboardWithVendorThingIdByUser(testVendorThingId, testThingPassword, currentUser, '', {}, '', '1_MINUTE', 'STANDALONE', function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      should.exist(result);
      result.should.have.property('accessToken');
      result.should.have.property('thingID');
      result.should.have.property('mqttEndPoint');
      done();
    });
  });
  it('should allow user to do thing onboarding by thing id', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.onboardWithThingIdByUser(thing.getThingID(), testThingPassword, currentUser, '1_MINUTE', 'STANDALONE', function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('accessToken');
        result2.should.have.property('thingID');
        result2.should.have.property('mqttEndPoint');
        done();
      });
    });
  });
  it('should allow thing to register thing state', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.registerThingState(thing.getThingID(), testThingState, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'thing state registered');
        done();
      });
    });
  });
  it('should allow thing to get thing state', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingState(thing.getThingID(), thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('power');
        result2.should.have.property('presetTemperature');
        result2.should.have.property('fanspeed');
        result2.should.have.property('currentTemperature');
        result2.should.have.property('currentHumidity');
        done();
      });
    });
  });
  it('should allow thing to get thing states via query', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingStates(thing.getThingID(), testThingStateQuery, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('queryDescription');
        result2.should.have.property('results');
        done();
      });
    });
  });
  it('should allow owner to register thing state', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.registerThingState(thing.getThingID(), testThingState, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'thing state registered');
        done();
      });
    });
  });
  it('should allow owner to get thing state', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingState(thing.getThingID(), currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('power');
        result2.should.have.property('presetTemperature');
        result2.should.have.property('fanspeed');
        result2.should.have.property('currentTemperature');
        result2.should.have.property('currentHumidity');
        done();
      });
    });
  });
  it('should allow owner to send thing command', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingCommand.issuer = 'user:' + currentUser.getID();
      thingNode.sendThingCommand(thing.getThingID(), testThingCommand, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('commandID');
        done();
      });
    });
  });
  it('should allow thing to send thing command', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingCommand.issuer = 'user:' + currentUser.getID();
      thingNode.sendThingCommand(thing.getThingID(), testThingCommand, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('commandID');
        tempCommandId = result2['commandID'];
        should.exist(tempCommandId);
        done();
      });
    });
  });
  it('should allow thing to send thing command with parameters', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingCommand.issuer = 'user:' + currentUser.getID();
      thingNode.sendThingCommandWithParameters(
        testThingCommand.schema,
        testThingCommand.schemaVersion,
        testThingCommand.actions,
        testThingCommand.issuer.replace('user:', ''),
        thing.getThingID(),
        thing.getAccessToken(),
        function (error2, result2) {
          if (error2)
            console.log(error2);
          should.not.exist(error2);
          should.exist(result2);
          result2.should.have.property('commandID');
          tempCommandId = result2['commandID'];
          should.exist(tempCommandId);
          done();
        }
      );
    });
  });
  it('should allow thing to send thing command result', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.sendThingCommandResult(thing.getThingID(), testThingCommandResult, tempCommandId, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'successfully sent command result');
        done();
      });
    });
  });
  it('should allow thing to get thing command with result', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingCommandWithResult(thing.getThingID(), tempCommandId, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('commandID');
        result2.should.have.property('commandState');
        result2.should.have.property('target');
        result2.should.have.property('issuer');
        // TODO verify values against temp data
        done();
      });
    });
  });
  it('should allow owner to get thing command with result', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingCommandWithResult(thing.getThingID(), tempCommandId, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('commandID');
        result2.should.have.property('commandState');
        result2.should.have.property('target');
        result2.should.have.property('issuer');
        // TODO verify values against temp data
        done();
      });
    });
  });
  it('should allow thing to get thing commands with results', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingCommandsWithResults(thing.getThingID(), null, null, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('commands');
        // TODO verify values against temp data
        // TODO test pagination
        done();
      });
    });
  });
  it('should allow owner to get thing commands with results', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingCommandsWithResults(thing.getThingID(), null, null, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('commands');
        // TODO verify values against temp data
        // TODO test pagination
        done();
      });
    });
  });
  it('should not allow thing to register server code trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingServerCodeTrigger.serverCode.executorAccessToken = thing.getAccessToken();
      thingNode.registerThingTrigger(thing.getThingID(), testThingServerCodeTrigger, thing.getAccessToken(), function (error2, result2) {
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to register server code trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingServerCodeTrigger.serverCode.executorAccessToken = currentUser.getAccessToken();
      thingNode.registerThingTrigger(thing.getThingID(), testThingServerCodeTrigger, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        if (error2)
          tempTriggerId2 = 1;
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerID');
        tempTriggerId2 = result2['triggerID'];
        should.exist(tempTriggerId2);
        done();
      });
    });
  });
  it('should not allow thing to register scheduled trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingScheduledTrigger.command.issuer = 'user:' + currentUser.getID();
      thingNode.registerThingTrigger(thing.getThingID(), testThingScheduledTrigger, thing.getAccessToken(), function (error2, result2) {
        // You need to write to support@kii.com and ask scheduled triggers to be enabled in your app
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to register scheduled trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingScheduledTrigger.command.issuer = 'user:' + currentUser.getID();
      thingNode.registerThingTrigger(thing.getThingID(), testThingScheduledTrigger, currentUser.getAccessToken(), function (error2, result2) {
        // You need to write to support@kii.com and ask scheduled triggers to be enabled in your app
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerID');
        done();
      });
    });
  });
  it('should not allow thing to register command/condition trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingConditionTrigger.command.issuer = 'user:' + currentUser.getID();
      thingNode.registerThingTrigger(thing.getThingID(), testThingConditionTrigger, thing.getAccessToken(), function (error2, result2) {
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to register command/condition trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingConditionTrigger.command.issuer = 'user:' + currentUser.getID();
      thingNode.registerThingTrigger(thing.getThingID(), testThingConditionTrigger, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        if (error2)
          tempTriggerId = 1;
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerID');
        tempTriggerId = result2['triggerID'];
        should.exist(tempTriggerId);
        done();
      });
    });
  });
  it('should allow owner to get trigger server code execution result', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId);
      if (tempTriggerId == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.getThingTriggerServerCodeResult(thing.getThingID(), null, null, tempTriggerId, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerServerCodeResults');
        done();
      });
    });
  });
  it('should allow thing to get trigger server code execution result', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId2);
      if (tempTriggerId2 == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.getThingTriggerServerCodeResult(thing.getThingID(), null, null, tempTriggerId2, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerServerCodeResults');
        done();
      });
    });
  });
  it('should allow thing to disable trigger', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId2);
      if (tempTriggerId2 == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.enableOrDisableThingTrigger(thing.getThingID(), tempTriggerId2, false, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger disabled');
        done();
      });
    });
  });
  it('should allow owner to disable trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId);
      if (tempTriggerId == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.enableOrDisableThingTrigger(thing.getThingID(), tempTriggerId, false, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger disabled');
        done();
      });
    });
  });
  it('should allow thing to enable trigger', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId2);
      if (tempTriggerId2 == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.enableOrDisableThingTrigger(thing.getThingID(), tempTriggerId2, true, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger disabled');
        done();
      });
    });
  });
  it('should allow owner to enable trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId);
      if (tempTriggerId == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.enableOrDisableThingTrigger(thing.getThingID(), tempTriggerId, true, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger disabled');
        done();
      });
    });
  });
  it('should not allow thing to update trigger', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingUpdatedTrigger.serverCode.executorAccessToken = thing.getAccessToken();
      while (!tempTriggerId2);
      if (tempTriggerId2 == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.updateThingTrigger(thing.getThingID(), tempTriggerId2, testThingUpdatedTrigger, thing.getAccessToken(), function (error2, result2) {
        if (result2)
          console.log(result2);
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to update trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      testThingUpdatedTrigger.serverCode.executorAccessToken = currentUser.getAccessToken();
      while (!tempTriggerId);
      if (tempTriggerId == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.updateThingTrigger(thing.getThingID(), tempTriggerId, testThingUpdatedTrigger, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger updated');
        done();
      });
    });
  });
  it('should allow thing to get trigger', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId2);
      if (tempTriggerId2 == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.getThingTrigger(thing.getThingID(), tempTriggerId2, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerID');
        done();
      });
    });
  });
  it('should allow owner to get trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId);
      if (tempTriggerId == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.getThingTrigger(thing.getThingID(), tempTriggerId, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggerID');
        done();
      });
    });
  });
  it('should allow thing to get triggers', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingTriggers(thing.getThingID(), null, null, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggers');
        done();
      });
    });
  });
  it('should allow owner to get triggers', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getThingTriggers(thing.getThingID(), null, null, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('triggers');
        done();
      });
    });
  });
  it('should allow thing to delete trigger', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId2);
      if (tempTriggerId2 == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.deleteThingTrigger(thing.getThingID(), tempTriggerId2, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger deleted');
        done();
      });
    });
  });
  it('should allow owner to delete trigger', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      while (!tempTriggerId);
      if (tempTriggerId == 1) {
        assert(false, "trigger id from previous test is missing");
        done();
      }
      else
      thingNode.deleteThingTrigger(thing.getThingID(), tempTriggerId, currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'trigger deleted');
        done();
      });
    });
  });
  it('should allow thing to send data to thing scope bucket', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.sendThingScopeObject(thing.getThingID(), false, 'test_bucket', testThingState, thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        result2.should.have.property('objectID');
        result2.should.have.property('createdAt');
        result2.should.have.property('dataType');
        done();
      });
    });
  });
  it('should allow thing to execute a server extension', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.executeServerExtension('test', testThingState, thing.getAccessToken(), function (error2, result2) {
        // if (error2)
          // console.log(error2);
        should.exist(error2);
        should.not.exist(result2);
        assert(error2.errorCode == 'SERVER_CODE_VERSION_NOT_FOUND');
        done();
      });
    });
  });
  it('should allow owner to get the vendor thing id of the thing', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getVendorThingId(thing.getThingID(), currentUser.getAccessToken(), function (error2, vendorThingId) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(vendorThingId);
        vendorThingId.should.equal(testVendorThingId);
        done();
      });
    });
  });
  it('should allow thing to get the vendor thing id of itself', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.getVendorThingId(thing.getThingID(), thing.getAccessToken(), function (error2, vendorThingId) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(vendorThingId);
        vendorThingId.should.equal(testVendorThingId);
        done();
      });
    });
  });
  it('should not allow thing to configure itself as gateway', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.setThingAsGateway(thing.getThingID(), thing.getAccessToken(), function (error2, result2) {
        should.exist(error2);
        should.not.exist(result2);
        done();
      });
    });
  });
  it('should allow owner to configure thing as gateway', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.setThingAsGateway(thing.getThingID(), currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'Thing registered as gateway');
        done();
      });
    });
  });
  it('should allow owner to change vendor thing id and password of the thing', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.updateVendorThingId(thing.getThingID(), 'newMyDevice' , 'newMyDevicePassword', currentUser.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'thing info updated');
        thingNode.updateVendorThingId(thing.getThingID(), testVendorThingId , testThingPassword, currentUser.getAccessToken(), function (error3, result3) {
          if (error3)
            console.log(error3);
          should.not.exist(error3);
          should.exist(result3);
          assert(result3, 'thing info updated');
          done();
        });
      });
    });
  });
  it('should allow thing to change vendor thing id and password of itself', function (done) {
    thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.updateVendorThingId(thing.getThingID(), 'newMyDevice' , 'newMyDevicePassword', thing.getAccessToken(), function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        should.exist(result2);
        assert(result2, 'thing info updated');
        thingNode.updateVendorThingId(thing.getThingID(), testVendorThingId , testThingPassword, thing.getAccessToken(), function (error3, result3) {
          if (error3)
            console.log(error3)
          should.exist(result3);
          assert(result3, 'thing info updated');
          done();
        });
      });
    });
  });
  it('should allow owner to delete thing', function (done) {
    let currentUser = thingNode.getKiiInstance().Kii.getCurrentUser();
    should.exist(currentUser);
    thingNode.loadThingWithVendorThingIdByOwner(testVendorThingId, currentUser, function (error, result) {
      if (error)
        console.log(error);
      should.not.exist(error);
      let thing = result;
      should.exist(thing);
      thingNode.deleteThing(thing, function (error2, result2) {
        if (error2)
          console.log(error2);
        should.not.exist(error2);
        let thing2 = result2;
        should.exist(thing2);
        thingNode.loadThingWithVendorThingId(testVendorThingId, testThingPassword, function (error3, result3) {
          should.exist(error3);
          should.not.exist(result3);
          assert(thingNode.isErrorUnknownThing(error3), 'should get error of non existent thing');
          done();
        });
      });
    });
  });
  it('should allow user deletion', function (done) {
    var user = thingNode.getKiiInstance().KiiUser.getCurrentUser();
    user.delete().then(
      function (theUser) {
        assert(true, 'user deleted');
        done();
      }
    ).catch(
      function (error) {
        if (error)
          console.log(error);
        var theUser = error.target;
        var errorString = error.message;
        assert(false, 'could not delete user');
      }
    );
  });
});




