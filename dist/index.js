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
var thingifApp;

console.log('Kii JS SDK v' + _kii.Kii.getSDKVersion());
console.log('Kii JS Thing-IF SDK v' + _thingif.getSDKVersion());

// patch until issue 604 is fixed
// _kii.KiiThingWithToken.prototype.getAccessToken = function () { if (this._accessToken) return this._accessToken; else return this._adminToken; };

function _buildRequestOptions(url, method, body, contentType, accessToken) {
  var options = {
    url: url,
    json: true,
    headers: {
      'X-Kii-AppID': _kii.Kii.getAppID(),
      'X-Kii-AppKey': _kii.Kii.getAppKey(),
      'Accept': '*/*'
    }
  };
  if (method) options.method = method;
  if (body) options.body = body;
  if (contentType) options.headers["Content-Type"] = contentType;
  if (accessToken) options.headers["Authorization"] = 'Bearer ' + accessToken;
  return options;
}

function _sendRequest(url, contentType, method, body, successResponseCode, emptyResponse, accessToken, outerCallback) {
  var options = _buildRequestOptions(url, method, body, contentType, accessToken);
  function innerCallback(error, response) {
    if (error) return outerCallback(error, null);else switch (response.statusCode) {
      case successResponseCode:
        if (emptyResponse) return outerCallback(null, true);else return outerCallback(null, response.body);
        break;
      default:
        return outerCallback(response.body, null);
    }
  }
  request(options, innerCallback);
}

