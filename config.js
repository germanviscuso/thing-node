var config = {};

config.kii = {};
// Replace the nulls with your own after app creation at developer.kii.com
config.kii.appId = process.env.KII_APP_ID || null;
config.kii.appKey =  process.env.KII_APP_KEY || null;
config.kii.appSite =  process.env.KII_APP_SITE || null;

module.exports = config;
