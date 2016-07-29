'use strict';

var _thingIfSdk = require('thing-if-sdk');

var _thingif = _interopRequireWildcard(_thingIfSdk);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Created by germanviscuso on 3/28/16.
 */
require('jquery-xhr');
var _kii = require('kii-cloud-sdk').create();

var request = require('request');
var mqtt = require('mqtt');
var thingifApp = null;

console.log('Kii JS SDK v' + _kii.Kii.getSDKVersion());
console.log('Kii JS Thing-IF SDK v' + _thingif.getSDKVersion());

// patch until issue 604 is fixed
_kii.KiiThingWithToken.prototype.getAccessToken = function () {
  if (this._accessToken) return this._accessToken;else return this._adminToken;
};

module.exports = {

  /**
   Returns the kii-cloud-sdk instance
    @returns {container} The Kii SDK instance
   @example
   // Get Kii SDK instance
   thingNode.getKiiInstance();
   */

  getKiiInstance: function getKiiInstance() {
    return _kii;
  },


  /**
   Returns the thing-if-sdk instance
    @returns {container} The Thing-IF SDK instance
   @example
   // Get Thing-IF SDK instance
   thingNode.getThingIFInstance();
   */

  getThingIFInstance: function getThingIFInstance() {
    return _thingif;
  },


  /**
   Returns the thing-if-sdk app
    @returns {App} The Thing-IF SDK app
   @example
   // Get Thing-IF SDK app
   thingNode.getThingIFApp();
   */

  getThingIFApp: function getThingIFApp() {
    return thingifApp;
  },


  /**
   Returns the kii-cloud-sdk version
    @returns {String} The Kii SDK version
   */

  getKiiSDKVersion: function getKiiSDKVersion() {
    return _kii.Kii.getSDKVersion();
  },


  /**
   Returns the kii-cloud-sdk version
    @returns {String} The Kii SDK version
   */

  getThingIFSDKVersion: function getThingIFSDKVersion() {
    return _thingif.getSDKVersion();
  },


  /** Initialize the Kii SDK and Thing-IF SDK
    Should be the first action your application makes.
   @param String appID The application ID found in your Kii developer console
   @param String appKey The application key found in your Kii developer console
   @param String serverLocation The site location found in your Kii developer console (either US, JP, CN3, SG or EU)
   @example
   // Initialize Kii
   thingNode.initialize('<APP_ID_HERE>', '<APP_KEY_HERE>', <APP_SITE_HERE>);
   */

  initialize: function initialize(appID, appKey, serverLocation) {
    var kiiSite = _kii.KiiSite.US;
    var thingifSite = _thingif.Site.US;
    if (serverLocation === 'US') {
      kiiSite = _kii.KiiSite.US;
      thingifSite = _thingif.Site.US;
    }
    if (serverLocation === 'JP') {
      kiiSite = _kii.KiiSite.JP;
      thingifSite = _thingif.Site.JP;
    }
    if (serverLocation === 'CN3') {
      kiiSite = _kii.KiiSite.CN3;
      thingifSite = _thingif.Site.CN3;
    }
    if (serverLocation === 'SG') {
      kiiSite = _kii.KiiSite.SG;
      thingifSite = _thingif.Site.SG;
    }
    if (serverLocation === 'EU') {
      kiiSite = _kii.KiiSite.EU;
      thingifSite = _thingif.Site.EU;
    }
    _kii.Kii.initializeWithSite(appID, appKey, kiiSite);
    thingifApp = new _thingif.App(appID, appKey, thingifSite);
  },
  isInitialized: function isInitialized() {
    if (_kii.Kii.getAppID()) if (_kii.Kii.getAppKey()) if (_kii.Kii.getBaseURL()) if (thingifApp && thingifApp.appID) if (thingifApp && thingifApp.appKey) if (thingifApp && thingifApp.site) return true;
    return false;
  },
  registerThing: function registerThing(thingFields, callback) {
    /*
    var thingFields = {
      _vendorThingID: 'rBnvSPOXBDF9r29GJeGS',
      _password: '123ABC',
      _thingType: 'sensor',
      _vendor: 'Kii'
    };
    */
    _kii.KiiThing.register(thingFields, {
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  registerOrLoadThing: function registerOrLoadThing(thingFields, callback) {
    var context = this;
    this.registerThing(thingFields, function (error, result) {
      if (error) {
        if (context.isErrorAlreadyExists(error)) {
          var vendorThingId = thingFields._vendorThingID;
          var thingPassword = thingFields._password;
          context.loadThingWithVendorThingId(vendorThingId, thingPassword, function (error, result) {
            if (error) callback(error, null);else callback(null, result);
          });
        } else {
          callback(error, null);
        }
      } else {
        callback(null, result);
      }
    });
  },
  updateThingFields: function updateThingFields(thing, thingFields, callback) {
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
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  getThingFields: function getThingFields(thing) {
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
  setCustomField: function setCustomField(thing, key, value, callback) {
    thing.fields[key] = value;
    thing.update({
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  getCustomField: function getCustomField(thing, key) {
    /*
     var version = thing.fields.version;
     var serialNumber = thing.fields.serialNumber;
     var accuracy = thing.fields.accuracy;
     var isInitialized = thing.fields.isInitialized;
     */
    return thing.fields[key];
  },
  loadThingWithVendorThingId: function loadThingWithVendorThingId(vendorThingId, password, callback) {
    this.authenticateAsThing(vendorThingId, password, function (error, context) {
      if (error) callback(error, null);else {
        var authThing = context.getAuthenticatedThing();
        var token = authThing.getAccessToken();
        _kii.KiiThingWithToken.loadWithVendorThingID(vendorThingId, {
          success: function success(returnedThing) {
            if (callback) callback(null, returnedThing);
          },
          failure: function failure(error) {
            if (callback) callback(error, null);
          }
        }, token);
      }
    });
  },
  loadThingWithThingIdByOwner: function loadThingWithThingIdByOwner(thingId, owner, callback) {
    var token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithThingID(thingId, {
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    }, token);
  },
  loadThingWithVendorThingIdByOwner: function loadThingWithVendorThingIdByOwner(vendorThingId, owner, callback) {
    var token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithVendorThingID(vendorThingId, {
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    }, token);
  },
  loadThingWithThingIdByCurrentUser: function loadThingWithThingIdByCurrentUser(thingId, callback) {
    _kii.KiiThing.loadWithThingID(thingId, {
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  loadThingWithVendorThingIdByCurrentUser: function loadThingWithVendorThingIdByCurrentUser(vendorThingId, callback) {
    _kii.KiiThing.loadWithVendorThingID(vendorThingId, {
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  isThingOwner: function isThingOwner(thing, userOrGroup, callback) {
    thing.isOwner(userOrGroup, {
      success: function success(returnedThing, owner, isOwner) {
        if (callback) callback(null, isOwner);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  registerOwnerSimpleFlow: function registerOwnerSimpleFlow(vendorThingId, userOrGroup, callback) {
    var url = _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/VENDOR_THING_ID:' + vendorThingId + '/ownership';
    var accessToken = void 0;

    if (this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
      accessToken = userOrGroup.getAccessToken();
    } else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        var currentUser = _kii.Kii.getCurrentUser();
        if (!currentUser) {
          callback("Adding group as owner requires a Kii user to be logged in", null);
          return;
        } else {
          accessToken = currentUser.getAccessToken();
        }
      } else {
        callback("Candidate owner must be a Kii user or group", null);
        return;
      }
    }

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  registerOwnerRequestPin: function registerOwnerRequestPin(thing, userOrGroup, initiatedByThing, callback) {
    var url = _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/' + thing.getThingID() + '/ownership/request';
    var accessToken = void 0,
        currentUser = void 0;

    if (this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
    } else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        currentUser = _kii.Kii.getCurrentUser();
        if (!currentUser) {
          callback("Adding group as owner requires a Kii user to be logged in", null);
          return;
        }
      } else {
        callback("Candidate owner must be a Kii user or group", null);
        return;
      }
    }

    if (initiatedByThing) accessToken = thing.getAccessToken();else {
      if (!currentUser) accessToken = userOrGroup.getAccessToken();else accessToken = currentUser.getAccessToken();
    }

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  registerOwnerValidatePin: function registerOwnerValidatePin(thing, pinCode, initiatedByUser, callback) {
    var contentType = 'application/vnd.kii.ThingOwnershipConfirmationRequest+json';
    var accessToken = void 0,
        currentUser = void 0;

    if (!initiatedByUser) accessToken = thing.getAccessToken();else {
      currentUser = _kii.Kii.getCurrentUser();
      if (!currentUser) {
        callback("Pin validation for adding thing owner initiated by user requires the user to be logged in", null);
        return;
      }
      accessToken = currentUser.getAccessToken();
    }

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  unregisterOwner: function unregisterOwner(thing, userOrGroup, callback) {
    thing.unregisterOwner(userOrGroup, {
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  listThingOwners: function listThingOwners(thing, callback) {
    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {// no body available in this call
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  enableThing: function enableThing(thing, callback) {
    thing.enable({
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  disableThing: function disableThing(thing, callback) {
    thing.disable({
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  switchThing: function switchThing(thing, callback) {
    if (thing.getDisabled()) this.enableThing(thing, callback);else this.disableThing(thing, callback);
  },
  deleteThing: function deleteThing(thing, callback) {
    thing.deleteThing({
      success: function success(returnedThing) {
        if (callback) callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) callback(error, null);
      }
    });
  },
  authenticateAsThing: function authenticateAsThing(vendorThingId, password, callback) {
    _kii.Kii.authenticateAsThing(vendorThingId, password, {
      success: function success(thingAuthContext) {
        if (callback) callback(null, thingAuthContext);
      },
      failure: function failure(errorString, errorCode) {
        if (callback) callback(errorString, null);
      }
    });
  },
  isThingRegistered: function isThingRegistered(vendorThingId, callback) {
    // uses auth token from current logged in user
    var currentUser = this.getKiiInstance().Kii.getCurrentUser();
    if (!currentUser) {
      callback('No Kii user: app user must be logged in', null);
    } else {
      var _callback = function _callback(error, response) {
        if (error) callback(error, null);else switch (response.statusCode) {// no body available in this call
          case 204:
            callback(null, true);
            break;
          case 404:
            callback(null, false);
            break;
          default:
            callback(response.body, null);
        }
      };

      var options = {
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

      request(options, _callback);
    }
  },
  getThingInfo: function getThingInfo(vendorThingId, accessToken, callback) {
    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  connectMqtt: function connectMqtt(serverUrl, port, username, password, clientId) {
    var client = mqtt.connect(serverUrl, {
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
  authenticateAsAdmin: function authenticateAsAdmin(clientId, clientSecret, callback) {
    _kii.Kii.authenticateAsAppAdmin(clientId, clientSecret, {
      success: function success(adminContext) {
        if (callback) callback(null, adminContext);
      },
      failure: function failure(errorString, errorCode) {
        if (callback) callback(errorString, null);
      }
    });
  },
  isKiiThing: function isKiiThing(object) {
    return object.constructor.name == 'KiiThing';
  },
  isKiiThingWithToken: function isKiiThingWithToken(object) {
    return object.constructor.name == 'KiiThingWithToken';
  },
  isKiiUser: function isKiiUser(object) {
    return object.constructor.name == 'KiiUser';
  },
  isKiiGroup: function isKiiGroup(object) {
    return object.constructor.name == 'KiiGroup';
  },
  isErrorAlreadyExists: function isErrorAlreadyExists(object) {
    return object.constructor.name == 'Error' && object.message.indexOf('THING_ALREADY_EXISTS') > -1;
  },
  isErrorUnknownThing: function isErrorUnknownThing(object) {
    return object.constructor.name == 'Error' && (object.message.indexOf('statusCode: 400 error code: invalid_grant') > -1 || object.message.indexOf('THING_NOT_FOUND') > -1);
  },
  installThingPush: function installThingPush(thingAccessToken, productionEnvironment, callback) {
    var contentType = 'application/vnd.kii.InstallationCreationRequest+json';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 201:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingPush: function getThingPush(thingAccessToken, installationId, callback) {
    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  deleteThingPush: function deleteThingPush(thingAccessToken, installationId, callback) {
    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getMQTTEndpoint: function getMQTTEndpoint(thingAccessToken, installationId, callback) {
    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
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
  onboardThingByUser: function onboardThingByUser(vendorThingId, thingPassword, thingType, user, callback) {
    var accessToken = user.getAccessToken();
    var userId = user.getID();
    var apiAuthor = this.getThingIFApiAuthor(accessToken);
    var onboardOptions = this.getThingIFOnboardOptions(vendorThingId, thingPassword, 'USER:' + userId);
    apiAuthor.onboardWithVendorThingID(onboardOptions, callback);
    //var owner = new thingIFSDK.TypedID(thingIFSDK.Types.User, user.userID);
    //var request = new thingIFSDK.OnboardWithVendorThingIDRequest(vendorThingID, password, owner);
  },
  onboardExistingThing: function onboardExistingThing(thing, thingPassword, callback) {
    var contentType = 'application/vnd.kii.OnboardingWithThingIDByThing+json';
    var accessToken = thing.getAccessToken();
    var thingId = thing.getThingID();
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/onboardings';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  onboardThing: function onboardThing(vendorThingId, thingPassword, thingType, accessToken, callback) {
    var contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByThing+json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/onboardings';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  registerThingState: function registerThingState(thingId, thingState, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/states';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
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
  getLatestThingState: function getLatestThingState(thingId, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/states';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  sendThingCommand: function sendThingCommand(thingId, thingCommand, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 201:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  sendThingCommandResult: function sendThingCommandResult(thingId, thingCommandResult, commandId, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands/' + commandId + '/action-results';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingCommandWithResult: function getThingCommandWithResult(thingId, commandId, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands/' + commandId;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingCommandsWithResults: function getThingCommandsWithResults(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/commands';
    if (paginationKey) url += '?paginationKey=' + paginationKey;
    if (bestEffortLimit) url += '?bestEffortLimit=' + bestEffortLimit;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  registerThingTrigger: function registerThingTrigger(thingId, trigger, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 201:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingTriggerServerCodeResult: function getThingTriggerServerCodeResult(thingId, paginationKey, bestEffortLimit, triggerId, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId + '/results/server-code';
    if (paginationKey) url += '?paginationKey=' + paginationKey;
    if (bestEffortLimit) url += '?bestEffortLimit=' + bestEffortLimit;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  enableOrDisableThingTrigger: function enableOrDisableThingTrigger(thingId, triggerId, enable, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    if (enable) url += '/enable';else url += '/disable';

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  deleteThingTrigger: function deleteThingTrigger(thingId, triggerId, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  updateThingTrigger: function updateThingTrigger(thingId, triggerId, trigger, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 204:
          callback(null, true);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingTrigger: function getThingTrigger(thingId, triggerId, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers/' + triggerId;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingTriggers: function getThingTriggers(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    var contentType = 'application/json';
    var baseUrl = _kii.Kii.getBaseURL().substring(0, _kii.Kii.getBaseURL().length - 4);
    var url = baseUrl + '/thing-if/apps/' + _kii.Kii.getAppID() + '/targets/thing:' + thingId + '/triggers';
    if (paginationKey) url += '?paginationKey=' + paginationKey;
    if (bestEffortLimit) url += '?bestEffortLimit=' + bestEffortLimit;

    var options = {
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 200:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  sendThingScopeObject: function sendThingScopeObject(thingId, isVendorId, bucketName, data, accessToken, callback) {
    var contentType = 'application/vnd.' + _kii.Kii.getAppID() + '.' + bucketName + '+json';
    var url = _kii.Kii.getBaseURL() + '/apps/' + _kii.Kii.getAppID() + '/things/';
    if (isVendorId) url += 'VENDOR_THING_ID:' + thingId;else url += thingId;
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
      if (error) callback(error, null);else switch (response.statusCode) {
        case 201:
          callback(null, response.body);
          break;
        default:
          callback(response.body, null);
      }
    }

    request(options, _callback);
  },
  getThingIFApiAuthor: function getThingIFApiAuthor(ownerToken) {
    return new _thingif.APIAuthor(ownerToken, this.getThingIFApp());
  },
  getThingIFOnboardOptions: function getThingIFOnboardOptions(vendorThingID, thingPassword, ownerID) {
    return new _thingif.OnboardWithVendorThingIDRequest(vendorThingID, thingPassword, ownerID);
  }
};