function _sendRequestWithCallback(url, contentType, method, body, accessToken, innerCallback) {
  var options = _buildRequestOptions(url, method, body, contentType, accessToken);
  request(options, innerCallback);
}

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
      _productName: 'Meshlium',
      _lot: 12345,
      _layoutPosition: 'STANDALONE'
    };
    */
    _kii.KiiThing.register(thingFields, {
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
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
            if (error) return callback(error, null);else return callback(null, result);
          });
        } else {
          return callback(error, null);
        }
      } else {
        return callback(null, result);
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
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
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
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
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
      if (error) return callback(error, null);else {
        return callback(null, context.getAuthenticatedThing());
      }
    });
  },
  loadThingWithThingIdByOwner: function loadThingWithThingIdByOwner(thingId, owner, callback) {
    var token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithThingID(thingId, {
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    }, token);
  },
  loadThingWithVendorThingIdByOwner: function loadThingWithVendorThingIdByOwner(vendorThingId, owner, callback) {
    var token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithVendorThingID(vendorThingId, {
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    }, token);
  },
  loadThingWithThingIdByCurrentUser: function loadThingWithThingIdByCurrentUser(thingId, callback) {
    _kii.KiiThing.loadWithThingID(thingId, {
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  loadThingWithVendorThingIdByCurrentUser: function loadThingWithVendorThingIdByCurrentUser(vendorThingId, callback) {
    _kii.KiiThing.loadWithVendorThingID(vendorThingId, {
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  isThingOwner: function isThingOwner(thing, userOrGroup, callback) {
    thing.isOwner(userOrGroup, {
      success: function success(returnedThing, owner, isOwner) {
        if (callback) return callback(null, isOwner);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  registerOwnerSimpleFlow: function registerOwnerSimpleFlow(vendorThingId, userOrGroup, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/things/VENDOR_THING_ID:' + vendorThingId + '/ownership';
    var method = 'put';
    var accessToken = void 0;

    if (this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
      accessToken = userOrGroup.getAccessToken();
    } else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        var currentUser = _kii.Kii.getCurrentUser();
        if (!currentUser) {
          return callback("Adding group as owner requires a Kii user to be logged in", null);
        } else {
          accessToken = currentUser.getAccessToken();
        }
      } else {
        return callback("Candidate owner must be a Kii user or group", null);
      }
    }
    _sendRequest(url, null, method, null, 204, true, accessToken, callback);
  },
  registerOwnerRequestPin: function registerOwnerRequestPin(thing, userOrGroup, initiatedByThing, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/things/' + thing.getThingID() + '/ownership/request';
    var method = 'post';
    var accessToken = void 0,
        currentUser = void 0;

    if (this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
    } else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        currentUser = _kii.Kii.getCurrentUser();
        if (!currentUser) {
          return callback("Adding group as owner requires a Kii user to be logged in", null);
        }
      } else {
        return callback("Candidate owner must be a Kii user or group", null);
      }
    }

    if (initiatedByThing) accessToken = thing.getAccessToken();else {
      if (!currentUser) accessToken = userOrGroup.getAccessToken();else accessToken = currentUser.getAccessToken();
    }
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  registerOwnerValidatePin: function registerOwnerValidatePin(thing, pinCode, initiatedByUser, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/things/' + thing.getThingID() + '/ownership/confirm';
    var contentType = 'application/vnd.kii.ThingOwnershipConfirmationRequest+json';
    var method = 'post';
    var body = {
      code: pinCode
    };
    var accessToken = void 0,
        currentUser = void 0;

    if (!initiatedByUser) accessToken = thing.getAccessToken();else {
      currentUser = _kii.Kii.getCurrentUser();
      if (!currentUser) {
        return callback("Pin validation for adding thing owner initiated by user requires the user to be logged in", null);
      }
      accessToken = currentUser.getAccessToken();
    }
    _sendRequest(url, contentType, method, body, 204, true, accessToken, callback);
  },
  unregisterOwner: function unregisterOwner(thing, userOrGroup, callback) {
    thing.unregisterOwner(userOrGroup, {
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  listThingOwners: function listThingOwners(thing, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/things/' + 'VENDOR_THING_ID:' + thing.getVendorThingID() + '/ownership';
    var method = 'get';
    var accessToken = thing.getAccessToken();
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  enableThing: function enableThing(thing, callback) {
    thing.enable({
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  disableThing: function disableThing(thing, callback) {
    thing.disable({
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  switchThing: function switchThing(thing, callback) {
    if (thing.getDisabled()) this.enableThing(thing, callback);else this.disableThing(thing, callback);
  },
  deleteThing: function deleteThing(thing, callback) {
    thing.deleteThing({
      success: function success(returnedThing) {
        if (callback) return callback(null, returnedThing);
      },
      failure: function failure(error) {
        if (callback) return callback(error, null);
      }
    });
  },
  authenticateAsThing: function authenticateAsThing(vendorThingId, password, callback) {
    _kii.Kii.authenticateAsThing(vendorThingId, password, {
      success: function success(thingAuthContext) {
        if (callback) return callback(null, thingAuthContext);
      },
      failure: function failure(errorString, errorCode) {
        if (callback) return callback(errorString, null);
      }
    });
  },
  isThingRegistered: function isThingRegistered(vendorThingId, callback) {
    // uses auth token from current logged in user
    var currentUser = this.getKiiInstance().Kii.getCurrentUser();
    if (!currentUser) {
      return callback('No Kii user: app user must be logged in', null);
    } else {
      var innerCallback = function innerCallback(error, response) {
        if (error) return callback(error, null);else switch (response.statusCode) {// no body available in this call
          case 204:
            return callback(null, true);
            break;
          case 404:
            return callback(null, false);
            break;
          default:
            return callback(response.body, null);
        }
      };

      var url = thingifApp.getKiiCloudBaseUrl() + '/things/' + 'VENDOR_THING_ID:' + vendorThingId;
      var method = 'head';
      var accessToken = currentUser.getAccessToken();

      _sendRequestWithCallback(url, null, method, null, accessToken, innerCallback);
    }
  },
  getThingInfo: function getThingInfo(vendorThingId, accessToken, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/things/' + 'VENDOR_THING_ID:' + vendorThingId;
    var contentType = 'application/vnd.kii.ThingRetrievalRequest+json';
    var method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
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
      // report error
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
        if (callback) return callback(null, adminContext);
      },
      failure: function failure(errorString, errorCode) {
        if (callback) return callback(errorString, null);
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
  installThingPush: function installThingPush(accessToken, productionEnvironment, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/installations';
    var contentType = 'application/vnd.kii.InstallationCreationRequest+json';
    var method = 'post';
    var body = {
      deviceType: 'MQTT', // TODO provide this as parameter to cover other types
      development: !productionEnvironment
    };
    _sendRequest(url, contentType, method, body, 201, false, accessToken, callback);
  },
  getThingPush: function getThingPush(accessToken, installationId, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/installations/' + installationId;
    var method = 'get';
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  getThingPushes: function getThingPushes(accessToken, thingId, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/installations/?thingID=' + thingId;
    var method = 'get';
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  deleteThingPush: function deleteThingPush(accessToken, installationId, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/installations/' + installationId;
    var method = 'delete';
    _sendRequest(url, null, method, null, 204, true, accessToken, callback);
  },
  getMQTTEndpoint: function getMQTTEndpoint(accessToken, installationId, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/installations/' + installationId + '/mqtt-endpoint';
    var method = 'get';
    function innerCallback(error, response) {
      if (error) return callback(error, null);else switch (response.statusCode) {
        case 200:
        case 503:
          return callback(null, response.body);
          break;
        default:
          return callback(response.body, null);
      }
    }
    _sendRequestWithCallback(url, null, method, null, accessToken, innerCallback);
  },
  onboardWithVendorThingIdByUser: function onboardWithVendorThingIdByUser(vendorThingId, thingPassword, user, thingType, thingProperties, firmwareVersion, dataGroupingInterval, layoutPosition, callback) {
    var accessToken = user.getAccessToken();
    var apiAuthor = this.getThingIFApiAuthor(accessToken);
    var issuerId = new _thingif.TypedID(_thingif.Types.User, user.getID());
    var request = new _thingif.OnboardWithVendorThingIDRequest(vendorThingId, thingPassword, issuerId, thingType, thingProperties, firmwareVersion, dataGroupingInterval, layoutPosition);
    apiAuthor.onboardWithVendorThingID(request, callback);
  },
  onboardWithThingIdByUser: function onboardWithThingIdByUser(thingId, thingPassword, user, dataGroupingInterval, layoutPosition, callback) {
    var accessToken = user.getAccessToken();
    var apiAuthor = this.getThingIFApiAuthor(accessToken);
    var issuerId = new _thingif.TypedID(_thingif.Types.User, user.getID());
    var request = new _thingif.OnboardWithThingIDRequest(thingId, thingPassword, issuerId, dataGroupingInterval, layoutPosition);
    apiAuthor.onboardWithThingID(request, callback);
  },
  onboardWithVendorThingIdByThing: function onboardWithVendorThingIdByThing(vendorThingId, thingPassword, thingType, thingProperties, dataGroupingInterval, layoutPosition, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    var contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByThing+json';
    var method = 'post';
    var body = {
      vendorThingID: vendorThingId,
      thingPassword: thingPassword,
      thingType: thingType,
      thingProperties: thingProperties,
      layoutPosition: layoutPosition,
      dataGroupingInterval: dataGroupingInterval
    };
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardWithThingIdByThing: function onboardWithThingIdByThing(thingId, thingPassword, thingType, thingProperties, dataGroupingInterval, layoutPosition, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    var contentType = 'application/vnd.kii.OnboardingWithThingIDByThing+json';
    var method = 'post';
    var body = {
      thingID: thingId,
      thingPassword: thingPassword,
      thingType: thingType,
      thingProperties: thingProperties,
      layoutPosition: layoutPosition,
      dataGroupingInterval: dataGroupingInterval
    };
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardWithThingIdByOwner: function onboardWithThingIdByOwner(thingId, thingPassword, thingType, thingProperties, userId, dataGroupingInterval, layoutPosition, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    var contentType = 'application/vnd.kii.OnboardingWithThingIDByOwner+json';
    var method = 'post';
    var body = {
      thingID: thingId,
      thingPassword: thingPassword
    };
    if (thingProperties) body.thingProperties = thingProperties;
    if (thingType) body.thingType = thingType;
    if (userId) body.owner = 'USER:' + userId;
    if (layoutPosition) body.layoutPosition = layoutPosition;
    if (dataGroupingInterval) body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardWithVendorThingIdByOwner: function onboardWithVendorThingIdByOwner(vendorThingId, thingPassword, thingType, thingProperties, userId, dataGroupingInterval, layoutPosition, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    var contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByOwner+json';
    var method = 'post';
    var body = {
      vendorThingID: vendorThingId,
      thingPassword: thingPassword
    };
    if (thingProperties) body.thingProperties = thingProperties;
    if (thingType) body.thingType = thingType;
    if (userId) body.owner = 'USER:' + userId;
    if (layoutPosition) body.layoutPosition = layoutPosition;
    if (dataGroupingInterval) body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardMyself: function onboardMyself(thing, thingPassword, callback) {
    this.onboardWithVendorThingIdByThing(thing.getVendorThingID(), thingPassword, '', {}, '1_MINUTE', 'STANDALONE', thing.getAccessToken(), callback);
  },
  onboardEndNodeWithGatewayVendorThingId: function onboardEndNodeWithGatewayVendorThingId(endNodeVendorThingId, endNodePassword, gatewayVendorThingId, endNodeThingProperties, endNodeThingType, userId, dataGroupingInterval, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    var contentType = 'application/vnd.kii.OnboardingEndNodeWithGatewayVendorThingID+json';
    var method = 'post';
    var body = {
      endNodeVendorThingID: endNodeVendorThingId,
      endNodePassword: endNodePassword
    };
    if (endNodeThingProperties) body.endNodeThingProperties = endNodeThingProperties;
    if (endNodeThingType) body.endNodeThingType = endNodeThingType;
    if (userId) body.owner = 'USER:' + userId;
    if (gatewayVendorThingId) body.gatewayVendorThingID = gatewayVendorThingId;
    if (dataGroupingInterval) body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardEndNodeWithGatewayThingId: function onboardEndNodeWithGatewayThingId(endNodeVendorThingId, endNodePassword, gatewayThingId, endNodeThingProperties, endNodeThingType, userId, dataGroupingInterval, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    var contentType = 'application/vnd.kii.OnboardingEndNodeWithGatewayThingID+json';
    var method = 'post';
    var body = {
      endNodeVendorThingID: endNodeVendorThingId,
      endNodePassword: endNodePassword
    };
    if (endNodeThingProperties) body.endNodeThingProperties = endNodeThingProperties;
    if (endNodeThingType) body.endNodeThingType = endNodeThingType;
    if (userId) body.owner = 'USER:' + userId;
    if (gatewayThingId) body.gatewayThingID = gatewayThingId;
    if (dataGroupingInterval) body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  registerThingState: function registerThingState(thingId, thingState, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/states';
    var contentType = 'application/json';
    var method = 'put';
    function innerCallback(error, response) {
      if (error) return callback(error, null);else switch (response.statusCode) {
        case 201:
        case 204:
          return callback(null, true);
          break;
        default:
          return callback(response.body, null);
      }
    }
    _sendRequestWithCallback(url, contentType, method, thingState, accessToken, innerCallback);
  },
  getThingState: function getThingState(thingId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/states';
    var contentType = 'application/json';
    var method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  getThingStates: function getThingStates(thingId, query, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/states/query';
    var contentType = 'application/json';
    var method = 'post';
    _sendRequest(url, contentType, method, query, 200, false, accessToken, callback);
  },
  sendThingCommandWithParameters: function sendThingCommandWithParameters(schemaName, schemaVersion, commandActions, userId, thingId, accessToken, callback) {
    var apiAuthor = this.getThingIFApiAuthor(accessToken);
    var targetId = new _thingif.TypedID(_thingif.Types.Thing, thingId);
    var issuerId = new _thingif.TypedID(_thingif.Types.User, userId);
    var request = new _thingif.PostCommandRequest(schemaName, schemaVersion, commandActions, issuerId);
    apiAuthor.postNewCommand(targetId, request, callback);
  },
  sendThingCommand: function sendThingCommand(thingId, thingCommand, accessToken, callback) {
    // command title, description and metadata will be discarded
    this.sendThingCommandWithParameters(thingCommand.schema, thingCommand.schemaVersion, thingCommand.actions, thingCommand.issuer.replace('user:', ''), thingId, accessToken, callback);
  },
  sendThingCommandResult: function sendThingCommandResult(thingId, thingCommandResult, commandId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/commands/' + commandId + '/action-results';
    var contentType = 'application/json';
    var method = 'put';
    _sendRequest(url, contentType, method, thingCommandResult, 204, true, accessToken, callback);
  },
  getThingCommandWithResult: function getThingCommandWithResult(thingId, commandId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/commands/' + commandId;
    var contentType = 'application/json';
    var method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  getThingCommandsWithResults: function getThingCommandsWithResults(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/commands';
    var contentType = 'application/json';
    var method = 'get';
    if (paginationKey) url += '?paginationKey=' + paginationKey;
    if (bestEffortLimit) url += '?bestEffortLimit=' + bestEffortLimit;
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  registerThingTrigger: function registerThingTrigger(thingId, trigger, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers';
    var contentType = 'application/json';
    var method = 'post';
    _sendRequest(url, contentType, method, trigger, 201, false, accessToken, callback);
  },
  getThingTriggerServerCodeResult: function getThingTriggerServerCodeResult(thingId, paginationKey, bestEffortLimit, triggerId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId + '/results/server-code';
    var contentType = 'application/json';
    var method = 'get';
    if (paginationKey) url += '?paginationKey=' + paginationKey;
    if (bestEffortLimit) url += '?bestEffortLimit=' + bestEffortLimit;
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  enableOrDisableThingTrigger: function enableOrDisableThingTrigger(thingId, triggerId, enable, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    var contentType = 'application/json';
    var method = 'put';
    if (enable) url += '/enable';else url += '/disable';
    _sendRequest(url, contentType, method, null, 204, true, accessToken, callback);
  },
  deleteThingTrigger: function deleteThingTrigger(thingId, triggerId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    var contentType = 'application/json';
    var method = 'delete';
    _sendRequest(url, contentType, method, null, 204, true, accessToken, callback);
  },
  updateThingTrigger: function updateThingTrigger(thingId, triggerId, trigger, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    var contentType = 'application/json';
    var method = 'patch';
    _sendRequest(url, contentType, method, trigger, 204, true, accessToken, callback);
  },
  getThingTrigger: function getThingTrigger(thingId, triggerId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    var contentType = 'application/json';
    var method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  getThingTriggers: function getThingTriggers(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers';
    var contentType = 'application/json';
    var method = 'get';
    if (paginationKey) url += '?paginationKey=' + paginationKey;
    if (bestEffortLimit) url += '?bestEffortLimit=' + bestEffortLimit;
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  sendThingScopeObject: function sendThingScopeObject(thingId, isVendorId, bucketName, data, accessToken, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/things/';
    var contentType = 'application/vnd.' + _kii.Kii.getAppID() + '.' + bucketName + '+json';
    var method = 'post';
    if (isVendorId) url += 'VENDOR_THING_ID:' + thingId;else url += thingId;
    url += '/buckets/' + bucketName + '/objects';
    _sendRequest(url, contentType, method, data, 201, false, accessToken, callback);
  },
  executeServerExtension: function executeServerExtension(endPoint, parameters, accessToken, callback) {
    var url = thingifApp.getKiiCloudBaseUrl() + '/server-code/versions/current/' + endPoint;
    var contentType = 'application/json';
    var method = 'post';
    _sendRequest(url, contentType, method, parameters, 200, false, accessToken, callback);
  },
  getThingIFApiAuthor: function getThingIFApiAuthor(ownerToken) {
    return new _thingif.APIAuthor(ownerToken, this.getThingIFApp());
  },
  getThingIFOnboardOptions: function getThingIFOnboardOptions(vendorThingID, thingPassword, ownerID) {
    return new _thingif.OnboardWithVendorThingIDRequest(vendorThingID, thingPassword, ownerID);
  },
  getVendorThingId: function getVendorThingId(thingId, accessToken, callback) {
    var apiAuthor = this.getThingIFApiAuthor(accessToken);
    apiAuthor.getVendorThingID(thingId).then(function (vendorThingId) {
      return callback(null, vendorThingId);
    }).catch(function (err) {
      return callback(err, null);
    });
  },
  updateVendorThingId: function updateVendorThingId(thingId, newVendorThingId, newPassword, accessToken, callback) {
    var apiAuthor = this.getThingIFApiAuthor(accessToken);
    apiAuthor.updateVendorThingID(thingId, newVendorThingId, newPassword).then(function () {
      return callback(null, true);
    }).catch(function (err) {
      return callback(err, null);
    });
  },
  setThingAsGateway: function setThingAsGateway(thingId, accessToken, callback) {
    var url = thingifApp.getThingIFBaseUrl() + '/things/' + thingId + '/layout-position';
    var contentType = 'application/json';
    var method = 'put';
    var body = { 'layoutPosition': 'GATEWAY' };
    _sendRequest(url, contentType, method, body, 204, true, accessToken, callback);
  }
};