module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './app',
            '@services': './src/services',
            '@store': './src/store',
            '@hooks': './src/hooks',
          },
        },
      ],
      'react-native-reanimated/plugin', // Siempre debe ir al final
    ],
  };
};
