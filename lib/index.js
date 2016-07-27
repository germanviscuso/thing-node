/**
 * Created by germanviscuso on 3/28/16.
 */
require('jquery-xhr');
const _kii = require('kii-cloud-sdk').create();
var request = require('request');
const mqtt = require('mqtt');

console.log('Kii JS SDK v' + _kii.Kii.getSDKVersion());

// patch until issue 604 is fixed
_kii.KiiThingWithToken.prototype.getAccessToken = function () { if (this._accessToken) return this._accessToken; else return this._adminToken; };

module.exports = {

  /**
   Returns the kii-cloud-sdk instance

   @returns {container} The Kii SDK instance
   @example
   // Get Kii SDK instance
   thingNode.getInstance();
   */

  getInstance() {
    return _kii;
  },

  /**
   Returns the kii-cloud-sdk version

   @returns {String} The Kii SDK version
   */

  getSDKVersion() {
    return _kii.Kii.getSDKVersion();
  },

  /** Initialize the Kii SDK

   Should be the first Kii SDK action your application makes.
   @param String appID The application ID found in your Kii developer console
   @param String appKey The application key found in your Kii developer console
   @param String serverLocation The site location found in your Kii developer console (either US, JP, CN3, SG or EU)
   @example
   // Initialize Kii
   thingNode.getInstance().initialize('<APP_ID_HERE>', '<APP_KEY_HERE>', <APP_SITE_HERE>);
   */

  initialize(appID, appKey, serverLocation) {
    let kiiSite = _kii.KiiSite.US;
    if (serverLocation === 'US')
      kiiSite = _kii.KiiSite.US;
    if (serverLocation === 'JP')
      kiiSite = _kii.KiiSite.JP;
    if (serverLocation === 'CN')
      kiiSite = _kii.KiiSite.CN;
    if (serverLocation === 'CN3')
      kiiSite = _kii.KiiSite.CN3;
    if (serverLocation === 'SG')
      kiiSite = _kii.KiiSite.SG;
    if (serverLocation === 'EU')
      kiiSite = _kii.KiiSite.EU;
    _kii.Kii.initializeWithSite(appID, appKey, kiiSite);
  },
  isInitialized() {
    if (_kii.Kii.getAppID())
      if (_kii.Kii.getAppKey())
        if(_kii.Kii.getBaseURL())
          return true;
    return false;
  },
  registerThing(thingFields, callback) {
    /*
    var thingFields = {
      _vendorThingID: 'rBnvSPOXBDF9r29GJeGS',
      _password: '123ABC',
      _thingType: 'sensor',
      _vendor: 'Kii'
    };
    */
    _kii.KiiThing.register(thingFields, {
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  registerOrLoadThing(thingFields, callback) {
    let context = this;
    this.registerThing(thingFields, function (error, result) {
      if (error) {
        if(context.isErrorAlreadyExists(error)) {
          let vendorThingId = thingFields._vendorThingID;
          let thingPassword = thingFields._password;
          context.loadThingWithVendorThingId(vendorThingId, thingPassword, function (error, result) {
            if(error)
              callback(error, null)
            else
              callback(null, result);
          });
        } else {
          callback(error, null);
        }
      } else {
        callback(null, result);
      }
    });
  },
  updateThingFields(thing, thingFields, callback) {
    /*
    var thingFields = {
     _thingType: 'GPS',
     _vendor: 'Kii Corporation',
     _firmwareVersion: '1.01',
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
    */
    thing.fields = thingFields;
    thing.update({
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  getThingFields(thing) {
    /*
     var thingType = thing.fields._thingType;
     var vendor = thing.fields._vendor;
     var firmwareVersion = thing.fields._firmwareVersion;
     var productName = thing.fields._productName;
     var lot = thing.fields._lot;
     var stringField1 = thing.fields._stringField1;
     var stringField2 = thing.fields._stringField2;
     var stringField3 = thing.fields._stringField3;
     var stringField4 = thing.fields._stringField4;
     var stringField5 = thing.fields._stringField5;
     var numberField1 = thing.fields._numberField1;
     var numberField2 = thing.fields._numberField2;
     var numberField3 = thing.fields._numberField3;
     var numberField4 = thing.fields._numberField4;
     var numberField5 = thing.fields._numberField5;
     */
    return thing.fields;
  },
  setCustomField(thing, key, value, callback) {
    thing.fields[key] = value;
    thing.update({
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  getCustomField(thing, key) {
    /*
     var version = thing.fields.version;
     var serialNumber = thing.fields.serialNumber;
     var accuracy = thing.fields.accuracy;
     var isInitialized = thing.fields.isInitialized;
     */
    return thing.fields[key];
  },
  loadThingWithVendorThingId(vendorThingId, password, callback) {
    this.authenticateAsThing(vendorThingId, password, function(error, context) {
      if(error)
        callback(error, null);
      else {
        let authThing = context.getAuthenticatedThing();
        let token = authThing.getAccessToken();
        _kii.KiiThingWithToken.loadWithVendorThingID(vendorThingId, {
          success(returnedThing) {
            if (callback)
              callback(null, returnedThing);
          },
          failure(error) {
            if (callback)
              callback(error, null);
          }
        }, token);
      }
    });
  },
  loadThingWithThingIdByOwner(thingId, owner, callback) {
    let token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithThingID(thingId, {
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    }, token);
  },
  loadThingWithVendorThingIdByOwner(vendorThingId, owner, callback) {
    let token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithVendorThingID(vendorThingId, {
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    }, token);
  },
  loadThingWithThingIdByCurrentUser(thingId, callback) {
    _kii.KiiThing.loadWithThingID(thingId, {
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  loadThingWithVendorThingIdByCurrentUser(vendorThingId, callback) {
    _kii.KiiThing.loadWithVendorThingID(vendorThingId, {
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  isThingOwner(thing, userOrGroup, callback) {
    thing.isOwner(userOrGroup, {
      success(returnedThing, owner, isOwner) {
        if (callback)
          callback(null, isOwner);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  registerOwnerSimpleFlow(vendorThingId, userOrGroup, callback) {
    let url = _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/VENDOR_THING_ID:' + vendorThingId + '/ownership';
    let accessToken;

    if(this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
      accessToken = userOrGroup.getAccessToken();
    }
    else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        let currentUser = _kii.Kii.getCurrentUser();
        if(!currentUser) {
          callback("Adding group as owner requires a Kii user to be logged in", null);
          return;
        } else {
          accessToken = currentUser.getAccessToken();
        }
      }
      else {
        callback("Candidate owner must be a Kii user or group", null);
        return;
      }
    }

    const options = {
      url: url,
      json: true,
      method: 'put',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        "Accept": '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  registerOwnerRequestPin(thing, userOrGroup, initiatedByThing, callback) {
    let url = _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/' + thing.getThingID() + '/ownership/request';
    let accessToken, currentUser;

    if(this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
    }
    else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        currentUser = _kii.Kii.getCurrentUser();
        if(!currentUser) {
          callback("Adding group as owner requires a Kii user to be logged in", null);
          return;
        }
      }
      else {
        callback("Candidate owner must be a Kii user or group", null);
        return;
      }
    }

    if(initiatedByThing)
      accessToken = thing.getAccessToken();
    else {
      if (!currentUser)
        accessToken = userOrGroup.getAccessToken();
      else
        accessToken = currentUser.getAccessToken();
    }

    const options = {
      url: url,
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        "Accept": '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  registerOwnerValidatePin(thing, pinCode, initiatedByUser, callback) {
    const contentType = 'application/vnd.kii.ThingOwnershipConfirmationRequest+json';
    let accessToken, currentUser;

    if(!initiatedByUser)
      accessToken = thing.getAccessToken();
    else {
      currentUser = _kii.Kii.getCurrentUser();
      if(!currentUser) {
        callback("Pin validation for adding thing owner initiated by user requires the user to be logged in", null);
        return;
      }
      accessToken = currentUser.getAccessToken();
    }

    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/' + thing.getThingID() + '/ownership/confirm',
      body: {
        code: pinCode
      },
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  unregisterOwner(thing, userOrGroup, callback) {
    thing.unregisterOwner(userOrGroup, {
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  listThingOwners(thing, callback) {
    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/' + 'VENDOR_THING_ID:' + thing.getVendorThingID() + '/ownership',
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + thing.getAccessToken(),
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) { // no body available in this call
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);

  },
  enableThing(thing, callback) {
    thing.enable({
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  disableThing(thing, callback) {
    thing.disable({
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  switchThing(thing, callback) {
    if (thing.getDisabled())
      this.enableThing(thing, callback);
    else
      this.disableThing(thing, callback);
  },
  deleteThing(thing, callback) {
    thing.deleteThing({
      success(returnedThing) {
        if (callback)
          callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          callback(error, null);
      }
    });
  },
  authenticateAsThing(vendorThingId, password, callback) {
    _kii.Kii.authenticateAsThing(vendorThingId, password, {
      success: function(thingAuthContext) {
        if (callback)
          callback(null, thingAuthContext);
      },
      failure: function(errorString, errorCode) {
        if (callback)
          callback(errorString, null);
      }
    });
  },
  isThingRegistered(vendorThingId, callback) {
    // uses auth token from current logged in user
    let currentUser = this.getInstance().Kii.getCurrentUser();
    if(!currentUser) {
      callback('No Kii user: app user must be logged in', null);
    } else {
      const options = {
        url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/' + 'VENDOR_THING_ID:' + vendorThingId,
        json: true,
        method: 'head',
        headers: {
          'X-Kii-AppID': _kii.Kii.getAppID(),
          'X-Kii-AppKey': _kii.Kii.getAppKey(),
          'Authorization': 'Bearer ' + currentUser.getAccessToken(),
          'Accept': '*/*'
        }
      };

      function _callback(error, response) {
        if(error)
          callback(error, null);
        else
          switch (response.statusCode) { // no body available in this call
            case 204:
              callback(null, true);
              break;
            case 404:
              callback(null, false);
              break;
            default:
              callback(response.body, null);
          }
      }

      request(options, _callback);
    }
  },
  getThingInfo(vendorThingId, accessToken, callback) {
    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/' + 'VENDOR_THING_ID:' + vendorThingId,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Content-Type': 'Content-Type: application/vnd.kii.ThingRetrievalRequest+json',
        'Authorization': 'Bearer ' + accessToken,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  connectMqtt(serverUrl, port, username, password, clientId) {
    var client  = mqtt.connect(serverUrl, {
      port: port,
      username: username,
      password: password,
      clientId: clientId
    });
    return client;
    /*
    client.on('connect', function () {
      client.subscribe('presence');
      client.publish('presence', 'Hello mqtt');
    });

    client.on('error', function () {
      //report error
    });

    client.on('message', function (topic, message) {
      // message is Buffer
      console.log(message.toString());
      client.end();
    });
    */
  },
  authenticateAsAdmin(clientId, clientSecret, callback) {
    _kii.Kii.authenticateAsAppAdmin(clientId, clientSecret, {
      success: function (adminContext) {
        if (callback)
          callback(null, adminContext);
      },
      failure: function (errorString, errorCode) {
        if (callback)
          callback(errorString, null);
      }
    });
  },
  isKiiThing(object) {
    return (object.constructor.name == 'KiiThing')
  },
  isKiiThingWithToken(object) {
    return (object.constructor.name == 'KiiThingWithToken')
  },
  isKiiUser(object) {
    return (object.constructor.name == 'KiiUser')
  },
  isKiiGroup(object) {
    return (object.constructor.name == 'KiiGroup')
  },
  isErrorAlreadyExists(object) {
    return (object.constructor.name == 'Error' && object.message.indexOf('THING_ALREADY_EXISTS') > -1);
  },
  isErrorUnknownThing(object) {
    return (object.constructor.name == 'Error' && (object.message.indexOf('statusCode: 400 error code: invalid_grant') > -1 || object.message.indexOf('THING_NOT_FOUND') > -1));
  },
  installThingPush(thingAccessToken, productionEnvironment, callback) {
    const contentType = 'application/vnd.kii.InstallationCreationRequest+json';

    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/installations',
      body: {
        deviceType: 'MQTT',
        development: !productionEnvironment
      },
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + thingAccessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 201:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getThingPush(thingAccessToken, installationId, callback) {
    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/installations/' + installationId,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + thingAccessToken,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  deleteThingPush(thingAccessToken, installationId, callback) {
    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/installations/' + installationId,
      json: true,
      method: 'delete',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + thingAccessToken,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getMQTTEndpoint(thingAccessToken, installationId, callback) {
    const options = {
      url: _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/installations/' + installationId + '/mqtt-endpoint',
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + thingAccessToken,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
          case 503:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  onboardThingByUser(vendorThingId, thingPassword, thingType, user, callback) {
    const contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByOwner+json';
    const accessToken = user.getAccessToken();
    const userId = user.getID();
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/onboardings';

    const options = {
      url: url,
      body: {
        vendorThingID: vendorThingId,
        thingPassword: thingPassword,
        thingType: thingType,
        owner: 'user:' + userId
      },
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  onboardExistingThing(thing, thingPassword, callback) {
    const contentType = 'application/vnd.kii.OnboardingWithThingIDByThing+json';
    const accessToken = thing.getAccessToken();
    const thingId = thing.getThingID();
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/onboardings';

    const options = {
      url: url,
      body: {
        thingID: thingId,
        thingPassword: thingPassword
      },
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  onboardThing(vendorThingId, thingPassword, thingType, accessToken, callback) {
    const contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByThing+json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/onboardings';

    const options = {
      url: url,
      body: {
        vendorThingID: vendorThingId,
        thingPassword: thingPassword,
        thingType: thingType
      },
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  registerThingState(thingId, thingState, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/states';

    const options = {
      url: url,
      body: thingState,
      json: true,
      method: 'put',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 201:
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getLatestThingState(thingId, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/states';

    const options = {
      url: url,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  sendThingCommand(thingId, thingCommand, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands';

    const options = {
      url: url,
      body: thingCommand,
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 201:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  sendThingCommandResult(thingId, thingCommandResult, commandId, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands/' + commandId + '/action-results';

    const options = {
      url: url,
      body: thingCommandResult,
      json: true,
      method: 'put',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getThingCommandWithResult(thingId, commandId, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands/' + commandId;

    const options = {
      url: url,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getThingCommandsWithResults(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands';
    if(paginationKey)
      url += '?paginationKey=' + paginationKey;
    if(bestEffortLimit)
      url += '?bestEffortLimit=' + bestEffortLimit;

    const options = {
      url: url,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  registerThingTrigger(thingId, trigger, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    const url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers';

    const options = {
      url: url,
      body: trigger,
      json: true,
      method: 'post',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 201:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getThingTriggerServerCodeResult(thingId, paginationKey, bestEffortLimit, triggerId, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId + '/results/server-code';
    if(paginationKey)
      url += '?paginationKey=' + paginationKey;
    if(bestEffortLimit)
      url += '?bestEffortLimit=' + bestEffortLimit;

    const options = {
      url: url,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  enableOrDisableThingTrigger(thingId, triggerId, enable, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    if(enable)
      url += '/enable';
    else
      url += '/disable';

    const options = {
      url: url,
      json: true,
      method: 'put',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  deleteThingTrigger(thingId, triggerId, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;

    const options = {
      url: url,
      json: true,
      method: 'delete',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  updateThingTrigger(thingId, triggerId, trigger, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;

    const options = {
      url: url,
      json: true,
      body: trigger,
      method: 'patch',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 204:
            callback(null, true);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getThingTrigger(thingId, triggerId, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;

    const options = {
      url: url,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  getThingTriggers(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    const contentType = 'application/json';
    const baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    let url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers';
    if(paginationKey)
      url += '?paginationKey=' + paginationKey;
    if(bestEffortLimit)
      url += '?bestEffortLimit=' + bestEffortLimit;

    const options = {
      url: url,
      json: true,
      method: 'get',
      headers: {
        'X-Kii-AppID': _kii.Kii.getAppID(),
        'X-Kii-AppKey': _kii.Kii.getAppKey(),
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': contentType,
        'Accept': '*/*'
      }
    };

    function _callback(error, response) {
      if(error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 200:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  },
  sendThingScopeObject(thingId, isVendorId, bucketName, data, accessToken, callback) {
    const contentType = 'application/vnd.' + _kii.Kii.getAppID() + '.' + bucketName + '+json';
    let url = _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/';
    if (isVendorId)
      url += 'VENDOR_THING_ID:' + thingId;
    else
      url += thingId;
    url += '/buckets/' + bucketName + '/objects';

    var options = {
      url: url,
      body: data,
      json: true,
      method: 'post',
      headers: {
        "X-Kii-AppID": _kii.Kii.getAppID(),
        "X-Kii-AppKey": _kii.Kii.getAppKey(),
        "Content-Type": contentType,
        "Accept": "*/*",
        "Authorization": "Bearer " + accessToken
      }
    };

    function _callback(error, response) {
      if (error)
        callback(error, null);
      else
        switch (response.statusCode) {
          case 201:
            callback(null, response.body);
            break;
          default:
            callback(response.body, null);
        }
    }

    request(options, _callback);
  }
};