module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@services': './src/services',
            '@components': './src/components',
            '@screens': './src/screens',
            '@context': './src/context',
            '@navigation': './src/navigation',
            '@assets': './src/assets',
            '@constants': './src/constants',
            '@utils': './src/utils'
          }
        }
      ]
    ]
  };
};
