// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add this to ensure proper resolution of date-fns/locale and other modules
config.resolver.extraNodeModules = {
  'date-fns/locale': require.resolve('date-fns/locale')
};

// Add file mappings to ensure proper imports
config.resolver.assetExts.push('js');

module.exports = config;
