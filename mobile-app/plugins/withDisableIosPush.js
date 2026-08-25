const { withEntitlementsPlist } = require('@expo/config-plugins');

const withDisableIosPush = (config) => {
  return withEntitlementsPlist(config, (config) => {
    // This deletes the push notification requirement from iOS
    delete config.modResults['aps-environment'];
    return config;
  });
};

module.exports = withDisableIosPush;