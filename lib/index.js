/**
 * Created by germanviscuso on 3/28/16.
 */
require('jquery-xhr');
const _kii = require('kii-cloud-sdk').create();
import * as _thingif from 'thing-if-sdk';
const request = require('request');
const mqtt = require('mqtt');
var thingifApp;

console.log('Kii JS SDK v' + _kii.Kii.getSDKVersion());
console.log('Kii JS Thing-IF SDK v' + _thingif.getSDKVersion());

// patch until issue 604 is fixed
// _kii.KiiThingWithToken.prototype.getAccessToken = function () { if (this._accessToken) return this._accessToken; else return this._adminToken; };

function _buildRequestOptions(url, method, body, contentType, accessToken) {
  const options = {
    url: url,
    json: true,
    headers: {
      'X-Kii-AppID': _kii.Kii.getAppID(),
      'X-Kii-AppKey': _kii.Kii.getAppKey(),
      'Accept': '*/*'
    }
  };
  if(method)
    options.method = method;
  if(body)
    options.body = body;
  if(contentType)
    options.headers["Content-Type"] = contentType;
  if(accessToken)
    options.headers["Authorization"] = 'Bearer ' + accessToken;
  return options;
}

function _sendRequest(url, contentType, method, body, successResponseCode, emptyResponse, accessToken, outerCallback) {
  const options = _buildRequestOptions(url, method, body, contentType, accessToken);
  function innerCallback(error, response) {
    if(error)
      return outerCallback(error, null);
    else
      switch (response.statusCode) {
        case successResponseCode:
          if(emptyResponse)
            return outerCallback(null, true);
          else
            return outerCallback(null, response.body);
          break;
        default:
          return outerCallback(response.body, null);
      }
  }
  request(options, innerCallback);
}

