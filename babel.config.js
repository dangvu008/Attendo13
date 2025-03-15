module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@utils': './src/utils',
            '@components': './src/components',
            '@screens': './src/screens',
            '@context': './src/context',
            '@services': './src/services',
            '@navigation': './src/navigation',
            '@localization': './src/localization'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        }
      ]
    ]
  };
};
