// Cấu hình Metro cho Expo
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tùy chỉnh resolver để xử lý đúng các import module
config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  assetExts: ['ttf', 'png', 'jpg', 'jpeg', 'svg'],
};

module.exports = config;
