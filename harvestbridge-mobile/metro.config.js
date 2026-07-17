process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK =
  process.env.EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK ?? '1';

const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