function _sendRequestWithCallback(url, contentType, method, body, accessToken, innerCallback) {
  const options = _buildRequestOptions(url, method, body, contentType, accessToken);
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

  getKiiInstance() {
    return _kii;
  },

  /**
   Returns the thing-if-sdk instance

   @returns {container} The Thing-IF SDK instance
   @example
   // Get Thing-IF SDK instance
   thingNode.getThingIFInstance();
   */

  getThingIFInstance() {
    return _thingif;
  },

  /**
   Returns the thing-if-sdk app

   @returns {App} The Thing-IF SDK app
   @example
   // Get Thing-IF SDK app
   thingNode.getThingIFApp();
   */

  getThingIFApp() {
    return thingifApp;
  },

  /**
   Returns the kii-cloud-sdk version

   @returns {String} The Kii SDK version
   */

  getKiiSDKVersion() {
    return _kii.Kii.getSDKVersion();
  },

  /**
   Returns the kii-cloud-sdk version

   @returns {String} The Kii SDK version
   */

  getThingIFSDKVersion() {
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

  initialize(appID, appKey, serverLocation) {
    let kiiSite = _kii.KiiSite.US;
    let thingifSite = _thingif.Site.US;
    if (serverLocation === 'US') {
      kiiSite = _kii.KiiSite.US;
      thingifSite = _thingif.Site.US;
    }
    if (serverLocation === 'JP') {
      kiiSite = _kii.KiiSite.JP;
      thingifSite = _thingif.Site.JP
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
  isInitialized() {
    if (_kii.Kii.getAppID())
      if (_kii.Kii.getAppKey())
        if(_kii.Kii.getBaseURL())
          if(thingifApp && thingifApp.appID)
            if(thingifApp && thingifApp.appKey)
              if(thingifApp && thingifApp.site)
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
      _productName: 'Meshlium',
      _lot: 12345,
      _layoutPosition: 'STANDALONE'
    };
    */
    _kii.KiiThing.register(thingFields, {
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  registerOrLoadThing(thingFields, callback) {
    const context = this;
    this.registerThing(thingFields, function (error, result) {
      if (error) {
        if(context.isErrorAlreadyExists(error)) {
          const vendorThingId = thingFields._vendorThingID;
          const thingPassword = thingFields._password;
          context.loadThingWithVendorThingId(vendorThingId, thingPassword, function (error, result) {
            if(error)
              return callback(error, null)
            else
              return callback(null, result);
          });
        } else {
          return callback(error, null);
        }
      } else {
        return callback(null, result);
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
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
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
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
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
    this.authenticateAsThing(vendorThingId, password, function (error, context) {
      if(error)
        return callback(error, null);
      else {
        return callback(null, context.getAuthenticatedThing());
      }
    });
  },
  loadThingWithThingIdByOwner(thingId, owner, callback) {
    const token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithThingID(thingId, {
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    }, token);
  },
  loadThingWithVendorThingIdByOwner(vendorThingId, owner, callback) {
    const token = owner.getAccessToken();
    _kii.KiiThingWithToken.loadWithVendorThingID(vendorThingId, {
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    }, token);
  },
  loadThingWithThingIdByCurrentUser(thingId, callback) {
    _kii.KiiThing.loadWithThingID(thingId, {
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  loadThingWithVendorThingIdByCurrentUser(vendorThingId, callback) {
    _kii.KiiThing.loadWithVendorThingID(vendorThingId, {
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  isThingOwner(thing, userOrGroup, callback) {
    thing.isOwner(userOrGroup, {
      success(returnedThing, owner, isOwner) {
        if (callback)
          return callback(null, isOwner);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  registerOwnerSimpleFlow(vendorThingId, userOrGroup, callback) {
    let url = thingifApp.getKiiCloudBaseUrl() + '/things/VENDOR_THING_ID:' + vendorThingId + '/ownership';
    const method = 'put';
    let accessToken;

    if(this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
      accessToken = userOrGroup.getAccessToken();
    }
    else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        const currentUser = _kii.Kii.getCurrentUser();
        if(!currentUser) {
          return callback("Adding group as owner requires a Kii user to be logged in", null);
        } else {
          accessToken = currentUser.getAccessToken();
        }
      }
      else {
        return callback("Candidate owner must be a Kii user or group", null);
      }
    }
    _sendRequest(url, null, method, null, 204, true, accessToken, callback);
  },
  registerOwnerRequestPin(thing, userOrGroup, initiatedByThing, callback) {
    let url = thingifApp.getKiiCloudBaseUrl() + '/things/' + thing.getThingID() + '/ownership/request';
    const method = 'post';
    let accessToken, currentUser;

    if(this.isKiiUser(userOrGroup)) {
      url += '/user:' + userOrGroup.getID();
    }
    else {
      if (this.isKiiGroup(userOrGroup)) {
        url += '/group:' + userOrGroup.getID();
        currentUser = _kii.Kii.getCurrentUser();
        if(!currentUser) {
          return callback("Adding group as owner requires a Kii user to be logged in", null);
        }
      }
      else {
        return callback("Candidate owner must be a Kii user or group", null);
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
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  registerOwnerValidatePin(thing, pinCode, initiatedByUser, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/things/' + thing.getThingID() + '/ownership/confirm';
    const contentType = 'application/vnd.kii.ThingOwnershipConfirmationRequest+json';
    const method = 'post';
    const body = {
      code: pinCode
    };
    let accessToken, currentUser;

    if(!initiatedByUser)
      accessToken = thing.getAccessToken();
    else {
      currentUser = _kii.Kii.getCurrentUser();
      if(!currentUser) {
        return callback("Pin validation for adding thing owner initiated by user requires the user to be logged in", null);
      }
      accessToken = currentUser.getAccessToken();
    }
    _sendRequest(url, contentType, method, body, 204, true, accessToken, callback);
  },
  unregisterOwner(thing, userOrGroup, callback) {
    thing.unregisterOwner(userOrGroup, {
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  listThingOwners(thing, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/things/' + 'VENDOR_THING_ID:' + thing.getVendorThingID() + '/ownership';
    const method = 'get';
    const accessToken = thing.getAccessToken();
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  enableThing(thing, callback) {
    thing.enable({
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  disableThing(thing, callback) {
    thing.disable({
      success(returnedThing) {
        if (callback)
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
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
          return callback(null, returnedThing);
      },
      failure(error) {
        if (callback)
          return callback(error, null);
      }
    });
  },
  authenticateAsThing(vendorThingId, password, callback) {
    _kii.Kii.authenticateAsThing(vendorThingId, password, {
      success: function (thingAuthContext) {
        if (callback)
          return callback(null, thingAuthContext);
      },
      failure: function (errorString, errorCode) {
        if (callback)
          return callback(errorString, null);
      }
    });
  },
  isThingRegistered(vendorThingId, callback) {
    // uses auth token from current logged in user
    const currentUser = this.getKiiInstance().Kii.getCurrentUser();
    if(!currentUser) {
      return callback('No Kii user: app user must be logged in', null);
    } else {
      const url = thingifApp.getKiiCloudBaseUrl() + '/things/' + 'VENDOR_THING_ID:' + vendorThingId;
      const method = 'head';
      const accessToken = currentUser.getAccessToken();
      function innerCallback(error, response) {
        if(error)
          return callback(error, null);
        else
          switch (response.statusCode) { // no body available in this call
            case 204:
              return callback(null, true);
              break;
            case 404:
              return callback(null, false);
              break;
            default:
              return callback(response.body, null);
          }
      }
      _sendRequestWithCallback(url, null, method, null, accessToken, innerCallback);
    }
  },
  getThingInfo(vendorThingId, accessToken, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/things/' + 'VENDOR_THING_ID:' + vendorThingId;
    const contentType = 'application/vnd.kii.ThingRetrievalRequest+json';
    const method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
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
      // report error
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
          return callback(null, adminContext);
      },
      failure: function (errorString, errorCode) {
        if (callback)
          return callback(errorString, null);
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
  installThingPush(accessToken, productionEnvironment, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/installations';
    const contentType = 'application/vnd.kii.InstallationCreationRequest+json';
    const method = 'post';
    const body = {
      deviceType: 'MQTT', // TODO provide this as parameter to cover other types
      development: !productionEnvironment
    };
    _sendRequest(url, contentType, method, body, 201, false, accessToken, callback);
  },
  getThingPush(accessToken, installationId, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/installations/' + installationId;
    const method = 'get';
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  getThingPushes(accessToken, thingId, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/installations/?thingID=' + thingId;
    const method = 'get';
    _sendRequest(url, null, method, null, 200, false, accessToken, callback);
  },
  deleteThingPush(accessToken, installationId, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/installations/' + installationId;
    const method = 'delete';
    _sendRequest(url, null, method, null, 204, true, accessToken, callback);
  },
  getMQTTEndpoint(accessToken, installationId, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/installations/' + installationId + '/mqtt-endpoint';
    const method = 'get';
    function innerCallback(error, response) {
      if(error)
        return callback(error, null);
      else
        switch (response.statusCode) {
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
  onboardWithVendorThingIdByUser(vendorThingId, thingPassword, user, thingType, thingProperties, firmwareVersion, dataGroupingInterval, layoutPosition, callback) {
    const accessToken = user.getAccessToken();
    const apiAuthor = this.getThingIFApiAuthor(accessToken);
    const issuerId = new _thingif.TypedID(_thingif.Types.User, user.getID());
    const request = new _thingif.OnboardWithVendorThingIDRequest(vendorThingId, thingPassword, issuerId, thingType, thingProperties, firmwareVersion, dataGroupingInterval, layoutPosition);
    apiAuthor.onboardWithVendorThingID(request, callback);
  },
  onboardWithThingIdByUser(thingId, thingPassword, user, dataGroupingInterval, layoutPosition, callback) {
    const accessToken = user.getAccessToken();
    const apiAuthor = this.getThingIFApiAuthor(accessToken);
    const issuerId = new _thingif.TypedID(_thingif.Types.User, user.getID());
    const request = new _thingif.OnboardWithThingIDRequest(thingId, thingPassword, issuerId, dataGroupingInterval, layoutPosition);
    apiAuthor.onboardWithThingID(request, callback);
  },
  onboardWithVendorThingIdByThing(vendorThingId, thingPassword, thingType, thingProperties, dataGroupingInterval, layoutPosition, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    const contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByThing+json';
    const method = 'post';
    const body = {
      vendorThingID: vendorThingId,
      thingPassword: thingPassword,
      thingType: thingType,
      thingProperties: thingProperties,
      layoutPosition: layoutPosition,
      dataGroupingInterval: dataGroupingInterval
    };
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardWithThingIdByThing(thingId, thingPassword, thingType, thingProperties, dataGroupingInterval, layoutPosition, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    const contentType = 'application/vnd.kii.OnboardingWithThingIDByThing+json';
    const method = 'post';
    const body = {
      thingID: thingId,
      thingPassword: thingPassword,
      thingType: thingType,
      thingProperties: thingProperties,
      layoutPosition: layoutPosition,
      dataGroupingInterval: dataGroupingInterval
    };
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardWithThingIdByOwner(thingId, thingPassword, thingType, thingProperties, userId, dataGroupingInterval, layoutPosition, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    const contentType = 'application/vnd.kii.OnboardingWithThingIDByOwner+json';
    const method = 'post';
    const body = {
      thingID: thingId,
      thingPassword: thingPassword
    };
    if(thingProperties)
      body.thingProperties = thingProperties;
    if(thingType)
      body.thingType = thingType;
    if(userId)
      body.owner = 'USER:' + userId;
    if(layoutPosition)
      body.layoutPosition = layoutPosition;
    if(dataGroupingInterval)
      body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardWithVendorThingIdByOwner(vendorThingId, thingPassword, thingType, thingProperties, userId, dataGroupingInterval, layoutPosition, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    const contentType = 'application/vnd.kii.OnboardingWithVendorThingIDByOwner+json';
    const method = 'post';
    const body = {
      vendorThingID: vendorThingId,
      thingPassword: thingPassword
    };
    if(thingProperties)
      body.thingProperties = thingProperties;
    if(thingType)
      body.thingType = thingType;
    if(userId)
      body.owner = 'USER:' + userId;
    if(layoutPosition)
      body.layoutPosition = layoutPosition;
    if(dataGroupingInterval)
      body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardMyself(thing, thingPassword, callback) {
    this.onboardWithVendorThingIdByThing(thing.getVendorThingID(), thingPassword, '', {}, '1_MINUTE', 'STANDALONE', thing.getAccessToken(), callback);
  },
  onboardEndNodeWithGatewayVendorThingId(endNodeVendorThingId, endNodePassword, gatewayVendorThingId, endNodeThingProperties, endNodeThingType, userId, dataGroupingInterval, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    const contentType = 'application/vnd.kii.OnboardingEndNodeWithGatewayVendorThingID+json';
    const method = 'post';
    const body = {
      endNodeVendorThingID: endNodeVendorThingId,
      endNodePassword: endNodePassword
    };
    if(endNodeThingProperties)
      body.endNodeThingProperties = endNodeThingProperties;
    if(endNodeThingType)
      body.endNodeThingType = endNodeThingType;
    if(userId)
      body.owner = 'USER:' + userId;
    if(gatewayVendorThingId)
      body.gatewayVendorThingID = gatewayVendorThingId;
    if(dataGroupingInterval)
      body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  onboardEndNodeWithGatewayThingId(endNodeVendorThingId, endNodePassword, gatewayThingId, endNodeThingProperties, endNodeThingType, userId, dataGroupingInterval, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/onboardings';
    const contentType = 'application/vnd.kii.OnboardingEndNodeWithGatewayThingID+json';
    const method = 'post';
    const body = {
      endNodeVendorThingID: endNodeVendorThingId,
      endNodePassword: endNodePassword
    };
    if(endNodeThingProperties)
      body.endNodeThingProperties = endNodeThingProperties;
    if(endNodeThingType)
      body.endNodeThingType = endNodeThingType;
    if(userId)
      body.owner = 'USER:' + userId;
    if(gatewayThingId)
      body.gatewayThingID = gatewayThingId;
    if(dataGroupingInterval)
      body.dataGroupingInterval = dataGroupingInterval;
    _sendRequest(url, contentType, method, body, 200, false, accessToken, callback);
  },
  registerThingState(thingId, thingState, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/states';
    const contentType = 'application/json';
    const method = 'put';
    function innerCallback(error, response) {
      if(error)
        return callback(error, null);
      else
        switch (response.statusCode) {
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
  getThingState(thingId, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/states';
    const contentType = 'application/json';
    const method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  getThingStates(thingId, query, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/states/query';
    const contentType = 'application/json';
    const method = 'post';
    _sendRequest(url, contentType, method, query, 200, false, accessToken, callback);
  },
  sendThingCommandWithParameters(schemaName, schemaVersion, commandActions, userId, thingId, accessToken, callback) {
    const apiAuthor = this.getThingIFApiAuthor(accessToken);
    const targetId = new _thingif.TypedID(_thingif.Types.Thing, thingId);
    const issuerId = new _thingif.TypedID(_thingif.Types.User, userId);
    const request = new _thingif.PostCommandRequest(
      schemaName,
      schemaVersion,
      commandActions,
      issuerId
    );
    apiAuthor.postNewCommand(targetId, request, callback);
  },
  sendThingCommand(thingId, thingCommand, accessToken, callback) {
    // command title, description and metadata will be discarded
    this.sendThingCommandWithParameters(
      thingCommand.schema,
      thingCommand.schemaVersion,
      thingCommand.actions,
      thingCommand.issuer.replace('user:', ''),
      thingId,
      accessToken,
      callback
    );
  },
  sendThingCommandResult(thingId, thingCommandResult, commandId, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/commands/' + commandId + '/action-results';
    const contentType = 'application/json';
    const method = 'put';
    _sendRequest(url, contentType, method, thingCommandResult, 204, true, accessToken, callback);
  },
  getThingCommandWithResult(thingId, commandId, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/commands/' + commandId;
    const contentType = 'application/json';
    const method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  getThingCommandsWithResults(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    let url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/commands';
    const contentType = 'application/json';
    const method = 'get';
    if(paginationKey)
      url += '?paginationKey=' + paginationKey;
    if(bestEffortLimit)
      url += '?bestEffortLimit=' + bestEffortLimit;
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  registerThingTrigger(thingId, trigger, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers';
    const contentType = 'application/json';
    const method = 'post';
    _sendRequest(url, contentType, method, trigger, 201, false, accessToken, callback);
  },
  getThingTriggerServerCodeResult(thingId, paginationKey, bestEffortLimit, triggerId, accessToken, callback) {
    let url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId + '/results/server-code';
    const contentType = 'application/json';
    const method = 'get';
    if(paginationKey)
      url += '?paginationKey=' + paginationKey;
    if(bestEffortLimit)
      url += '?bestEffortLimit=' + bestEffortLimit;
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  enableOrDisableThingTrigger(thingId, triggerId, enable, accessToken, callback) {
    let url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    const contentType = 'application/json';
    const method = 'put';
    if(enable)
      url += '/enable';
    else
      url += '/disable';
    _sendRequest(url, contentType, method, null, 204, true, accessToken, callback);
  },
  deleteThingTrigger(thingId, triggerId, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    const contentType = 'application/json';
    const method = 'delete';
    _sendRequest(url, contentType, method, null, 204, true, accessToken, callback);
  },
  updateThingTrigger(thingId, triggerId, trigger, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl()+ '/targets/thing:' + thingId + '/triggers/' + triggerId;
    const contentType = 'application/json';
    const method = 'patch';
    _sendRequest(url, contentType, method, trigger, 204, true, accessToken, callback);
  },
  getThingTrigger(thingId, triggerId, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers/' + triggerId;
    const contentType = 'application/json';
    const method = 'get';
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  getThingTriggers(thingId, paginationKey, bestEffortLimit, accessToken, callback) {
    let url = thingifApp.getThingIFBaseUrl() + '/targets/thing:' + thingId + '/triggers';
    const contentType = 'application/json';
    const method = 'get';
    if(paginationKey)
      url += '?paginationKey=' + paginationKey;
    if(bestEffortLimit)
      url += '?bestEffortLimit=' + bestEffortLimit;
    _sendRequest(url, contentType, method, null, 200, false, accessToken, callback);
  },
  sendThingScopeObject(thingId, isVendorId, bucketName, data, accessToken, callback) {
    let url = thingifApp.getKiiCloudBaseUrl() + '/things/';
    const contentType = 'application/vnd.' + _kii.Kii.getAppID() + '.' + bucketName + '+json';
    const method = 'post';
    if (isVendorId)
      url += 'VENDOR_THING_ID:' + thingId;
    else
      url += thingId;
    url += '/buckets/' + bucketName + '/objects';
    _sendRequest(url, contentType, method, data, 201, false, accessToken, callback);
  },
  executeServerExtension(endPoint, parameters, accessToken, callback) {
    const url = thingifApp.getKiiCloudBaseUrl() + '/server-code/versions/current/' + endPoint;
    const contentType = 'application/json';
    const method = 'post';
    _sendRequest(url, contentType, method, parameters, 200, false, accessToken, callback);
  },
  getThingIFApiAuthor(ownerToken) {
    return new _thingif.APIAuthor(ownerToken , this.getThingIFApp());
  },
  getThingIFOnboardOptions(vendorThingID, thingPassword, ownerID) {
    return new _thingif.OnboardWithVendorThingIDRequest(vendorThingID, thingPassword, ownerID);
  },
  getVendorThingId(thingId, accessToken, callback) {
    const apiAuthor = this.getThingIFApiAuthor(accessToken);
    apiAuthor.getVendorThingID(thingId).then(function (vendorThingId) {
      return callback(null, vendorThingId);
    }).catch(function (err){
      return callback(err, null);
    });
  },
  updateVendorThingId(thingId, newVendorThingId, newPassword, accessToken, callback) {
    const apiAuthor = this.getThingIFApiAuthor(accessToken);
    apiAuthor.updateVendorThingID(thingId, newVendorThingId, newPassword).then(function () {
      return callback(null, true);
    }).catch(function (err){
      return callback(err, null);
    });
  },
  setThingAsGateway(thingId, accessToken, callback) {
    const url = thingifApp.getThingIFBaseUrl()+ '/things/' + thingId + '/layout-position';
    const contentType = 'application/json';
    const method = 'put';
    const body = {'layoutPosition': 'GATEWAY'};
    _sendRequest(url, contentType, method, body, 204, true, accessToken, callback);
  }
};
