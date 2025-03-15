// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

// Metro configuration
const config = getDefaultConfig(__dirname);

// Cấu hình bổ sung để giải quyết vấn đề module resolution
config.resolver.extraNodeModules = {
  'date-fns/locale': require.resolve('date-fns/locale')
};

module.exports = config;
