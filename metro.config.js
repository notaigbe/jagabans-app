const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Turbo-compatible cache restore
  config.cacheStores = [
    new FileStore({
      root: path.join(__dirname, 'node_modules', '.cache', 'metro'),
    }),
  ];

  // Do NOT override sourceExts — Expo owns this
  // Do NOT override platforms — Expo owns this

  // Safe blockList override (preserves Expo defaults)
  // const nativeBlock = /\.native\.(tsx)$/;

  // if (config.resolver.blockList) {
  //   config.resolver.blockList.push(nativeBlock);
  // } else {
  //   config.resolver.blockList = [nativeBlock];
  // }

  return config;
})();
