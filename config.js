var config = {};

config.kii = {};
// These parameters are only used by tests and demos in this project
// Replace the nulls with your own or export the environment variables
// by copying the parameters when creating an app at developer.kii.com
config.kii.appId = process.env.KII_APP_ID || null;
config.kii.appKey = process.env.KII_APP_KEY || null;
config.kii.appSite = process.env.KII_APP_SITE || null;

module.exports = config;
